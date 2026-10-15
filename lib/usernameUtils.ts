/**
 * Username helper and validation utilities
 * Enforces plain English characters only: a-z, 0-9, and underscore (_)
 */

export function toEnglishLetters(str: string): string {
  if (!str) return '';
  return str
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c');
}

/**
 * Sanitizes input into a plain English handle:
 * - Replaces Turkish characters with English equivalents
 * - Strips leading @ and spaces
 * - Lowercases everything
 * - Keeps only [a-z0-9_]
 */
export function sanitizeUsername(raw: string): string {
  if (!raw) return '';
  const converted = toEnglishLetters(raw.trim());
  return converted
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Validates that username consists STRICTLY of plain English lowercase letters, numbers, and underscore.
 * Length must be between 3 and 25 characters.
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false;
  return /^[a-z0-9_]{3,25}$/.test(username);
}

/**
 * Returns a human-friendly Turkish error message if invalid, or null if valid.
 */
export function getUsernameValidationError(raw: string): string | null {
  if (!raw || !raw.trim()) {
    return 'Kullanıcı adı boş bırakılamaz.';
  }

  // Check if contains Turkish specific characters
  if (/[ğıüşöçİĞÜŞÖÇ]/.test(raw)) {
    return 'Kullanıcı adı Türkçe karakter içeremez. Lütfen yalnızca sade İngilizce karakterler (a-z) kullanın (Örn: c, g, i, o, s, u).';
  }

  // Check if contains spaces
  if (/\s/.test(raw)) {
    return 'Kullanıcı adı boşluk içeremez.';
  }

  // Check if contains disallowed special characters
  if (/[^a-zA-Z0-9_]/.test(raw.replace(/^@/, ''))) {
    return 'Kullanıcı adı yalnızca sade İngilizce harfler (a-z), rakamlar (0-9) ve alt çizgi (_) içerebilir. Özel karakterler kullanılamaz.';
  }

  const clean = sanitizeUsername(raw);
  if (clean.length < 3) {
    return 'Kullanıcı adı en az 3 karakter olmalıdır.';
  }

  if (clean.length > 25) {
    return 'Kullanıcı adı en fazla 25 karakter olabilir.';
  }

  if (!isValidUsername(clean)) {
    return 'Geçersiz kullanıcı adı. Yalnızca sade İngilizce harfler (a-z), rakamlar (0-9) ve alt çizgi (_) kullanılabilir.';
  }

  return null;
}
