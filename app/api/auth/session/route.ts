import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { DEVICE_RE, accountKey, clearGuard, lockStillActive, markTrusted } from '@/lib/loginGuard';

/**
 * Oturum açıldığında (Google ile giriş dahil) ve uygulama açılırken çağrılır:
 *  - hesabın güvenlik askısında olup olmadığını söyler (şifre askıdan sonra değiştiyse askıyı kaldırır);
 *  - bu cihazı hesap için tanıdık olarak işaretler (yeni cihazlara kapanma sürerken buradan girilebilir);
 *  - gerçek kullanıcı oturumunu kullandığı için yeni cihaz kapanması varsa kaldırır.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) return NextResponse.json({ ok: true, locked: false });
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const caller = token ? await getAuth(app).verifyIdToken(token).catch(() => null) : null;
    if (!caller) return NextResponse.json({ ok: false }, { status: 401 });
    const email = (caller.email || '').toLowerCase();
    const locked = await lockStillActive(db, caller.uid, email, token);
    if (!locked && email) {
      const { deviceId } = await req.json().catch(() => ({}));
      if (typeof deviceId === 'string' && DEVICE_RE.test(deviceId)) {
        await markTrusted(db, email, deviceId);
        const g = await db.collection('login_guard').doc(accountKey(email)).get();
        if (g.get('lockdown') === true) await clearGuard(db, email);
      }
    }
    return NextResponse.json({ ok: true, locked });
  } catch {
    return NextResponse.json({ ok: true, locked: false });
  }
}
