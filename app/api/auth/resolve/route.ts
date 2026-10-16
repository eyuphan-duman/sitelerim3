import { NextResponse } from 'next/server';
import { emailForUsername } from '@/lib/firebaseAdmin';

/**
 * Kullanıcı adıyla giriş: e-posta YALNIZCA şifre doğruysa döndürülür.
 * Böylece kullanıcı adından e-posta öğrenmek mümkün olmaz.
 */
const GENERIC = 'Kullanıcı adı veya şifre hatalı.';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const uname = typeof username === 'string' ? username.trim().toLowerCase().replace(/^@/, '') : '';
    if (!uname || typeof password !== 'string' || !password || uname.length > 40 || password.length > 200) {
      return NextResponse.json({ ok: false, error: GENERIC }, { status: 400 });
    }

    const email = await emailForUsername(uname);
    if (!email) return NextResponse.json({ ok: false, error: GENERIC }, { status: 401 });

    // Şifreyi Firebase Auth üzerinde doğrula (Firebase'in kendi deneme sınırı da devrede)
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      const code = data?.error?.message || '';
      if (code.startsWith('TOO_MANY_ATTEMPTS')) {
        return NextResponse.json({ ok: false, error: 'Çok fazla başarısız deneme. Lütfen biraz sonra tekrar dene.' }, { status: 429 });
      }
      if (code.startsWith('USER_DISABLED')) {
        return NextResponse.json({ ok: false, error: 'Bu hesap devre dışı bırakılmış.' }, { status: 403 });
      }
      return NextResponse.json({ ok: false, error: GENERIC }, { status: 401 });
    }
    return NextResponse.json({ ok: true, email });
  } catch (e: any) {
    if (e?.message === 'admin-not-configured') {
      return NextResponse.json({ ok: false, error: 'Kullanıcı adıyla giriş şu an kullanılamıyor. Lütfen e-posta adresinle giriş yap.' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: 'Giriş yapılamadı. Lütfen tekrar dene.' }, { status: 500 });
  }
}
