import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

// İzin verilen dosya türleri ve MB cinsinden azami boyutları
const ALLOWED_TYPES: Record<string, number> = {
  'image/jpeg': 10, 'image/png': 10, 'image/webp': 10, 'image/gif': 10, 'image/avif': 10,
  'application/pdf': 10,
  'video/mp4': 100, 'video/webm': 100, 'video/quicktime': 100,
};

const ALLOWED_EXT = /\.(jpe?g|png|webp|gif|avif|pdf|mp4|webm|mov)$/i;

// Giriş yapmamış kişi yalnızca kayıt sırasında e-Devlet mezun belgesi (resim ya da PDF) yükleyebilir
const GUEST_FOLDER = 'manav-platform/diplomas';
const GUEST_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** Yükleme yalnızca oturum açmış kişilere açıktır (Cloudinary kotasının kötüye kullanılmaması için) */
async function signedInUid(request: Request): Promise<string | null> {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const app = getAdminApp();
  if (!token || !app) return null;
  const decoded = await getAuth(app).verifyIdToken(token).catch(() => null);
  return decoded?.uid || null;
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = (data.get('file') || data.get('upload')) as unknown as File;
    const rawFolder = (data.get('folder') as string) || 'manav-platform';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'Dosya bulunamadı' }, { status: 400 });
    }

    // Klasör yalnızca manav-platform altında ve güvenli karakterlerle olabilir
    const folder = /^manav-platform(\/[a-z0-9_-]{1,40}){0,2}$/i.test(rawFolder) ? rawFolder : 'manav-platform';

    const uid = await signedInUid(request);
    if (!uid && (folder !== GUEST_FOLDER || !GUEST_TYPES.includes(file.type))) {
      return NextResponse.json({ success: false, error: 'Dosya yüklemek için giriş yapmalısın.' }, { status: 401 });
    }

    const maxMb = ALLOWED_TYPES[file.type];
    if (!maxMb || !ALLOWED_EXT.test(file.name)) {
      return NextResponse.json({ success: false, error: 'Bu dosya türü desteklenmiyor. Yalnızca resim, PDF veya video yükleyebilirsiniz.' }, { status: 415 });
    }
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ success: false, error: `Dosya çok büyük (en fazla ${maxMb} MB).` }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if Cloudinary environment variables are configured
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const hasCloudinary = Boolean(cloudName && apiKey && apiSecret && cloudName !== 'your_cloud_name');

    if (hasCloudinary) {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const result = await uploadToCloudinary(buffer, folder, `${Date.now()}-${sanitizedFileName}`);
      return NextResponse.json({
        success: true,
        url: result.url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        cloudinary: true,
      });
    }

    // In production (e.g. Vercel), serverless filesystem is read-only.
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      return NextResponse.json({
        success: false,
        error: 'Cloudinary anahtarları tanımlanmamış. Lütfen Vercel Environment Variables ayarlarını kontrol edin.'
      }, { status: 500 });
    }

    // Fallback for local development when Cloudinary env is not set
    console.warn('Cloudinary bilgileri eksik, yerel dosya sistemine kaydediliyor.');
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const path = join(uploadDir, filename);
    await writeFile(path, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url, fallback: true });
  } catch (error: any) {
    console.error('Yükleme hatası:', error);
    return NextResponse.json({ success: false, error: 'Yükleme sırasında hata oluştu' }, { status: 500 });
  }
}
