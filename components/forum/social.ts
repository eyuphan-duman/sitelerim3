'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection, query, where, onSnapshot, getDocs, doc, setDoc, deleteDoc,
  addDoc, serverTimestamp, orderBy, limit, documentId,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ForumUser = {
  uid: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  title?: string;
  isPsychologist?: boolean;
  psychologistStatus?: string;
  role?: string;
  hideBadge?: boolean;
  isBanned?: boolean;
  isFrozen?: boolean;
  isDeleted?: boolean;
  isPrivate?: boolean;
};

export const isApprovedPsychologist = (u?: Partial<ForumUser> | null) =>
  Boolean(u && !u.hideBadge && ((u.isPsychologist && (u.psychologistStatus === 'approved' || !u.psychologistStatus)) || u.role === 'psychologist'));

export const isVisibleUser = (u?: Partial<ForumUser> | null) =>
  Boolean(u && !u.isBanned && !u.isFrozen && !u.isDeleted && (u.displayName || u.username));

export const profileHref = (u: Partial<ForumUser>) => `/forum/profil/${encodeURIComponent(u.username || u.uid || '')}`;

/* ─── Takip et / bırak ─── */
export async function setFollow(me: { uid: string; displayName?: string | null; photoURL?: string | null }, myProfile: any, targetUid: string, follow: boolean) {
  const fid = `${me.uid}_${targetUid}`;
  if (!follow) {
    await deleteDoc(doc(db, 'follows', fid));
    return;
  }
  await setDoc(doc(db, 'follows', fid), { followerId: me.uid, followingId: targetUid, createdAt: serverTimestamp() });
  try {
    await addDoc(collection(db, 'notifications'), {
      toUid: targetUid,
      fromUid: me.uid,
      fromUser: myProfile?.displayName || me.displayName || 'Kullanıcı',
      fromUsername: myProfile?.username || '',
      fromPhotoURL: myProfile?.photoURL || me.photoURL || '',
      type: 'follow',
      message: 'seni takip etmeye başladı.',
      postId: '',
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch {}
}

/* ─── Kullanıcı önbelleği (sayfalar arası tek okuma) ─── */
/* ─── Ortak forum verisi: sunucuda önbelleklenen dizin (Firestore okuması harcamaz) ─── */
type Directory = { users: ForumUser[]; posts: any[]; at: number; configured?: boolean };
let directoryCache: Promise<Directory> | null = null;
let directoryAt = 0;
export function loadDirectory(force = false): Promise<Directory> {
  // Sayfa açık kaldıkça 3 dakikada bir tazelenir
  if (!directoryCache || force || Date.now() - directoryAt > 180_000) {
    directoryAt = Date.now();
    directoryCache = fetch('/api/forum/directory')
      .then(r => r.json())
      .then(async (d: Directory) => {
        if (d.configured === false) {
          // Sunucu yapılandırılmamışsa doğrudan Firestore (yedek yol)
          const [us, ps] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(query(collection(db, 'forum'), orderBy('createdAt', 'desc'), limit(200))),
          ]);
          return { users: us.docs.map(x => ({ ...(x.data() as any), uid: x.id })), posts: ps.docs.map(x => ({ id: x.id, ...x.data() })), at: Date.now() };
        }
        return d;
      })
      .catch(() => { directoryCache = null; return { users: [], posts: [], at: 0 }; });
  }
  return directoryCache;
}

export function loadUsers(force = false): Promise<Record<string, ForumUser>> {
  return loadDirectory(force).then(d => {
    const map: Record<string, ForumUser> = {};
    d.users.forEach(u => { map[u.uid] = u; });
    return map;
  });
}

export function useUsers() {
  const [users, setUsers] = useState<Record<string, ForumUser>>({});
  useEffect(() => { let on = true; loadUsers().then(u => on && setUsers(u)); return () => { on = false; }; }, []);
  return users;
}

/** Benim takip ettiklerim ve takipçilerim (canlı) */
export function useMyGraph(uid?: string | null) {
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  useEffect(() => {
    if (!uid) { setFollowing([]); setFollowers([]); return; }
    const a = onSnapshot(query(collection(db, 'follows'), where('followerId', '==', uid)), s => setFollowing(s.docs.map(d => d.data().followingId)));
    const b = onSnapshot(query(collection(db, 'follows'), where('followingId', '==', uid)), s => setFollowers(s.docs.map(d => d.data().followerId)));
    return () => { a(); b(); };
  }, [uid]);
  return { following, followers };
}

/** Bir kişinin takipçi ve takip ettiği listesi (uid dizileri) */
export function useUserGraph(uid?: string | null) {
  return useMyGraph(uid);
}

/* ─── Öneri motoru ─── */
type Suggestion = { user: ForumUser; reason: string; score: number };

export function loadRecentPosts() {
  return loadDirectory().then(d => d.posts);
}

/**
 * Kimi takip etmeli:
 *  - seni takip eden ama senin takip etmediğin kişiler
 *  - takip ettiklerinin takip ettiği kişiler (ortak bağlantı)
 *  - ilgi alanların (yazdığın/beğendiğin/kaydettiğin konular) hakkında yazanlar
 *  - yedek: psikologlar ve en etkin üyeler
 */
export function useFollowSuggestions(me?: string | null, max = 3) {
  const users = useUsers();
  const { following, followers } = useMyGraph(me);
  const { hidden } = useBlocks(me);
  const [posts, setPosts] = useState<any[]>([]);
  const [secondHop, setSecondHop] = useState<Record<string, string[]>>({});

  useEffect(() => { let on = true; loadRecentPosts().then(p => on && setPosts(p)); return () => { on = false; }; }, []);

  // Takip ettiklerimin takip ettikleri (30'luk gruplar hâlinde)
  const followingKey = following.slice().sort().join(',');
  useEffect(() => {
    if (!following.length) { setSecondHop({}); return; }
    let on = true;
    const chunks: string[][] = [];
    for (let i = 0; i < following.length && i < 90; i += 30) chunks.push(following.slice(i, i + 30));
    Promise.all(chunks.map(c => getDocs(query(collection(db, 'follows'), where('followerId', 'in', c))).catch(() => null)))
      .then(results => {
        if (!on) return;
        const map: Record<string, string[]> = {};
        results.forEach(r => r?.docs.forEach(d => {
          const { followerId, followingId } = d.data();
          (map[followingId] ||= []).push(followerId);
        }));
        setSecondHop(map);
      });
    return () => { on = false; };
  }, [followingKey]);

  return useMemo<Suggestion[]>(() => {
    const all = Object.values(users);
    if (!all.length) return [];
    const followingSet = new Set(following);
    const followerSet = new Set(followers);

    // İlgi alanlarım: kendi gönderilerim + beğendiklerim + kaydettiklerim
    const myTopics: Record<string, number> = {};
    const authorTopics: Record<string, Record<string, number>> = {};
    const postCount: Record<string, number> = {};
    posts.forEach(p => {
      if (p.isRepost || !p.uid) return;
      const cat = p.category;
      postCount[p.uid] = (postCount[p.uid] || 0) + 1;
      if (cat) (authorTopics[p.uid] ||= {})[cat] = ((authorTopics[p.uid] || {})[cat] || 0) + 1;
      if (me && cat) {
        let w = 0;
        if (p.uid === me) w += 3;
        if (p.reactionsData?.[me] === 'like' || p.reactionsData?.[me] === 'heart') w += 2;
        if (p.bookmarksData?.[me]) w += 2;
        if (w) myTopics[cat] = (myTopics[cat] || 0) + w;
      }
    });
    const topTopic = Object.entries(myTopics).sort((a, b) => b[1] - a[1])[0]?.[0];

    const out: Suggestion[] = [];
    for (const u of all) {
      if (!isVisibleUser(u) || u.uid === me || followingSet.has(u.uid) || hidden.has(u.uid)) continue;
      let score = 0;
      let reason = '';
      const via = (secondHop[u.uid] || []).filter(x => x !== me);
      if (followerSet.has(u.uid)) { score += 6; reason = 'Seni takip ediyor'; }
      if (via.length) {
        score += 3 * via.length;
        if (!reason) {
          const first = users[via[0]];
          const name = first?.displayName || (first?.username ? '@' + first.username : 'Takip ettiğin biri');
          reason = via.length > 1 ? `${name} ve ${via.length - 1} kişi takip ediyor` : `${name} takip ediyor`;
        }
      }
      const topics = authorTopics[u.uid] || {};
      let shared = 0; let sharedTopic = '';
      for (const [cat, w] of Object.entries(myTopics)) {
        if (topics[cat]) { shared += Math.min(w, 6) * Math.min(topics[cat], 3); if (!sharedTopic || cat === topTopic) sharedTopic = cat; }
      }
      if (shared) { score += 1 + shared / 4; if (!reason) reason = `${sharedTopic} hakkında yazıyor`; }
      if (isApprovedPsychologist(u)) { score += 1.5; if (!reason) reason = u.title || 'Psikolog'; }
      score += Math.min(postCount[u.uid] || 0, 10) * 0.15;
      if (!reason) reason = postCount[u.uid] ? `${postCount[u.uid]} gönderi paylaştı` : 'Topluluğa yeni katıldı';
      out.push({ user: u, reason, score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, max);
  }, [users, following, followers, posts, secondHop, me, max, hidden]);
}

/** uid listesini kullanıcı nesnelerine çevirir (sıra korunur) */
export function useUsersByIds(ids: string[]) {
  const users = useUsers();
  const [extra, setExtra] = useState<Record<string, ForumUser>>({});
  const missing = ids.filter(id => !users[id] && !extra[id]);
  const missingKey = missing.join(',');
  useEffect(() => {
    if (!missing.length) return;
    const chunks: string[][] = [];
    for (let i = 0; i < missing.length; i += 30) chunks.push(missing.slice(i, i + 30));
    Promise.all(chunks.map(c => getDocs(query(collection(db, 'users'), where(documentId(), 'in', c))).catch(() => null)))
      .then(rs => {
        const m: Record<string, ForumUser> = {};
        rs.forEach(r => r?.docs.forEach(d => { m[d.id] = { ...(d.data() as any), uid: d.id }; }));
        setExtra(prev => ({ ...prev, ...m }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey]);
  return ids.map(id => users[id] || extra[id]).filter(Boolean) as ForumUser[];
}

/* ─── Engelleme ───
 * blocks/{engelleyen}_{engellenen}. Tek bir canlı dinleyici tüm bileşenlerle paylaşılır.
 * hidden: benim engellediklerim + beni engelleyenler; bu kişilerin içeriği bana gösterilmez.
 */
type BlockState = { blocked: string[]; blockedBy: string[] };
const EMPTY_BLOCKS: BlockState = { blocked: [], blockedBy: [] };
let blockOwner: string | null = null;
let blockState: BlockState = EMPTY_BLOCKS;
let blockStop: (() => void) | null = null;
const blockSubs = new Set<(s: BlockState) => void>();

function watchBlocks(uid: string) {
  if (blockOwner === uid) return;
  blockStop?.();
  blockOwner = uid;
  blockState = EMPTY_BLOCKS;
  const emit = (patch: Partial<BlockState>) => {
    blockState = { ...blockState, ...patch };
    blockSubs.forEach(fn => fn(blockState));
  };
  const a = onSnapshot(query(collection(db, 'blocks'), where('blockerId', '==', uid)), s => emit({ blocked: s.docs.map(d => d.data().blockedId) }), () => {});
  const b = onSnapshot(query(collection(db, 'blocks'), where('blockedId', '==', uid)), s => emit({ blockedBy: s.docs.map(d => d.data().blockerId) }), () => {});
  blockStop = () => { a(); b(); };
}

export function useBlocks(uid?: string | null) {
  const [s, setS] = useState<BlockState>(uid && blockOwner === uid ? blockState : EMPTY_BLOCKS);
  useEffect(() => {
    if (!uid) { setS(EMPTY_BLOCKS); return; }
    watchBlocks(uid);
    setS(blockState);
    blockSubs.add(setS);
    return () => { blockSubs.delete(setS); };
  }, [uid]);
  return useMemo(() => {
    const blocked = new Set(s.blocked);
    const blockedBy = new Set(s.blockedBy);
    return { blocked, blockedBy, hidden: new Set([...s.blocked, ...s.blockedBy]), blockedList: s.blocked };
  }, [s]);
}

export async function blockUser(meUid: string, targetUid: string) {
  await setDoc(doc(db, 'blocks', `${meUid}_${targetUid}`), { blockerId: meUid, blockedId: targetUid, createdAt: serverTimestamp() });
  // Engellenen kişiyle aradaki takipler iki yönde de kalkar
  await Promise.all([
    deleteDoc(doc(db, 'follows', `${meUid}_${targetUid}`)).catch(() => {}),
    deleteDoc(doc(db, 'follows', `${targetUid}_${meUid}`)).catch(() => {}),
  ]);
}

export async function unblockUser(meUid: string, targetUid: string) {
  await deleteDoc(doc(db, 'blocks', `${meUid}_${targetUid}`));
}

/* ─── İsimsiz gönderilerim ───
 * anon_owners/{postId} = { uid } yalnızca sahibine ve yöneticiye okunur. Sahibi kendi
 * isimsiz gönderilerini bu sayede tanır (silme, "senin paylaşımın" işareti, isimsiz yanıt).
 */
let anonOwner: string | null = null;
let anonIds: string[] = [];
let anonStop: (() => void) | null = null;
const anonSubs = new Set<(ids: string[]) => void>();

export function useMyAnonPosts(uid?: string | null) {
  const [ids, setIds] = useState<string[]>(uid && anonOwner === uid ? anonIds : []);
  useEffect(() => {
    if (!uid) { setIds([]); return; }
    if (anonOwner !== uid) {
      anonStop?.();
      anonOwner = uid;
      anonIds = [];
      anonStop = onSnapshot(query(collection(db, 'anon_owners'), where('uid', '==', uid)), s => {
        anonIds = s.docs.map(d => d.id);
        anonSubs.forEach(fn => fn(anonIds));
      }, () => {});
    }
    setIds(anonIds);
    anonSubs.add(setIds);
    return () => { anonSubs.delete(setIds); };
  }, [uid]);
  return useMemo(() => new Set(ids), [ids]);
}
