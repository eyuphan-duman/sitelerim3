import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { pushToUser } from '@/lib/push';

/**
 * Özel mesaj gönderildikten sonra gönderen çağırır; alıcının telefonuna "yeni mesaj" bildirimi gider.
 * Bildirimde mesajın içeriği yer almaz. Aynı sohbet için 30 saniyede en fazla bir bildirim gönderilir.
 */
export const runtime = 'nodejs';

const ID = /^[A-Za-z0-9_-]{1,128}$/;

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) return NextResponse.json({ ok: false }, { status: 503 });

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const caller = token ? await getAuth(app).verifyIdToken(token).catch(() => null) : null;
    if (!caller) return NextResponse.json({ ok: false }, { status: 401 });

    const { tid, mid } = await req.json().catch(() => ({}));
    if (typeof tid !== 'string' || typeof mid !== 'string' || !ID.test(tid) || !ID.test(mid)) return NextResponse.json({ ok: false }, { status: 400 });
    const members = tid.split('_');
    if (members.length !== 2 || !members.includes(caller.uid)) return NextResponse.json({ ok: false }, { status: 403 });
    const to = members[0] === caller.uid ? members[1] : members[0];

    const threadRef = db.collection('dm_threads').doc(tid);
    const msg = (await threadRef.collection('msgs').doc(mid).get()).data();
    if (!msg || msg.from !== caller.uid) return NextResponse.json({ ok: false }, { status: 403 });
    if (Date.now() - (msg.createdAt?.toMillis?.() || 0) > 2 * 60_000) return NextResponse.json({ ok: false }, { status: 410 });

    // Art arda mesajlarda alıcının telefonu sürekli çalmasın
    const sent = await db.runTransaction(async tx => {
      const t = await tx.get(threadRef);
      const last = t.get('pushAt')?.toMillis?.() || 0;
      if (Date.now() - last < 30_000) return false;
      tx.update(threadRef, { pushAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!sent) return NextResponse.json({ ok: true, sent: 0 });

    const from = (await db.collection('users').doc(caller.uid).get()).data() || {};
    const name = String(from.displayName || from.username || 'Logos');
    const n = await pushToUser(app, db, to, {
      title: name,
      body: 'Sana yeni bir mesaj gönderdi',
      tag: `dm-${tid}`,
      data: { type: 'dm', route: `/mesajlar/${tid}` },
    });
    return NextResponse.json({ ok: true, sent: n });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
