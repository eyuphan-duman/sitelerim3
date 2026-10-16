import { NextResponse } from 'next/server';
import { emailForUsername } from '@/lib/firebaseAdmin';

/** Kullanıcı adıyla şifre sıfırlama: e-posta sunucuda çözülür, istemciye yalnızca maskeli hâli döner */
const mask = (email: string) => {
  const [name, domain] = email.split('@');
  const shown = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${shown}${'•'.repeat(Math.max(3, name.length - shown.length))}@${domain}`;
};

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const uname = typeof username === 'string' ? username.trim().toLowerCase().replace(/^@/, '') : '';
    if (!uname || uname.length > 40) return NextResponse.json({ ok: false, error: 'Geçerli bir kullanıcı adı gir.' }, { status: 400 });

    const email = await emailForUsername(uname);
    // Hesap var/yok bilgisini sızdırmamak için her durumda aynı yanıt
    if (!email) return NextResponse.json({ ok: true, masked: null });

    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    });
    return NextResponse.json({ ok: true, masked: mask(email) });
  } catch (e: any) {
    if (e?.message === 'admin-not-configured') {
      return NextResponse.json({ ok: false, error: 'Lütfen e-posta adresinle şifre sıfırla.' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: 'İşlem yapılamadı.' }, { status: 500 });
  }
}
