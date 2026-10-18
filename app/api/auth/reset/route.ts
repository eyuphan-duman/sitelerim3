import { NextResponse } from 'next/server';
import { promises as dns } from 'dns';
import { getAuth } from 'firebase-admin/auth';
import { emailForUsername, getAdminApp } from '@/lib/firebaseAdmin';

/**
 * Şifre sıfırlama: bağlantı yalnızca
 *  - e-posta biçimi doğru,
 *  - alan adı gerçekten e-posta alabilen (MX kaydı olan) ve
 *  - sitede kayıtlı bir hesaba ait
 * olduğunda gönderilir. Hesabın kayıtlı olup olmadığı yanıttan anlaşılmaz (bir e-postanın
 * foruma üye olup olmadığı öğrenilemesin); kayıtlı olsa da olmasa da aynı yanıt döner.
 */
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;


async function domainAcceptsMail(domain: string) {
  try {
    const mx = await dns.resolveMx(domain);
    return mx.some(r => r.exchange && r.exchange !== '.');
  } catch {
    return false;
  }
}

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    const raw = typeof identifier === 'string' ? identifier.trim() : '';
    if (!raw || raw.length > 200) return fail('Kullanıcı adını ya da e-posta adresini yaz.');
    if (!getAdminApp()) return fail('Şifre sıfırlama şu an kullanılamıyor. Lütfen biraz sonra tekrar dene.', 503);

    let email: string | null;
    // Kayıtlı olsun olmasın aynı yanıt: yalnızca kişinin kendi yazdığı e-posta geri gösterilir
    const done = () => NextResponse.json({ ok: true, sentTo: raw.includes('@') ? raw.toLowerCase() : null });

    if (raw.includes('@')) {
      email = raw.toLowerCase();
      if (!EMAIL_RE.test(email)) return fail('Geçerli bir e-posta adresi yaz (ör. ad@gmail.com).');
      if (!(await domainAcceptsMail(email.split('@')[1]))) {
        return fail(`"${email.split('@')[1]}" e-posta alabilen bir adres değil. Yazımı kontrol et.`);
      }
      try {
        await getAuth(getAdminApp()!).getUserByEmail(email);
      } catch (e: any) {
        if (e?.code === 'auth/user-not-found') return done();
        throw e;
      }
    } else {
      email = await emailForUsername(raw.toLowerCase().replace(/^@/, ''));
      if (!email) return done();
    }

    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    });
    if (!r.ok) {
      const code = (await r.json().catch(() => ({})))?.error?.message || '';
      if (code.startsWith('TOO_MANY_ATTEMPTS') || code.startsWith('RESET_PASSWORD_EXCEED_LIMIT')) {
        return fail('Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.', 429);
      }
      return fail('Sıfırlama bağlantısı gönderilemedi. Lütfen tekrar dene.', 502);
    }
    return done();
  } catch {
    return fail('İşlem yapılamadı. Lütfen tekrar dene.', 500);
  }
}
