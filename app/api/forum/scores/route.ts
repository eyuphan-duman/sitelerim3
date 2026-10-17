import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { computeScores, LEVEL_SIZE, POINTS } from '@/lib/scores';

/**
 * Logos puanları, seviyeler ve haftanın / ayın birincileri.
 * Sunucuda hesaplanır ve en fazla 30 dakikada bir yenilenir (Firestore okuma sınırını korur).
 */
export const dynamic = 'force-static';
export const revalidate = 1800;

export async function GET() {
  const db = adminDb();
  if (!db) return NextResponse.json({ configured: false, users: {}, weekly: [], monthly: [], allTime: [], rules: POINTS, levelSize: LEVEL_SIZE });
  const scores = await computeScores(db);
  return NextResponse.json({ ...scores, rules: POINTS, levelSize: LEVEL_SIZE, configured: true });
}
