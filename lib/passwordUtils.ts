/**
 * Şifre kuralları (tüm kayıt ve şifre değiştirme formlarında ortak):
 *  - en az 6 karakter
 *  - en az bir rakam
 *  - güç en az "Orta"
 */
export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

export function scorePassword(pw: string) {
  const length = pw.length;
  const hasLower = /[a-zçğıöşü]/.test(pw);
  const hasUpper = /[A-ZÇĞİÖŞÜ]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasLetter = hasLower || hasUpper;
  const hasSymbol = /[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(pw);
  const repeated = /^(.)\1+$/.test(pw) || /^(0123|1234|2345|3456|4567|5678|6789|abcd|qwer)/i.test(pw);

  let score = 0;
  if (length >= 8) score++;
  if (length >= 12) score++;
  if (hasLower && hasUpper) score++;
  if (hasSymbol) score++;
  if (hasDigit && hasLetter) score++;
  if (repeated) score = Math.max(0, score - 2);

  const strength: PasswordStrength = !length ? 'empty' : score <= 1 ? 'weak' : score === 2 ? 'medium' : 'strong';
  return { strength, length, hasDigit, hasLetter, longEnough: length >= 6 };
}

export const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  empty: '',
  weak: 'Zayıf',
  medium: 'Orta',
  strong: 'Güçlü',
};

/** Kurala uymuyorsa kullanıcıya gösterilecek hata, uyuyorsa null */
export function getPasswordError(pw: string): string | null {
  const s = scorePassword(pw);
  if (!s.longEnough) return 'Şifre en az 6 karakter olmalı.';
  if (!s.hasDigit) return 'Şifre en az bir rakam içermeli.';
  if (s.strength === 'weak') return 'Şifre çok zayıf. Daha uzun yap ya da büyük harf veya sembol ekle.';
  return null;
}

/** Güçlendirmek için kısa öneri */
export function passwordTip(pw: string): string {
  const s = scorePassword(pw);
  if (!s.longEnough) return 'En az 6 karakter yaz.';
  if (!s.hasDigit) return 'En az bir rakam ekle.';
  if (s.strength === 'weak') return 'Daha uzun yaz ya da büyük harf veya sembol ekle (ör. ! ? .).';
  if (s.strength === 'medium') return 'Kabul edilir. 12+ karakter ya da sembolle daha güçlü olur.';
  return 'Güçlü bir şifre.';
}
