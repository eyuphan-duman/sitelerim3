import { v2 as cloudinary } from 'cloudinary';

function getCleanConfig() {
  const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '')
    .replace(/^["']|["']$/g, '')
    .trim();
  const api_key = (process.env.CLOUDINARY_API_KEY || '')
    .replace(/^["']|["']$/g, '')
    .trim();
  const api_secret = (process.env.CLOUDINARY_API_SECRET || '')
    .replace(/^["']|["']$/g, '')
    .trim();

  return { cloud_name, api_key, api_secret };
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'manav-platform',
  filename?: string
): Promise<{ url: string; public_id: string; format: string; resource_type: string }> {
  const { cloud_name, api_key, api_secret } = getCleanConfig();

  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL.replace(/^["']|["']$/g, '').trim(),
      secure: true,
    });
  } else {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Automatically detect image, video, audio, raw document
        public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed'));
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export default cloudinary;

/**
 * Cloudinary adresinden dosyayı kalıcı olarak siler.
 * Adres biçimi: https://res.cloudinary.com/<bulut>/<tür>/upload/[v123/]<public_id>.<uzantı>
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  const m = url.match(/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:[^/]*\/)*?(?:v\d+\/)?(.+)$/);
  if (!m) return false;
  const resourceType = m[1] as 'image' | 'video' | 'raw';
  const path = decodeURIComponent(m[2]);
  // image/video için public_id uzantısızdır; raw dosyalarda uzantı public_id'nin parçasıdır
  const publicId = resourceType === 'raw' ? path : path.replace(/\.[^/.]+$/, '');
  const { cloud_name, api_key, api_secret } = getCleanConfig();
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL.replace(/^["']|["']$/g, '').trim(), secure: true });
  } else {
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  }
  const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  return res?.result === 'ok' || res?.result === 'not found';
}

function configure() {
  const { cloud_name, api_key, api_secret } = getCleanConfig();
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL.replace(/^["']|["']$/g, '').trim(), secure: true });
  } else {
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  }
}

export type ReviewPage = { mime: string; data: string };

/**
 * Yönetici incelemesi için belgeyi bir kez okur ve görüntü olarak döndürür (silme işi çağırana aittir).
 * PDF'ler sayfa sayfa JPEG'e çevrilir; böylece telefonda da indirilmeden ekranda gösterilebilir.
 * Görüntüye çevrilemeyen (raw) dosyada imageOnly ise null döner ve belge silinmemelidir.
 */
export async function readDocumentForReview(url: string, imageOnly: boolean): Promise<ReviewPage[] | null> {
  const m = url.match(/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:[^/]*\/)*?(?:v\d+\/)?(.+)$/);
  if (!m) throw new Error('unrecognized-url');
  const resourceType = m[1];
  const path = decodeURIComponent(m[2]);
  const ext = (path.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  configure();

  const fetchAs = async (src: string, mime: string) => {
    const r = await fetch(src, { cache: 'no-store' });
    if (!r.ok) return null;
    return { mime, data: Buffer.from(await r.arrayBuffer()).toString('base64') };
  };

  if (resourceType === 'image') {
    const publicId = path.replace(/\.[^/.]+$/, '');
    const pageUrl = (page?: number) => cloudinary.url(publicId, {
      resource_type: 'image', type: 'upload', sign_url: true, secure: true,
      format: 'jpg', width: 1600, crop: 'limit', quality: 'auto', ...(page ? { page } : {}),
    });
    if (ext !== 'pdf') {
      const one = await fetchAs(pageUrl(), 'image/jpeg');
      return one ? [one] : [];
    }
    let total = 1;
    try {
      const info = await cloudinary.api.resource(publicId, { resource_type: 'image', pages: true });
      total = Math.max(1, Math.min(Number(info?.pages) || 1, 6));
    } catch {}
    const pages: ReviewPage[] = [];
    for (let p = 1; p <= total; p++) {
      const one = await fetchAs(pageUrl(p), 'image/jpeg');
      if (!one) break;
      pages.push(one);
    }
    return pages;
  }

  // raw (ör. eski PDF yüklemeleri): yalnızca web panelinde PDF olarak gösterilebilir
  if (imageOnly) return null;
  const signed = cloudinary.url(path, { resource_type: 'raw', type: 'upload', sign_url: true, secure: true });
  const one = await fetchAs(signed, ext === 'pdf' ? 'application/pdf' : 'application/octet-stream');
  return one ? [one] : [];
}
