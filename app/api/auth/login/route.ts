import { NextResponse } from 'next/server';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { DEVICE_RE, attemptLogin, requestMeta } from '@/lib/loginGuard';

/**
 * Şifreli giriş kapısı: deneme sayaçları, reCAPTCHA, cihaz kilidi, yeni cihaz kapanması ve hesap askısı burada uygulanır.
 * Başarılı olursa istemci aynı bilgilerle Firebase oturumunu açar.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) return NextResponse.json({ ok: false, code: 'unavailable', error: 'Giriş şu an yapılamıyor. Lütfen biraz sonra tekrar dene.' }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
    if (!identifier || identifier.length > 200 || !password || password.length > 200 || !DEVICE_RE.test(deviceId)) {
      return NextResponse.json({ ok: false, code: 'invalid', error: 'Kullanıcı adı, e-posta ya da şifre hatalı.' }, { status: 400 });
    }

    const result = await attemptLogin(app, db, {
      identifier,
      password,
      deviceId,
      captchaToken: typeof body.captchaToken === 'string' ? body.captchaToken.slice(0, 4000) : undefined,
      platform: body.platform === 'android' ? 'android' : 'web',
      ...requestMeta(req),
    });
    if (result.ok) return NextResponse.json({ ok: true, email: result.email });
    const { status, ...rest } = result;
    return NextResponse.json(rest, { status });
  } catch {
    return NextResponse.json({ ok: false, code: 'error', error: 'Giriş yapılamadı. Lütfen tekrar dene.' }, { status: 500 });
  }
}
