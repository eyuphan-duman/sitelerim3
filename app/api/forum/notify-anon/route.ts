import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { pushNotification } from '@/lib/push';

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

    const { postId, type, postTitle, fromOwner, commentId } = await req.json();
    if (typeof postId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(postId) || !MESSAGES[type]) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Ters yön: isimsiz gönderinin sahibi bir yoruma isimsiz yanıt verdi. Yorum sahibine giden
    // bildirimde sahibinin kimliği yer almaz (istemci kendi kimliği olmadan bildirim yazamaz).
    if (fromOwner) {
      if (typeof commentId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(commentId)) return NextResponse.json({ ok: false }, { status: 400 });
      const [owner, comment] = await Promise.all([
        db.collection('anon_owners').doc(postId).get(),
        db.collection('forum').doc(postId).collection('comments').doc(commentId).get(),
      ]);
      if (owner.data()?.uid !== caller.uid) return NextResponse.json({ ok: false }, { status: 403 });
      const toUid = comment.data()?.uid as string | undefined;
      if (!toUid || toUid === 'anonymous' || toUid === caller.uid) return NextResponse.json({ ok: true });
      const [b1, b2] = await Promise.all([
        db.collection('blocks').doc(`${toUid}_${caller.uid}`).get(),
        db.collection('blocks').doc(`${caller.uid}_${toUid}`).get(),
      ]);
      if (b1.exists || b2.exists) return NextResponse.json({ ok: true });
      const added = await db.collection('notifications').add({
        toUid,
        fromUid: 'anonymous',
        fromUser: 'İsimsiz kullanıcı',
        fromUsername: '',
        fromPhotoURL: '',
        type: 'comment',
        message: 'yanıtına yanıt verdi.',
        postId,
        postTitle: typeof postTitle === 'string' ? postTitle.slice(0, 50) : '',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      await pushNotification(app, db, added.id).catch(() => 0);
      return NextResponse.json({ ok: true });
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

    // Bildirim yalnızca gerçekten yapılmış bir etkileşim için yazılır (sahte bildirim yağdırılamaz)
    const p = post.data() || {};
    if (type === 'reaction' && !['like', 'heart'].includes(p.reactionsData?.[caller.uid])) return NextResponse.json({ ok: true });
    if (type === 'repost' && !p.repostsData?.[caller.uid]) return NextResponse.json({ ok: true });
    if (type === 'comment') {
      const mine = await db.collection('forum').doc(postId).collection('comments').where('uid', '==', caller.uid).limit(50).get();
      const recent = mine.docs.some(d => (d.get('createdAt')?.toMillis?.() || 0) > Date.now() - 5 * 60_000);
      if (!recent) return NextResponse.json({ ok: true });
    }

    // Aynı kişiden aynı gönderiye aynı türde art arda bildirim yazılmasın (yanıtta en fazla 10 saniyede bir)
    const dupe = await db.collection('notifications')
      .where('toUid', '==', ownerUid).where('fromUid', '==', caller.uid).where('postId', '==', postId).where('type', '==', type)
      .limit(50).get();
    if (type !== 'comment' && !dupe.empty) return NextResponse.json({ ok: true });
    if (type === 'comment' && dupe.docs.some(d => (d.get('createdAt')?.toMillis?.() || 0) > Date.now() - 10_000)) {
      return NextResponse.json({ ok: true });
    }

    const me = (await db.collection('users').doc(caller.uid).get()).data() || {};
    const added = await db.collection('notifications').add({
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
    await pushNotification(app, db, added.id).catch(() => 0);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
