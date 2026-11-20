import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, dataUrl } = body;

    if (!filename || !dataUrl) {
      return NextResponse.json({ success: false, error: 'Dosya adı ve görsel verisi zorunludur.' }, { status: 400 });
    }

    // Güvenli dosya adı kontrolü (sadece alfanümerik, tire ve alt çizgi)
    const cleanName = filename.replace(/[^a-zA-Z0-9_-]/g, '').trim();
    if (!cleanName) {
      return NextResponse.json({ success: false, error: 'Geçersiz dosya adı.' }, { status: 400 });
    }

    // Base64 verisini ayrıştır
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ success: false, error: 'Geçersiz Base64 görsel formatı.' }, { status: 400 });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const outDir = path.join(process.cwd(), 'public', 'video-covers');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const filePath = path.join(outDir, `${cleanName}.jpg`);
    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/video-covers/${cleanName}.jpg`,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('Save cover error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Kapak kaydedilemedi.' }, { status: 500 });
  }
}
