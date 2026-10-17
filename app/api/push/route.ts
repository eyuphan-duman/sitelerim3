import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { pushNotification } from '@/lib/push';

/**
 * İstemci bir bildirim kaydı oluşturduktan sonra çağırır; alıcının telefonuna anlık bildirim gider.
 * Yalnızca bildirimi oluşturan kişi, son birkaç dakikada oluşturduğu bir kayıt için çağırabilir.
 */
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) return NextResponse.json({ ok: false }, { status: 503 });

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const caller = token ? await getAuth(app).verifyIdToken(token).catch(() => null) : null;
    if (!caller) return NextResponse.json({ ok: false }, { status: 401 });

    const { id } = await req.json().catch(() => ({}));
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

    const snap = await db.collection('notifications').doc(id).get();
    const n = snap.data();
    if (!n || n.fromUid !== caller.uid) return NextResponse.json({ ok: false }, { status: 403 });
    const created = n.createdAt?.toMillis?.() || Date.now();
    if (Date.now() - created > 5 * 60_000) return NextResponse.json({ ok: false }, { status: 410 });

    const sent = await pushNotification(app, db, id);
    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
