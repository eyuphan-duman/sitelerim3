import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

/** İsimsiz gönderilerin `uid` alanı: gerçek sahibi yalnızca gizli anon_owners kaydında durur */
export const ANON_UID = 'anonymous';
export const ANON_NAME = 'İsimsiz kullanıcı';
export const ANON_AVATAR = '/anon-avatar.svg';

/**
 * Gönderen bilgisi her zaman kişinin kendi profilinden alınır (kurallar da bunu denetler);
 * böylece bildirimde başkasının adı ya da fotoğrafı gösterilemez.
 */
let senderCache: { uid: string; at: number; fields: { fromUser: string; fromUsername: string; fromPhotoURL: string } } | null = null;
async function senderFields(uid: string) {
  if (senderCache && senderCache.uid === uid && Date.now() - senderCache.at < 60_000) return senderCache.fields;
  const p = (await getDoc(doc(db, 'users', uid)).catch(() => null))?.data() || {};
  const fields = {
    fromUser: (p.displayName as string) || 'Kullanıcı',
    fromUsername: (p.username as string) || '',
    fromPhotoURL: (p.photoURL as string) || '',
  };
  senderCache = { uid, at: Date.now(), fields };
  return fields;
}

/**
 * Bildirim gönderir. Alıcı isimsiz bir gönderinin sahibiyse kimliği istemcide
 * bilinmediğinden bildirim sunucu üzerinden iletilir.
 */
export async function sendNotification(data: Record<string, any>) {
  if (data.toUid !== ANON_UID) {
    const me = auth.currentUser?.uid;
    if (!me) return;
    const ref = await addDoc(collection(db, 'notifications'), {
      ...data,
      fromUid: me,
      ...(await senderFields(me)),
      postTitle: typeof data.postTitle === 'string' ? data.postTitle.slice(0, 60) : '',
    });
    requestPush(ref.id);
    return ref;
  }
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token || !data.postId) return;
  await fetch('/api/forum/notify-anon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ postId: data.postId, type: data.type, postTitle: data.postTitle || '' }),
  }).catch(() => {});
}

/** Alıcının telefonuna anlık bildirim gönderilmesini ister (beklenmez, hata yutulur) */
export function requestPush(notificationId: string) {
  auth.currentUser?.getIdToken()
    .then(token => fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: notificationId }),
    }))
    .catch(() => {});
}

/** Yükleme ucuna (Cloudinary) oturum anahtarıyla istek gönderir */
export async function uploadFetch(init: { method?: string; body: FormData }) {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  return fetch('/api/upload', {
    method: init.method || 'POST',
    body: init.body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
