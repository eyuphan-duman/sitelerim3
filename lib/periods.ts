/**
 * Haftalık ve aylık puan dönemleri (Türkiye saati, UTC+3, yaz saati yok).
 * Hafta pazartesi 00:00'da, ay ayın 1'i 00:00'da başlar; o anda dönem puanları sıfırdan başlar.
 * Web (lib/periods.ts) ve uygulama (src/lib/periods.ts) aynı dosyayı kullanır.
 */
export const TR_OFFSET = 3 * 3600_000;
export const DAY = 86_400_000;

export function periodStarts(now = Date.now()) {
  const tr = new Date(now + TR_OFFSET);
  const y = tr.getUTCFullYear(), m = tr.getUTCMonth(), d = tr.getUTCDate();
  const dow = (tr.getUTCDay() + 6) % 7; // pazartesi = 0
  const weekStart = Date.UTC(y, m, d - dow) - TR_OFFSET;
  return {
    weekStart,
    prevWeekStart: weekStart - 7 * DAY,
    monthStart: Date.UTC(y, m, 1) - TR_OFFSET,
    prevMonthStart: Date.UTC(y, m - 1, 1) - TR_OFFSET,
  };
}

const trDate = (ms: number) => new Date(ms + TR_OFFSET).toISOString().slice(0, 10);
export const weekKey = (start: number) => `w-${trDate(start)}`;
export const monthKey = (start: number) => `m-${trDate(start).slice(0, 7)}`;

/** Bir dönemin birincileri (eşitlikte birden fazla kişi) */
export type Champion = {
  key: string;
  period: 'week' | 'month';
  start: number;
  end: number;
  winners: { uid: string; points: number }[];
};

/** Birinci, bir sonraki dönem boyunca duyurulur; haftanın birincisi rozeti de o hafta boyunca görünür */
export function isCurrentChampion(c: Champion | null | undefined, now = Date.now()): c is Champion {
  if (!c || !c.winners?.length) return false;
  const p = periodStarts(now);
  return c.period === 'week' ? c.start === p.prevWeekStart : c.start === p.prevMonthStart;
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** "12–18 Ekim haftası" ya da "Eylül 2026" */
export function championLabel(c: Champion) {
  const a = new Date(c.start + TR_OFFSET);
  if (c.period === 'month') return `${MONTHS[a.getUTCMonth()]} ${a.getUTCFullYear()}`;
  const b = new Date(c.end - DAY + TR_OFFSET);
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()}–${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} haftası`
    : `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} – ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} haftası`;
}
