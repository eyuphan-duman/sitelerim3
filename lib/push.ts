import { getMessaging } from 'firebase-admin/messaging';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { App } from 'firebase-admin/app';

/**
 * Bir bildirim kaydı için alıcının telefonlarına anlık bildirim (FCM) gönderir.
 * Cihaz anahtarları push_tokens koleksiyonunda durur ve yalnızca sunucu okuyabilir.
 * Geçersizleşmiş anahtarlar temizlenir; aynı bildirim iki kez gönderilmez.
 */
const PUSH_TEXT: Record<string, string[]> = {
  reaction: ['gönderini beğendi.', 'isimsiz gönderini beğendi.'],
  repost: ['gönderini yeniden paylaştı.', 'isimsiz gönderini yeniden paylaştı.'],
  comment: ['gönderine yanıt verdi.', 'yanıtına yanıt verdi.', 'isimsiz gönderine yanıt verdi.'],
  mention: ['senden bahsetti.'],
  follow: ['seni takip etmeye başladı.'],
};

export async function pushNotification(app: App, db: Firestore, notifId: string) {
  const ref = db.collection('notifications').doc(notifId);
  const claimed = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get('pushedAt')) return null;
    tx.update(ref, { pushedAt: FieldValue.serverTimestamp() });
    return snap.data()!;
  });
  if (!claimed?.toUid) return 0;

  const tokensSnap = await db.collection('push_tokens').where('uid', '==', claimed.toUid).limit(20).get();
  const tokens = tokensSnap.docs.map(d => d.id);
  if (!tokens.length) return 0;

  // Metin istemciden gelen alanlara güvenilmeden kurulur: gönderen adı gerçek profilden, ileti türüne göre sabit
  let who = 'İsimsiz kullanıcı';
  if (claimed.fromUid && claimed.fromUid !== 'anonymous') {
    const sender = (await db.collection('users').doc(String(claimed.fromUid)).get()).data();
    who = (sender?.displayName as string) || 'Biri';
  }
  const fixed = PUSH_TEXT[String(claimed.type)];
  const message = fixed && fixed.includes(String(claimed.message)) ? String(claimed.message) : fixed?.[0];
  if (!message) return 0;
  const body = `${who} ${message}`.slice(0, 180);
  const res = await getMessaging(app).sendEachForMulticast({
    tokens,
    notification: { title: 'Logos', body },
    data: {
      notifId,
      type: String(claimed.type || ''),
      postId: String(claimed.postId || ''),
      fromUsername: String(claimed.fromUsername || ''),
    },
    android: {
      priority: 'high',
      notification: { channelId: 'default', color: '#0a1628', tag: `${claimed.type}-${claimed.postId || claimed.fromUid}` },
    },
  });

  // Uygulaması silinmiş ya da anahtarı yenilenmiş cihazları temizle
  const dead = res.responses
    .map((r, i) => (!r.success && /registration-token-not-registered|invalid-registration-token|invalid-argument/.test(r.error?.code || '') ? tokens[i] : null))
    .filter(Boolean) as string[];
  await Promise.all(dead.map(t => db.collection('push_tokens').doc(t).delete().catch(() => {})));
  return res.successCount;
}
