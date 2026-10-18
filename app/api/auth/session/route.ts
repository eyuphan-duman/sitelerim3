import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { lockStillActive } from '@/lib/loginGuard';

/**
 * Oturum açıldığında (Google ile giriş dahil) hesabın güvenlik askısında olup olmadığını söyler.
 * Şifre askıdan sonra değiştirildiyse askıyı kaldırır.
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
    const locked = await lockStillActive(db, caller.uid, caller.email || '', token);
    return NextResponse.json({ ok: true, locked });
  } catch {
    return NextResponse.json({ ok: true, locked: false });
  }
}
