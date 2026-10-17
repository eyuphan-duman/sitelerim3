import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';

/**
 * İsimsiz gönderilere gelen beğeni / yeniden paylaşım / yanıt bildirimleri.
 * Gönderi sahibinin kimliği istemciye hiç verilmez; sahibi burada, gizli
 * anon_owners kaydından bulunur ve bildirim sunucuda yazılır.
 */
export const runtime = 'nodejs';

const MESSAGES: Record<string, string> = {
  reaction: 'isimsiz gönderini beğendi.',
  repost: 'isimsiz gönderini yeniden paylaştı.',
  comment: 'isimsiz gönderine yanıt verdi.',
};

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) return NextResponse.json({ ok: false }, { status: 503 });

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ ok: false }, { status: 401 });
    const caller = await getAuth(app).verifyIdToken(token).catch(() => null);
    if (!caller) return NextResponse.json({ ok: false }, { status: 401 });

    const { postId, type, postTitle } = await req.json();
    if (typeof postId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(postId) || !MESSAGES[type]) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const [owner, post] = await Promise.all([
      db.collection('anon_owners').doc(postId).get(),
      db.collection('forum').doc(postId).get(),
    ]);
    const ownerUid = owner.data()?.uid as string | undefined;
    if (!ownerUid || !post.exists || ownerUid === caller.uid) return NextResponse.json({ ok: true });

    // Engellenmiş kişiler arasında bildirim gitmez
    const [b1, b2] = await Promise.all([
      db.collection('blocks').doc(`${ownerUid}_${caller.uid}`).get(),
      db.collection('blocks').doc(`${caller.uid}_${ownerUid}`).get(),
    ]);
    if (b1.exists || b2.exists) return NextResponse.json({ ok: true });

    // Aynı kişiden aynı gönderiye aynı türde art arda bildirim yazılmasın
    const dupe = await db.collection('notifications')
      .where('toUid', '==', ownerUid).where('fromUid', '==', caller.uid).where('postId', '==', postId).where('type', '==', type)
      .limit(1).get();
    if (!dupe.empty && type !== 'comment') return NextResponse.json({ ok: true });

    const me = (await db.collection('users').doc(caller.uid).get()).data() || {};
    await db.collection('notifications').add({
      toUid: ownerUid,
      fromUid: caller.uid,
      fromUser: me.displayName || 'Kullanıcı',
      fromUsername: me.username || '',
      fromPhotoURL: me.photoURL || '',
      type,
      message: MESSAGES[type],
      postId,
      postTitle: typeof postTitle === 'string' ? postTitle.slice(0, 50) : '',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
