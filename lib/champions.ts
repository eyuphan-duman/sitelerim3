import { FieldValue, type DocumentSnapshot, type Firestore } from 'firebase-admin/firestore';
import { DAY, monthKey, weekKey, type Champion } from './periods';
import type { Scores } from './scores';

/**
 * Hafta (pazartesi 00:00) ya da ay (ayın 1'i 00:00) bitince, biten dönemin birincileri champions/{anahtar}
 * belgesine bir kez yazılır ve birincilerin weeklyWins / monthlyWins sayacı bir artar.
 * Zamanlanmış görev (her gece 00:00, vercel.json) ve puan ucu çağırır; işlem tekrar çalışsa da
 * belge zaten varsa hiçbir şey yapmaz. Dönem bittikten 3 gün sonra artık yazılmaz (geç duyuru olmasın).
 */
export async function ensureChampions(db: Firestore, sc: Scores, now = Date.now()) {
  const jobs = [
    { period: 'week' as const, key: weekKey(sc.prevWeekStart), start: sc.prevWeekStart, end: sc.weekStart, winners: sc.prevWeekWinners, field: 'weeklyWins' },
    { period: 'month' as const, key: monthKey(sc.prevMonthStart), start: sc.prevMonthStart, end: sc.monthStart, winners: sc.prevMonthWinners, field: 'monthlyWins' },
  ];
  const created: string[] = [];
  for (const j of jobs) {
    if (!j.winners.length || now < j.end || now - j.end > 3 * DAY) continue;
    const ref = db.collection('champions').doc(j.key);
    const made = await db.runTransaction(async tx => {
      if ((await tx.get(ref)).exists) return false;
      tx.create(ref, { key: j.key, period: j.period, start: j.start, end: j.end, winners: j.winners, createdAt: FieldValue.serverTimestamp() });
      for (const w of j.winners) tx.set(db.collection('users').doc(w.uid), { [j.field]: FieldValue.increment(1) }, { merge: true });
      return true;
    });
    if (made) created.push(j.key);
  }
  return created;
}

/** Son biten haftanın ve ayın birincileri (yoksa null) */
export async function readChampions(db: Firestore, sc: Pick<Scores, 'prevWeekStart' | 'prevMonthStart'>): Promise<{ week: Champion | null; month: Champion | null }> {
  const [w, m] = await db.getAll(
    db.collection('champions').doc(weekKey(sc.prevWeekStart)),
    db.collection('champions').doc(monthKey(sc.prevMonthStart)),
  );
  const conv = (d: DocumentSnapshot): Champion | null => {
    const x = d.data();
    return x ? { key: x.key, period: x.period, start: x.start, end: x.end, winners: x.winners || [] } : null;
  };
  return { week: conv(w), month: conv(m) };
}
