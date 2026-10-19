/**
 * Özel mesajlar. Web (components/dm/data.ts) ve uygulama (src/state/dm.ts) aynı dosyayı kullanır.
 *
 * dm_threads/{küçükUid_büyükUid}        üyeler, başlatan, son mesaj özeti, okunmamış sayaçları
 * dm_threads/{id}/msgs/{mesajId}        from, text, createdAt
 * dm_consent/{uid}                      mesajlaşma kurallarının onayı
 *
 * Kim kime yazabilir (asıl denetim firestore.rules içindedir):
 *  • Herkes rozetli psikologlara yazabilir; rozetliler birbirine yazabilir.
 *  • Rozetli kişi rozetsiz birine yalnızca o kişinin başlattığı sohbette yanıt verebilir.
 * Mesajları yalnızca sohbetin iki üyesi okuyabilir; yöneticilerin erişimi yoktur.
 */
import {
  collection, deleteDoc, doc, getDoc, increment, limitToLast, onSnapshot, orderBy, query, serverTimestamp,
  setDoc, updateDoc, where, writeBatch, type DocumentData, type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type DmThread = {
  id: string; members: string[]; starter: string;
  lastText: string; lastFrom: string; lastAt: Timestamp | null; unread: Record<string, number>;
};
export type DmMsg = { id: string; from: string; text: string; createdAt: Timestamp | null };
type Person = { uid?: string; isPsychologist?: boolean; psychologistStatus?: string; role?: string; hideBadge?: boolean } | null | undefined;

export const MAX_LEN = 2000;
export const RULES_VERSION = 1;
export const DM_RULES = [
  'Kimseyi taciz etmeyeceğim, tehdit etmeyeceğim ve zorbalık yapmayacağım.',
  'Küfür, hakaret ya da nefret söylemi içeren mesajlar göndermeyeceğim.',
  'Müstehcen, cinsel içerikli ya da karşı tarafın istemediği mesajlar göndermeyeceğim.',
  'Reklam, spam ya da dolandırıcılık amaçlı mesaj göndermeyeceğim.',
  'Başkalarının kişisel bilgilerini ve yazışmalarını izinsiz paylaşmayacağım.',
  'Mesajlaşmanın acil psikolojik destek ya da terapi yerine geçmediğini biliyorum; acil bir durumda 112’yi arayacağım.',
  'Bu kurallara uymazsam mesajlaşmamın ya da hesabımın kısıtlanabileceğini kabul ediyorum.',
];

export class DmError extends Error {}

export const threadId = (a: string, b: string) => [a, b].sort().join('_');
export const otherOf = (tid: string, me: string) => tid.split('_').find(x => x !== me) || '';

/** Rozetli psikolog: onaylı ve rozetini gizlememiş (kurallardaki badgedPsych ile aynı) */
export const isBadged = (u: Person) =>
  Boolean(u && !u.hideBadge && ((u.isPsychologist && (u.psychologistStatus === 'approved' || !u.psychologistStatus)) || u.role === 'psychologist'));

/** Bu kişiye yazılabilir mi? Yazılamıyorsa nedenini döner */
export function writeCheck(me: Person, target: Person, thread: DmThread | null): string | null {
  if (!target?.uid || !me?.uid || target.uid === me.uid) return 'Bu kişiye mesaj gönderilemez.';
  if (isBadged(target)) return null;
  if (thread && thread.starter === target.uid) return null;
  return isBadged(me)
    ? 'Rozetsiz kullanıcılara yalnızca sana yazdıklarında yanıt verebilirsin.'
    : 'Yalnızca psikolog rozeti olan kişilere mesaj gönderebilirsin.';
}

/* ── Kurallar onayı ── */
const accepted = new Set<string>();
export async function hasAccepted(uid: string) {
  if (accepted.has(uid)) return true;
  const ok = (await getDoc(doc(db, 'dm_consent', uid))).exists();
  if (ok) accepted.add(uid);
  return ok;
}
export async function acceptRules(uid: string) {
  await setDoc(doc(db, 'dm_consent', uid), { acceptedAt: serverTimestamp(), version: RULES_VERSION });
  accepted.add(uid);
}

/* ── Okuma ── */
const toThread = (id: string, d: DocumentData): DmThread => ({
  id, members: d.members || [], starter: d.starter || '', lastText: d.lastText || '', lastFrom: d.lastFrom || '',
  lastAt: d.lastAt || null, unread: d.unread || {},
});
const ms = (t: Timestamp | null | undefined) => t?.toMillis?.() || 0;

export async function getThread(tid: string) {
  const s = await getDoc(doc(db, 'dm_threads', tid));
  return s.exists() ? toThread(s.id, s.data()) : null;
}

export function watchThreads(uid: string, cb: (list: DmThread[]) => void, onError?: () => void) {
  return onSnapshot(
    query(collection(db, 'dm_threads'), where('members', 'array-contains', uid)),
    s => cb(s.docs.map(d => toThread(d.id, d.data({ serverTimestamps: 'estimate' }))).sort((a, b) => ms(b.lastAt) - ms(a.lastAt))),
    () => { cb([]); onError?.(); },
  );
}

export function watchThread(tid: string, cb: (t: DmThread | null) => void, onError?: () => void) {
  return onSnapshot(doc(db, 'dm_threads', tid), s => cb(s.exists() ? toThread(s.id, s.data({ serverTimestamps: 'estimate' })) : null), () => { cb(null); onError?.(); });
}

export function watchMessages(tid: string, cb: (list: DmMsg[]) => void, max = 150) {
  return onSnapshot(
    query(collection(db, 'dm_threads', tid, 'msgs'), orderBy('createdAt'), limitToLast(max)),
    s => cb(s.docs.map(d => ({ id: d.id, ...(d.data({ serverTimestamps: 'estimate' }) as Omit<DmMsg, 'id'>) }))),
    () => cb([]),
  );
}

/** Okunmamış mesajı olan sohbet sayısı */
export const unreadThreads = (list: DmThread[], uid: string) => list.filter(t => (t.unread?.[uid] || 0) > 0 && t.lastFrom !== uid).length;

export const markRead = (tid: string, uid: string) => updateDoc(doc(db, 'dm_threads', tid), { [`unread.${uid}`]: 0 }).catch(() => {});

/* ── Yazma ── */
// Sınırlar firestore.rules içindeki rateOk('dm', 1, 200) ve rateOk('dmt', 5, 20) ile aynıdır
const RATE = { dm: { gap: 1, perHour: 200 }, dmt: { gap: 5, perHour: 20 } };

function spamReason(text: string): string | null {
  if ((text.match(/(https?:\/\/|www\.)\S+/gi) || []).length > 3) return 'Bir mesajda en fazla 3 bağlantı olabilir.';
  if (/([\s\S])\1{24,}/u.test(text)) return 'Aynı karakteri art arda bu kadar çok tekrarlayamazsın.';
  return null;
}

function rlFields(prev: DocumentData, kind: 'dm' | 'dmt', ref: string, now: number) {
  const { gap, perHour } = RATE[kind];
  const wait = Math.ceil((ms(prev[`${kind}At`]) + gap * 1000 - now) / 1000);
  if (wait > 0) throw new DmError(kind === 'dm' ? 'Biraz yavaşla.' : `Yeni bir sohbet başlatmak için ${wait} saniye bekle.`);
  const win = ms(prev[`${kind}Win`]);
  const inWin = win > now - 55 * 60_000;
  if (inWin && (prev[`${kind}Count`] || 0) >= perHour) {
    const mins = Math.max(1, Math.ceil((win + 3_600_000 - now) / 60_000));
    throw new DmError(kind === 'dm'
      ? `Bir saatte en fazla ${perHour} mesaj gönderebilirsin. ${mins} dakika sonra tekrar dene.`
      : `Bir saatte en fazla ${perHour} yeni sohbet başlatabilirsin. ${mins} dakika sonra tekrar dene.`);
  }
  return {
    [`${kind}At`]: serverTimestamp(), [`${kind}Text`]: '', [`${kind}Ref`]: ref,
    ...(inWin ? { [`${kind}Count`]: increment(1) } : { [`${kind}Win`]: serverTimestamp(), [`${kind}Count`]: 1 }),
  };
}

/** Mesaj gönderir; sohbet yoksa aynı yazımda başlatır. Gönderilen mesajın kimliğini döner. */
export async function sendMessage(me: string, other: string, raw: string, threadExists: boolean) {
  const text = raw.replace(/\s+$/g, '').replace(/^\s+/, '');
  if (!text) throw new DmError('Boş mesaj gönderilemez.');
  if (text.length > MAX_LEN) throw new DmError(`Bir mesaj en fazla ${MAX_LEN} karakter olabilir.`);
  const spam = spamReason(text);
  if (spam) throw new DmError(spam);

  const tid = threadId(me, other);
  const tRef = doc(db, 'dm_threads', tid);
  const mRef = doc(collection(db, 'dm_threads', tid, 'msgs'));
  const rlRef = doc(db, 'rate_limits', me);
  const prev = (await getDoc(rlRef).catch(() => null))?.data() || {};
  const now = Date.now();
  const rl = { ...rlFields(prev, 'dm', mRef.path, now), ...(threadExists ? {} : rlFields(prev, 'dmt', tRef.path, now)) };

  const preview = { lastText: text.slice(0, 200), lastFrom: me, lastAt: serverTimestamp() };
  const b = writeBatch(db);
  if (threadExists) b.update(tRef, { ...preview, [`unread.${other}`]: increment(1) });
  else b.set(tRef, { members: tid.split('_'), starter: me, createdAt: serverTimestamp(), ...preview, unread: { [me]: 0, [other]: 1 } });
  b.set(mRef, { from: me, text, createdAt: serverTimestamp() });
  b.set(rlRef, rl, { merge: true });
  try {
    await b.commit();
  } catch (e) {
    if ((e as { code?: string })?.code === 'permission-denied') {
      throw new DmError('Mesaj gönderilemedi. Bu kişiye yazma iznin olmayabilir ya da çok hızlı yazıyor olabilirsin.');
    }
    throw new DmError('Mesaj gönderilemedi. Bağlantını kontrol edip tekrar dene.');
  }
  return { tid, mid: mRef.id };
}

export const deleteMessage = (tid: string, mid: string) => deleteDoc(doc(db, 'dm_threads', tid, 'msgs', mid));

/* ── Gösterim ── */
export function dayLabel(d: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - x.getTime()) / 86_400_000);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) });
}
export const clock = (d: Date) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
export function shortTime(t: Timestamp | null) {
  if (!t) return '';
  const d = t.toDate();
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'şimdi';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk`;
  if (dayLabel(d) === 'Bugün') return clock(d);
  if (dayLabel(d) === 'Dün') return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
