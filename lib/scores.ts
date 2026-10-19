import type { Firestore } from 'firebase-admin/firestore';
import { periodStarts } from './periods';

export { periodStarts };

/**
 * Logos puan sistemi. Puanlar forumdaki gerçek veriden sunucuda hesaplanır;
 * istemci puan yazamaz, bu yüzden değiştirilemez.
 *
 *   Gönderin ya da yanıtın beğenilmesi              +2 (her beğeni)
 *   Gönderin ya da yanıtın yer işaretlerine eklenmesi +2 (her kayıt)
 *   Gönderin ya da yanıtın yeniden paylaşılması      +3 (her paylaşım)
 *
 * Gönderi ya da yanıt yazmak tek başına puan kazandırmaz (spam'i ödüllendirmemek için);
 * yalnızca başkalarının içeriğe gösterdiği ilgi sayılır. Kendi içeriğine yapılan etkileşim
 * ve isimsiz içerik puan kazandırmaz.
 * Her 100 puanda bir seviye atlanır. Haftalık ve aylık sıralama, o dönemde
 * paylaşılan gönderi ve yanıtlardan toplanan puanlara göre yapılır; bu yüzden haftalık puan
 * pazartesi 00:00'da, aylık puan ayın 1'i 00:00'da (Türkiye saati) sıfırdan başlar.
 * Biten dönemin birincileri ayrıca hesaplanır (bkz. lib/champions.ts).
 */
export const POINTS = { like: 2, bookmark: 2, repost: 3 } as const;
export const LEVEL_SIZE = 100;

export type UserScore = {
  points: number;
  level: number;
  progress: number; // bu seviyedeki puan (0–99)
  posts: number;
  replies: number;
  likes: number;
  bookmarks: number;
  reposts: number;
  week: number;
  month: number;
};

type Ranked = { uid: string; points: number };

export type Scores = {
  at: number;
  weekStart: number;
  monthStart: number;
  prevWeekStart: number;
  prevMonthStart: number;
  /** Biten haftanın / ayın birincileri (eşitlikte birden fazla) */
  prevWeekWinners: Ranked[];
  prevMonthWinners: Ranked[];
  users: Record<string, UserScore>;
  weekly: { uid: string; points: number }[];
  monthly: { uid: string; points: number }[];
  allTime: { uid: string; points: number }[];
};

const ms = (v: unknown): number =>
  typeof v === 'number' ? v : (v as { toMillis?: () => number } | null)?.toMillis?.() ?? 0;
const realUid = (uid: unknown): uid is string => typeof uid === 'string' && uid !== '' && uid !== 'anonymous';

export async function computeScores(db: Firestore): Promise<Scores> {
  const { weekStart, monthStart, prevWeekStart, prevMonthStart } = periodStarts();
  const [postsSnap, commentsSnap, usersSnap] = await Promise.all([
    db.collection('forum').get(),
    db.collectionGroup('comments').get(),
    db.collection('users').get(),
  ]);

  const s: Record<string, UserScore> = {};
  const get = (uid: string) => (s[uid] ||= { points: 0, level: 1, progress: 0, posts: 0, replies: 0, likes: 0, bookmarks: 0, reposts: 0, week: 0, month: 0 });
  // Biten hafta ve ay (birincileri belirlemek için)
  const prev: Record<string, { w: number; m: number }> = {};
  const add = (uid: string, pts: number, at: number) => {
    const u = get(uid);
    u.points += pts;
    if (at >= weekStart) u.week += pts;
    if (at >= monthStart) u.month += pts;
    if (at >= prevWeekStart && at < weekStart) (prev[uid] ||= { w: 0, m: 0 }).w += pts;
    if (at >= prevMonthStart && at < monthStart) (prev[uid] ||= { w: 0, m: 0 }).m += pts;
  };
  const othersCount = (map: unknown, owner: string, pred: (v: unknown) => boolean) =>
    Object.entries((map || {}) as Record<string, unknown>).filter(([k, v]) => k !== owner && pred(v)).length;

  // Gönderiler (yeniden paylaşım kayıtları içerik sayılmaz; paylaşım asıl gönderinin repostsData'sında sayılır)
  for (const d of postsSnap.docs) {
    const p = d.data();
    if (p.isRepost || p.isAnonymous || !realUid(p.uid)) continue;
    const at = ms(p.createdAt);
    const likes = othersCount(p.reactionsData, p.uid, v => v === 'like' || v === 'heart');
    const reposts = othersCount(p.repostsData, p.uid, Boolean);
    const saves = othersCount(p.bookmarksData, p.uid, Boolean);
    const u = get(p.uid);
    u.posts++; u.likes += likes; u.reposts += reposts; u.bookmarks += saves;
    add(p.uid, likes * POINTS.like + saves * POINTS.bookmark + reposts * POINTS.repost, at);
  }

  // Yanıtlar (yalnızca forum yanıtları; blog yorumları sayılmaz)
  for (const d of commentsSnap.docs) {
    if (d.ref.parent.parent?.parent.id !== 'forum') continue;
    const c = d.data();
    const at = ms(c.createdAt);
    if (!c.isAnonymous && realUid(c.uid)) {
      const likes = othersCount(c.reactionsData, c.uid, v => v === 'like');
      const reposts = othersCount(c.repostsData, c.uid, Boolean);
      const saves = othersCount(c.bookmarksData, c.uid, Boolean);
      const u = get(c.uid);
      u.replies++; u.likes += likes; u.reposts += reposts; u.bookmarks += saves;
      add(c.uid, likes * POINTS.like + saves * POINTS.bookmark + reposts * POINTS.repost, at);
    }
  }

  // Sıralamalarda banlı, dondurulmuş ve silinmiş hesaplar gösterilmez
  const hidden = new Set(usersSnap.docs.filter(d => {
    const u = d.data();
    return u.isBanned || u.isFrozen || u.isDeleted;
  }).map(d => d.id));
  const exists = new Set(usersSnap.docs.map(d => d.id));

  for (const [uid, u] of Object.entries(s)) {
    if (!exists.has(uid)) { delete s[uid]; continue; }
    u.level = Math.floor(u.points / LEVEL_SIZE) + 1;
    u.progress = u.points % LEVEL_SIZE;
  }

  const top = (key: 'week' | 'month' | 'points') => Object.entries(s)
    .filter(([uid, u]) => !hidden.has(uid) && u[key] > 0)
    .sort((a, b) => b[1][key] - a[1][key])
    .slice(0, 20)
    .map(([uid, u]) => ({ uid, points: u[key] }));

  const winners = (k: 'w' | 'm'): Ranked[] => {
    const list = Object.entries(prev).filter(([uid, v]) => s[uid] && !hidden.has(uid) && v[k] > 0);
    const max = Math.max(0, ...list.map(([, v]) => v[k]));
    return max ? list.filter(([, v]) => v[k] === max).map(([uid, v]) => ({ uid, points: v[k] })) : [];
  };

  return {
    at: Date.now(), weekStart, monthStart, prevWeekStart, prevMonthStart,
    prevWeekWinners: winners('w'), prevMonthWinners: winners('m'),
    users: s, weekly: top('week'), monthly: top('month'), allTime: top('points'),
  };
}
