import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Sunucu uçlarında yönetici denetimi (firestore.rules içindeki isAdmin() ile aynı).
 * pskfurkan.manav@gmail.com Firebase'de kayıtlı olmadığından yalnızca doğrulanmış e-postayla kabul edilir.
 */
export function isAdminToken(t: DecodedIdToken | null | undefined): boolean {
  const email = (t?.email || '').toLowerCase();
  if (!email) return false;
  if (email === 'furkan@furkanmanav.com') return true;
  return email === 'pskfurkan.manav@gmail.com' && t?.email_verified === true;
}
