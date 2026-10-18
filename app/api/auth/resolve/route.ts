import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { attemptLogin, requestMeta } from '@/lib/loginGuard';

/**
 * Eski istemciler (eski uygulama sürümleri) için kullanıcı adıyla giriş. Yeni istemciler /api/auth/login kullanır.
 * Koruma atlatılamasın diye aynı deneme sayaçlarından geçer; cihaz kimliği gönderilmediği için IP'den türetilir.
 * Güvenlik doğrulaması gerekirse eski sürüm bunu gösteremez; kullanıcı güncellemeye yönlendirilir.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GENERIC = 'Kullanıcı adı veya şifre hatalı.';

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) {
      return NextResponse.json({ ok: false, error: 'Kullanıcı adıyla giriş şu an kullanılamıyor. Lütfen e-posta adresinle giriş yap.' }, { status: 503 });
    }
    const { username, password } = await req.json().catch(() => ({}));
    const uname = typeof username === 'string' ? username.trim().toLowerCase().replace(/^@/, '') : '';
    if (!uname || typeof password !== 'string' || !password || uname.length > 40 || password.length > 200) {
      return NextResponse.json({ ok: false, error: GENERIC }, { status: 400 });
    }
    const meta = requestMeta(req);
    const result = await attemptLogin(app, db, {
      identifier: uname,
      password,
      deviceId: 'legacy-' + createHash('sha256').update(meta.ip || 'yok').digest('hex').slice(0, 32),
      platform: 'legacy',
      ...meta,
    });
    if (result.ok) return NextResponse.json({ ok: true, email: result.email });
    const error = result.code === 'captcha_required'
      ? 'Güvenlik doğrulaması gerekiyor. Lütfen uygulamayı güncelle ya da web sitesinden giriş yap.'
      : result.error;
    return NextResponse.json({ ok: false, error }, { status: result.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'Giriş yapılamadı. Lütfen tekrar dene.' }, { status: 500 });
  }
}
