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
