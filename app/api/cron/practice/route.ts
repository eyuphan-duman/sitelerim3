import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { pushToUser } from '@/lib/push';

/**
 * Danışanlarım günlük özeti (Vercel zamanlanmış görevi, her sabah 08:00 Türkiye saati — vercel.json).
 * O gün planlı seansı olan psikologlara "Bugün N seansın var" bildirimi gider. Kilit ekranında gizlilik için
 * danışan adı değil, yalnızca baş harfleri yazılır. Aynı gün ikinci kez çalışırsa tekrar göndermez.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TR_OFFSET = 3 * 3600_000;
const initials = (name: string) => {
  const parts = String(name || '').trim().split(/\s+/).slice(0, 2);
  return parts.length && parts[0] ? parts.map(w => w[0].toLocaleUpperCase('tr-TR')).join('.') + '.' : '?';
};
const hhmm = (ms: number) => {
  const d = new Date(ms + TR_OFFSET);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const app = getAdminApp();
  const db = adminDb();
  if (!app || !db) return NextResponse.json({ ok: false }, { status: 503 });

  // Bugünün Türkiye saatine göre başlangıcı ve bitişi
  const tr = new Date(Date.now() + TR_OFFSET);
  const dayKey = tr.toISOString().slice(0, 10);
  const start = Date.UTC(tr.getUTCFullYear(), tr.getUTCMonth(), tr.getUTCDate()) - TR_OFFSET;
  const end = start + 24 * 3600_000;

  let sent = 0;
  const refs = await db.collection('practice').listDocuments();
  for (const ref of refs) {
    try {
      const settings = (await ref.get()).data() || {};
      if (settings.dailySummary === false || settings.lastSummaryDay === dayKey) continue;
      const snap = await ref.collection('sessions')
        .where('start', '>=', Timestamp.fromMillis(start)).where('start', '<', Timestamp.fromMillis(end)).orderBy('start', 'asc').get();
      const today = snap.docs.map(d => d.data()).filter(s => s.status === 'planned');
      if (!today.length) continue;
      const list = today.slice(0, 6).map(s => `${hhmm(s.start.toMillis())} ${initials(s.clientName)}`).join(', ');
      const n = await pushToUser(app, db, ref.id, {
        title: 'Logos · Ajandan',
        body: `Bugün ${today.length} seansın var: ${list}${today.length > 6 ? '…' : ''}`,
        tag: `practice-day-${dayKey}`,
        data: { type: 'practice', route: '/danisanlar' },
      });
      await ref.set({ lastSummaryDay: dayKey }, { merge: true });
      sent += n;
    } catch {}
  }
  return NextResponse.json({ ok: true, psychologists: refs.length, sent });
}
