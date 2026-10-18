/**
 * Bu tarayıcıya özgü rastgele cihaz kimliği. Giriş korumasında hatalı denemeler, kilit ve yasak
 * yalnızca deneyen cihaza uygulansın diye kullanılır (kişisel bilgi içermez).
 */
const KEY = 'logos-device-id';

export function getDeviceId(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && /^[A-Za-z0-9_-]{16,64}$/.test(saved)) return saved;
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 32);
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Depolama kapalıysa (gizli sekme vb.) oturum boyunca geçerli bir kimlik
    const w = window as unknown as { __logosDeviceId?: string };
    w.__logosDeviceId ||= Math.random().toString(36).slice(2).padEnd(16, '0') + Date.now().toString(36);
    return w.__logosDeviceId;
  }
}
