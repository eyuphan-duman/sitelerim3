import { createHash } from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { App } from 'firebase-admin/app';
import { emailForUsername } from '@/lib/firebaseAdmin';
import { pushNotification } from '@/lib/push';

/**
 * Şifreli giriş koruması (sunucu tarafı). Sayaçlar yalnızca sunucuda tutulur (login_guard, istemciye kapalı).
 *
 *   Hesap düzeyinde (kim denerse denesin):
 *     5. art arda hatalı denemeden itibaren her denemede reCAPTCHA istenir;
 *     hesap sahibine bir kez "Bu sen misin?" bildirimi gider.
 *   Cihaz düzeyinde (yalnızca deneyen cihaz):
 *     7. hatalı denemede o cihazdan o hesaba giriş 1 saat kapanır;
 *     10. hatalı denemede o cihazdan o hesaba giriş kalıcı olarak yasaklanır (şifre sıfırlanınca kalkar).
 *
 * Kilitler yalnızca deneyen cihazı etkiler; böylece biri bilerek yanlış şifre girerek gerçek sahibini
 * hesabından uzaklaştıramaz. Başarılı girişte o cihazın ve hesabın sayaçları sıfırlanır.
 */
export const CAPTCHA_AT = 5;
export const LOCK_AT = 7;
export const BAN_AT = 10;
const LOCK_MS = 60 * 60_000;
const STREAK_RESET_MS = 24 * 60 * 60_000;

export type Attempt = {
  identifier: string;
  password: string;
  deviceId: string;
  captchaToken?: string;
  platform: 'web' | 'android' | 'legacy';
  ip: string;
  place: string;
  userAgent: string;
};

export type GuardResult =
  | { ok: true; email: string; uid: string }
  | { ok: false; status: number; code: string; error: string; captchaRequired?: boolean; until?: number };

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 40);
export const accountKey = (normalized: string) => sha('acct:' + normalized);
const deviceKey = (deviceId: string) => sha('dev:' + deviceId);
const API_KEY = () => process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

export const captchaConfigured = () => Boolean(process.env.RECAPTCHA_SECRET_KEY);

async function verifyCaptcha(token: string | undefined, ip: string) {
  if (!token) return false;
  const body = new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY || '', response: token });
  if (ip) body.set('remoteip', ip);
  const r = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body }).catch(() => null);
  const data = r ? await r.json().catch(() => ({})) : {};
  return data?.success === true;
}

/** Şifreyi Firebase Auth üzerinde doğrular (Firebase'in kendi deneme sınırı da devrededir) */
async function checkPassword(email: string, password: string) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await r.json().catch(() => ({}));
  if (r.ok && data.localId) return { ok: true as const, uid: data.localId as string, idToken: data.idToken as string };
  return { ok: false as const, code: String(data?.error?.message || '') };
}

/** Şifrenin en son ne zaman değiştirildiği (ms). Kullanıcının kendi oturum anahtarıyla sorgulanır. */
export async function passwordUpdatedAt(idToken: string): Promise<number> {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  }).catch(() => null);
  const data = r ? await r.json().catch(() => ({})) : {};
  return Number(data?.users?.[0]?.passwordUpdatedAt) || 0;
}

/**
 * Hesap askıdaysa ve şifre askıya alındıktan sonra değiştirildiyse askıyı ve o hesaptaki cihaz yasaklarını kaldırır.
 * Askı sürüyorsa true döner.
 */
export async function lockStillActive(db: Firestore, uid: string, email: string, idToken: string): Promise<boolean> {
  const ref = db.collection('security').doc(uid);
  const snap = await ref.get();
  if (!snap.exists || snap.get('locked') !== true) return false;
  const lockedAt = snap.get('lockedAt')?.toMillis?.() || 0;
  const changedAt = await passwordUpdatedAt(idToken);
  if (changedAt && changedAt > lockedAt) {
    await ref.delete();
    await clearDeviceBans(db, email);
    return false;
  }
  return true;
}

export async function clearDeviceBans(db: Firestore, email: string) {
  const devs = await db.collection('login_guard').doc(accountKey(email.toLowerCase())).collection('devices').get();
  await Promise.all(devs.docs.map(d => d.ref.delete()));
}

/** Hesap sahibine "Bu sen misin?" bildirimi (uygulama içi + anlık bildirim) */
async function sendLoginAlert(app: App, db: Firestore, uid: string, a: Attempt) {
  const device = a.platform === 'android' ? 'Android uygulaması' : describeBrowser(a.userAgent);
  const added = await db.collection('notifications').add({
    toUid: uid,
    fromUid: 'system',
    fromUser: 'Logos Güvenlik',
    fromUsername: '',
    fromPhotoURL: '',
    type: 'login_alert',
    message: 'hesabına art arda yanlış şifreyle giriş denendi. Bu sen misin?',
    postId: '',
    postTitle: [device, a.place].filter(Boolean).join(' · ').slice(0, 80),
    read: false,
    answered: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await pushNotification(app, db, added.id).catch(() => 0);
}

function describeBrowser(ua: string) {
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Tarayıcı';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${b} (${os})` : b;
}

const fail = (status: number, code: string, error: string, extra: Partial<Extract<GuardResult, { ok: false }>> = {}): GuardResult =>
  ({ ok: false, status, code, error, ...extra });

export async function attemptLogin(app: App, db: Firestore, a: Attempt): Promise<GuardResult> {
  const raw = a.identifier.trim().toLowerCase().replace(/^@/, '');
  const isEmail = raw.includes('@');
  const email = isEmail ? raw : await emailForUsername(raw).catch(() => null);
  const acctRef = db.collection('login_guard').doc(accountKey(email || 'u:' + raw));
  const devRef = acctRef.collection('devices').doc(deviceKey(a.deviceId));
  const now = Date.now();
  const [acctSnap, devSnap] = await Promise.all([acctRef.get(), devRef.get()]);
  let acct = acctSnap.data() || {};
  let dev = devSnap.data() || {};
  // Uzun süre deneme olmazsa seri sıfırlanır (cihaz yasağı kalıcıdır)
  if (acct.lastFailAt && now - acct.lastFailAt > STREAK_RESET_MS) acct = { alertAt: acct.alertAt };
  if (!dev.banned && dev.lastAt && now - dev.lastAt > STREAK_RESET_MS) dev = {};

  if (dev.banned) {
    return fail(403, 'device_banned', 'Çok fazla hatalı deneme nedeniyle bu cihazdan bu hesaba giriş engellendi. Şifreni sıfırladığında engel kalkar.');
  }
  if (dev.lockedUntil && dev.lockedUntil > now) {
    const mins = Math.ceil((dev.lockedUntil - now) / 60_000);
    return fail(429, 'device_locked', `Çok fazla hatalı deneme yapıldı. Bu cihazdan bu hesaba ${mins} dakika sonra yeniden giriş yapabilirsin.`, { until: dev.lockedUntil });
  }

  const needCaptcha = captchaConfigured() && ((acct.fails || 0) >= CAPTCHA_AT || (dev.fails || 0) >= CAPTCHA_AT);
  if (needCaptcha && !(await verifyCaptcha(a.captchaToken, a.ip))) {
    return fail(400, 'captcha_required', a.captchaToken ? 'Güvenlik doğrulaması geçersiz ya da süresi doldu. Lütfen tekrar doğrula.' : 'Çok fazla hatalı deneme yapıldı. Devam etmek için güvenlik doğrulamasını tamamla.', { captchaRequired: true });
  }

  const check = email ? await checkPassword(email, a.password) : { ok: false as const, code: 'EMAIL_NOT_FOUND' };

  if (!check.ok) {
    if (check.code.startsWith('TOO_MANY_ATTEMPTS')) return fail(429, 'too_many', 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.');
    if (check.code.startsWith('USER_DISABLED')) return fail(403, 'disabled', 'Bu hesap devre dışı bırakılmış.');

    // Hatalı deneme: hesap ve cihaz sayaçları
    const acctFails = (acct.fails || 0) + 1;
    const devFails = (dev.fails || 0) + 1;
    const devPatch: Record<string, unknown> = { fails: devFails, lastAt: now, platform: a.platform };
    if (devFails >= BAN_AT) Object.assign(devPatch, { banned: true, bannedAt: now });
    else if (devFails === LOCK_AT) devPatch.lockedUntil = now + LOCK_MS;
    const acctPatch: Record<string, unknown> = { fails: acctFails, lastFailAt: now, streakStart: acct.streakStart && acctFails > 1 ? acct.streakStart : now };
    await Promise.all([devRef.set(devPatch, { merge: false }), acctRef.set({ ...acct, ...acctPatch })]);

    // 5. hatalı denemede hesap sahibine bir kez bildirim (bu seri için)
    if (email && acctFails >= CAPTCHA_AT && !(acct.alertAt && acct.alertAt >= (acctPatch.streakStart as number))) {
      try {
        const user = await getAuth(app).getUserByEmail(email);
        if (user.providerData.some(p => p.providerId === 'password')) {
          await acctRef.set({ alertAt: now }, { merge: true });
          await sendLoginAlert(app, db, user.uid, a);
        }
      } catch {}
    }

    if (devFails >= BAN_AT) return fail(403, 'device_banned', 'Çok fazla hatalı deneme nedeniyle bu cihazdan bu hesaba giriş engellendi. Şifreni sıfırladığında engel kalkar.');
    if (devFails === LOCK_AT) return fail(429, 'device_locked', 'Çok fazla hatalı deneme yapıldı. Bu cihazdan bu hesaba 1 saat boyunca giriş yapılamaz.', { until: now + LOCK_MS });
    const nextCaptcha = captchaConfigured() && (acctFails >= CAPTCHA_AT || devFails >= CAPTCHA_AT);
    const left = devFails < LOCK_AT ? LOCK_AT - devFails : BAN_AT - devFails;
    const warn = devFails >= CAPTCHA_AT - 1 ? ` ${left} hakkın kaldı; sonra bu cihazdan giriş ${devFails < LOCK_AT ? '1 saat kapanır' : 'kalıcı olarak engellenir'}.` : '';
    return fail(401, 'invalid', `Kullanıcı adı, e-posta ya da şifre hatalı.${warn}`, { captchaRequired: nextCaptcha });
  }

  // Doğru şifre: hesap askıdaysa (sahibi "Ben değilim" dediyse) şifre değişene kadar giriş yok
  if (await lockStillActive(db, check.uid, email!, check.idToken)) {
    return fail(423, 'account_locked', 'Hesabın güvenlik nedeniyle askıya alındı ve verilerin koruma altında. Şifreni sıfırladıktan sonra giriş yapabilirsin.');
  }

  await Promise.all([devRef.delete(), acctRef.set({ fails: 0, lastOkAt: now, alertAt: acct.alertAt || null })]);
  return { ok: true, email: email!, uid: check.uid };
}

/** İstekten IP, konum (Vercel başlıkları) ve tarayıcı bilgisi */
export function requestMeta(req: Request) {
  const h = req.headers;
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || '';
  const city = decodeURIComponent(h.get('x-vercel-ip-city') || '');
  const country = h.get('x-vercel-ip-country') || '';
  return { ip, place: [city, country].filter(Boolean).join(', '), userAgent: h.get('user-agent') || '' };
}
