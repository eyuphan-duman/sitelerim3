import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

/** İsimsiz gönderilerin `uid` alanı: gerçek sahibi yalnızca gizli anon_owners kaydında durur */
export const ANON_UID = 'anonymous';
export const ANON_NAME = 'İsimsiz kullanıcı';
export const ANON_AVATAR = '/anon-avatar.svg';

/**
 * Bildirim gönderir. Alıcı isimsiz bir gönderinin sahibiyse kimliği istemcide
 * bilinmediğinden bildirim sunucu üzerinden iletilir.
 */
export async function sendNotification(data: Record<string, any>) {
  if (data.toUid !== ANON_UID) return addDoc(collection(db, 'notifications'), data);
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token || !data.postId) return;
  await fetch('/api/forum/notify-anon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ postId: data.postId, type: data.type, postTitle: data.postTitle || '' }),
  }).catch(() => {});
}
