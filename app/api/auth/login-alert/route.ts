import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';

/**
 * "Hesabına giriş yapmaya çalışan sen misin?" bildirimine yanıt.
 *   Evet  → bildirim kapanır.
 *   Hayır → hesap askıya alınır (Firestore kuralları yazmayı ve gizli bilgileri okumayı engeller),
 *           tüm oturumlar kapatılır ve şifre sıfırlama e-postası gönderilir. Şifre değişince askı kalkar.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) return NextResponse.json({ ok: false }, { status: 503 });
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const caller = token ? await getAuth(app).verifyIdToken(token).catch(() => null) : null;
    if (!caller) return NextResponse.json({ ok: false }, { status: 401 });

    const { id, answer } = await req.json().catch(() => ({}));
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id) || !['yes', 'no'].includes(answer)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const ref = db.collection('notifications').doc(id);
    const n = (await ref.get()).data();
    if (!n || n.toUid !== caller.uid || n.type !== 'login_alert') return NextResponse.json({ ok: false }, { status: 404 });
    if (n.answered) return NextResponse.json({ ok: true, answered: n.answered });

    if (answer === 'yes') {
      await ref.update({ answered: 'yes', read: true });
      return NextResponse.json({ ok: true, answered: 'yes' });
    }

    // Ben değilim: hesabı koruma altına al
    await db.collection('security').doc(caller.uid).set({ locked: true, lockedAt: FieldValue.serverTimestamp(), reason: 'login_alert' });
    await ref.update({ answered: 'no', read: true });
    await getAuth(app).revokeRefreshTokens(caller.uid).catch(() => {});
    let resetSent = false;
    if (caller.email) {
      const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: caller.email }),
      }).catch(() => null);
      resetSent = Boolean(r?.ok);
    }
    return NextResponse.json({ ok: true, answered: 'no', locked: true, resetSent, email: caller.email || '' });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
