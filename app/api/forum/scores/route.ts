import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { computeScores, LEVEL_SIZE, POINTS } from '@/lib/scores';
import { ensureChampions, readChampions } from '@/lib/champions';

/**
 * Logos puanları, seviyeler ve haftanın / ayın birincileri.
 * Sunucuda hesaplanır ve en fazla 30 dakikada bir yenilenir (Firestore okuma sınırını korur).
 * Dönem yeni bittiyse biten dönemin birincileri burada da kaydedilir (zamanlanmış görev gecikirse diye).
 */
export const dynamic = 'force-static';
export const revalidate = 1800;

export async function GET() {
  const db = adminDb();
  if (!db) return NextResponse.json({ configured: false, users: {}, weekly: [], monthly: [], allTime: [], champions: { week: null, month: null }, rules: POINTS, levelSize: LEVEL_SIZE });
  const sc = await computeScores(db);
  await ensureChampions(db, sc).catch(() => []);
  const champions = await readChampions(db, sc).catch(() => ({ week: null, month: null }));
  return NextResponse.json({
    at: sc.at, weekStart: sc.weekStart, monthStart: sc.monthStart,
    users: sc.users, weekly: sc.weekly, monthly: sc.monthly, allTime: sc.allTime,
    champions, rules: POINTS, levelSize: LEVEL_SIZE, configured: true,
  });
}
