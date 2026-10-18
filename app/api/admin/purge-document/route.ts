import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminApp } from '@/lib/firebaseAdmin';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { isAdminToken } from '@/lib/adminAuth';

/**
 * Psikolog başvurusu kontrol edildikten (onay ya da ret) sonra e-Devlet mezun belgesini
 * Cloudinary'den kalıcı olarak siler ve adresini kullanıcı ile başvuru kayıtlarından kaldırır.
 * Yalnızca yönetici çağırabilir.
 */
export const runtime = 'nodejs';


export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const db = adminDb();
    if (!app || !db) return NextResponse.json({ ok: false }, { status: 503 });

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const caller = token ? await getAuth(app).verifyIdToken(token).catch(() => null) : null;
    const isAdmin = isAdminToken(caller);
    if (!isAdmin) return NextResponse.json({ ok: false }, { status: 403 });

    const { uid } = await req.json().catch(() => ({}));
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return NextResponse.json({ ok: false }, { status: 400 });

    const userRef = db.collection('users').doc(uid);
    const appRef = db.collection('psychologist_applications').doc(uid);
    const [u, a] = await Promise.all([userRef.get(), appRef.get()]);
    const urls = [...new Set([u.get('diplomaUrl'), a.get('diplomaUrl')].filter((x): x is string => typeof x === 'string' && x.length > 0))];

    const results = await Promise.all(urls.map(url => deleteFromCloudinary(url).catch(() => false)));
    const patch = { diplomaUrl: '', documentDeletedAt: FieldValue.serverTimestamp() };
    await Promise.all([
      u.exists ? userRef.update(patch) : null,
      a.exists ? appRef.update(patch) : null,
    ]);
    return NextResponse.json({ ok: true, deleted: results.filter(Boolean).length, total: urls.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
