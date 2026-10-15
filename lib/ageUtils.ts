/**
 * Age helper and validation utilities
 * Enforces 18+ requirement for all user registrations
 */

export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const parts = birthDateString.split('-');
  if (parts.length !== 3) return 0;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;

  const birthDate = new Date(year, month, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isAtLeast18(birthDateString: string): boolean {
  if (!birthDateString) return false;
  return calculateAge(birthDateString) >= 18;
}

export function getMaxBirthDateFor18(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
}

export function getBirthDateValidationError(birthDateString: string): string | null {
  if (!birthDateString || !birthDateString.trim()) {
    return 'Lütfen doğum tarihinizi girin.';
  }
  const age = calculateAge(birthDateString);
  if (age < 18) {
    return 'Platformumuza yalnızca 18 yaş ve üzeri kullanıcılar kayıt olabilir (18 yaşından küçüklerin kaydı kabul edilmemektedir).';
  }
  if (age > 120) {
    return 'Lütfen geçerli bir doğum tarihi girin.';
  }
  return null;
}
