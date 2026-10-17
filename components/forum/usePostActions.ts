'use client';

/** Gönderi etkileşimleri (beğeni, katılmıyorum, yeniden paylaşım, kaydetme) — profil gibi canlı dinlemeyen listeler için iyimser güncellemeli */
import toast from 'react-hot-toast';
import {
  addDoc, collection, deleteDoc, deleteField, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { createLimited, SpamError } from './antiSpam';
import { db } from '@/lib/firebase';
import { sendNotification } from '@/lib/notify';
import { useAuth } from '@/contexts/AuthContext';

type AnyPost = Record<string, any> & { id: string; uid: string };
type Patch = (id: string, update: (p: AnyPost) => AnyPost) => void;

export function usePostActions({ onNeedAuth, onPatch }: { onNeedAuth: () => void; onPatch: Patch }) {
  const { user, userProfile, emailVerified } = useAuth();

  const guard = (needVerified = true) => {
    if (!user || user.isAnonymous) { onNeedAuth(); return null; }
    if (userProfile?.isBanned) { toast.error('Hesabın askıya alındı.'); return null; }
    if (needVerified && !emailVerified) { toast.error('Bu işlem için e-posta adresini doğrulaman gerekiyor.'); return null; }
    return user;
  };

  const notify = async (thread: AnyPost, type: string, message: string) => {
    if (!user || !thread.uid || thread.uid === user.uid) return;
    try {
      await sendNotification({
        toUid: thread.uid,
        fromUid: user.uid,
        fromUser: userProfile?.displayName || user.displayName || 'Kullanıcı',
        fromUsername: userProfile?.username || '',
        fromPhotoURL: userProfile?.photoURL || user.photoURL || '',
        type,
        message,
        postId: thread.originalPostId || thread.id,
        postTitle: thread.body?.slice(0, 50) || '',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {}
  };

  const setMapKey = (field: string, id: string, uid: string, value: any) =>
    onPatch(id, p => {
      const m = { ...(p[field] || {}) };
      if (value === undefined) delete m[uid]; else m[uid] = value;
      return { ...p, [field]: m };
    });

  const onLike = async (e: React.MouseEvent, thread: AnyPost) => {
    e.stopPropagation();
    const u = guard(); if (!u) return;
    const liked = ['like', 'heart'].includes(thread.reactionsData?.[u.uid]);
    setMapKey('reactionsData', thread.id, u.uid, liked ? undefined : 'like');
    try {
      await updateDoc(doc(db, 'forum', thread.id), { [`reactionsData.${u.uid}`]: liked ? deleteField() : 'like' });
      if (!liked) notify(thread, 'reaction', 'gönderini beğendi.');
    } catch (err: any) {
      setMapKey('reactionsData', thread.id, u.uid, thread.reactionsData?.[u.uid]);
      toast.error('Beğeni kaydedilemedi: ' + (err.message || ''));
    }
  };

  const onDislike = async (e: React.MouseEvent, thread: AnyPost) => {
    e.stopPropagation();
    const u = guard(); if (!u) return;
    const on = thread.reactionsData?.[u.uid] === 'dislike';
    setMapKey('reactionsData', thread.id, u.uid, on ? undefined : 'dislike');
    try {
      await updateDoc(doc(db, 'forum', thread.id), { [`reactionsData.${u.uid}`]: on ? deleteField() : 'dislike' });
    } catch (err: any) {
      setMapKey('reactionsData', thread.id, u.uid, thread.reactionsData?.[u.uid]);
      toast.error(err.message || 'İşlem yapılamadı');
    }
  };

  const onBookmark = async (e: React.MouseEvent, thread: AnyPost) => {
    e.stopPropagation();
    const u = guard(); if (!u) return;
    const target = thread.originalPostId || thread.id;
    const on = Boolean(thread.bookmarksData?.[u.uid]);
    setMapKey('bookmarksData', thread.id, u.uid, on ? undefined : true);
    try {
      await updateDoc(doc(db, 'forum', target), { [`bookmarksData.${u.uid}`]: on ? deleteField() : true });
      const ref = doc(db, 'users', u.uid, 'bookmarks', target);
      if (on) await deleteDoc(ref).catch(() => {});
      else await setDoc(ref, { postId: target, createdAt: serverTimestamp(), postBody: thread.body?.slice(0, 100) || '', authorName: thread.authorName || '' }).catch(() => {});
      toast.success(on ? 'Yer işaretlerinden kaldırıldı' : 'Yer işaretlerine kaydedildi');
    } catch (err: any) {
      setMapKey('bookmarksData', thread.id, u.uid, thread.bookmarksData?.[u.uid]);
      toast.error(err.message || 'İşlem yapılamadı');
    }
  };

  const onRepost = async (e: React.MouseEvent, thread: AnyPost) => {
    e.stopPropagation();
    const u = guard(); if (!u) return;
    const target = thread.originalPostId || thread.id;
    const existing = thread.repostsData?.[u.uid];
    try {
      if (existing) {
        setMapKey('repostsData', thread.id, u.uid, undefined);
        await updateDoc(doc(db, 'forum', target), { [`repostsData.${u.uid}`]: deleteField() });
        if (typeof existing === 'string') await deleteDoc(doc(db, 'forum', existing)).catch(() => {});
        else {
          const qs = await getDocs(query(collection(db, 'forum'), where('originalPostId', '==', target), where('uid', '==', u.uid), where('isRepost', '==', true))).catch(() => null);
          for (const d of qs?.docs || []) await deleteDoc(d.ref).catch(() => {});
        }
        toast.success('Yeniden paylaşım geri alındı');
        return;
      }
      const repost = await createLimited(u.uid, 'repost', doc(collection(db, 'forum')), {
        body: thread.body,
        category: thread.category || 'Genel',
        imageUrl: thread.imageUrl || '',
        createdAt: serverTimestamp(),
        uid: u.uid,
        authorName: userProfile?.displayName || u.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || '',
        authorPhotoURL: userProfile?.photoURL || u.photoURL || '',
        authorHideBadge: Boolean(userProfile?.hideBadge),
        commentCount: 0,
        reactionsData: {},
        repostsData: {},
        bookmarksData: {},
        isRepost: true,
        originalPostId: target,
        originalAuthorName: thread.originalAuthorName || thread.authorName,
        originalAuthorUsername: thread.originalAuthorUsername || thread.authorUsername || '',
        originalAuthorPhotoURL: thread.originalAuthorPhotoURL || thread.authorPhotoURL || '',
        originalAuthorIsPsychologist: thread.originalAuthorIsPsychologist ?? thread.authorIsPsychologist ?? false,
        originalIsAnonymous: Boolean(thread.originalIsAnonymous ?? thread.isAnonymous),
      });
      setMapKey('repostsData', thread.id, u.uid, repost.id);
      await updateDoc(doc(db, 'forum', target), { [`repostsData.${u.uid}`]: repost.id });
      notify(thread, 'repost', 'gönderini yeniden paylaştı.');
      toast.success('Yeniden paylaşıldı');
    } catch (err: any) {
      toast.error(err instanceof SpamError ? err.message : 'Yeniden paylaşılamadı: ' + (err.message || ''));
    }
  };

  return { onLike, onDislike, onRepost, onBookmark };
}
