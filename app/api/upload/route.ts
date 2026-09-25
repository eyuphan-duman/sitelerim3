import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = (data.get('file') || data.get('upload')) as unknown as File;
    const folder = (data.get('folder') as string) || 'manav-platform';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Dosya bulunamadı' }, { status: 400 });
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
    return NextResponse.json({ success: false, error: error.message || 'Yükleme sırasında hata oluştu' }, { status: 500 });
  }
}
