import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { deleteFromCloudinary, readDocumentForReview } from '@/lib/cloudinary';
import { isAdminToken } from '@/lib/adminAuth';

/**
 * Psikolog başvurusundaki e-Devlet mezun belgesini yöneticiye TEK SEFERLİK gösterir:
 * belge okunur, yöneticiye görüntü olarak gönderilir ve aynı anda Cloudinary'den kalıcı olarak silinir;
 * adresi başvuru ve profil kayıtlarından kaldırılır. Okuma başarısız olursa hiçbir şey silinmez.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) return NextResponse.json({ ok: false, error: 'Sunucu yapılandırılmamış.' }, { status: 503 });

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const caller = token ? await getAuth(app).verifyIdToken(token).catch(() => null) : null;
    if (!isAdminToken(caller)) return NextResponse.json({ ok: false }, { status: 403 });

    const { uid, imageOnly } = await req.json().catch(() => ({}));
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return NextResponse.json({ ok: false }, { status: 400 });

    const appRef = db.collection('psychologist_applications').doc(uid);
    const userRef = db.collection('users').doc(uid);
    const [a, u] = await Promise.all([appRef.get(), userRef.get()]);
    const url = (a.get('diplomaUrl') as string) || (u.get('diplomaUrl') as string) || '';
    if (!url) return NextResponse.json({ ok: false, error: 'Bu başvuruda görüntülenecek belge yok (daha önce görüntülenip silinmiş olabilir).' }, { status: 404 });

    const pages = await readDocumentForReview(url, Boolean(imageOnly)).catch(() => []);
    if (pages === null) {
      return NextResponse.json({ ok: false, error: 'Bu belge uygulamada gösterilemiyor; web yönetim panelinden görüntüleyin. Belge silinmedi.' }, { status: 415 });
    }
    if (!pages.length) {
      return NextResponse.json({ ok: false, error: 'Belge okunamadı; silinmedi. Lütfen tekrar deneyin.' }, { status: 502 });
    }

    // Görüntü yöneticiye gönderilmeden önce belge kalıcı olarak silinir; silinemezse gösterilmez
    const deleted = await deleteFromCloudinary(url).catch(() => false);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Belge sistemden silinemediği için gösterilmedi. Lütfen tekrar deneyin.' }, { status: 502 });
    }
    const patch = {
      diplomaUrl: '',
      documentDeletedAt: FieldValue.serverTimestamp(),
      documentViewedAt: FieldValue.serverTimestamp(),
      documentViewedBy: caller!.uid,
    };
    await Promise.all([
      a.exists ? appRef.update(patch) : null,
      u.exists && u.get('diplomaUrl') !== undefined ? userRef.update({ diplomaUrl: FieldValue.delete() }) : null,
    ]);

    return NextResponse.json({ ok: true, pages }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, error: 'Belge gösterilemedi.' }, { status: 500 });
  }
}
