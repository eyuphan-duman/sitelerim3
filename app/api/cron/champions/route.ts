import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebaseAdmin';
import { computeScores } from '@/lib/scores';
import { ensureChampions } from '@/lib/champions';

/**
 * Her gece 00:00'da (Türkiye saati, vercel.json) çalışır. Hafta ya da ay yeni bittiyse biten dönemin
 * birincilerini kaydeder ve puan ucunun önbelleğini tazeler; böylece yeni dönemin puanları sıfırdan
 * başlar ve birinci duyurusu hemen görünür. Aynı gün tekrar çalışırsa bir şey değiştirmez.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });
  const created = await ensureChampions(db, await computeScores(db));
  revalidatePath('/api/forum/scores');
  return NextResponse.json({ ok: true, created });
}
