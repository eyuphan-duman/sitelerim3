import { NextResponse } from 'next/server';

export const revalidate = 3600; // 1 saat önbellek

function cleanShortTitle(raw: string): string {
  return raw
    .replace(/#[^\s#]+/g, '') // hashtag'leri kaldır
    .replace(/^[\s"“”'‘’]+|[\s"“”'‘’]+$/g, '') // baştaki ve sondaki tırnakları temizle
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  try {
    const res = await fetch('https://www.youtube.com/@pskfurkanmanav/shorts', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ shorts: [] }, { status: 200 });
    }

    const html = await res.text();
    const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!match) {
      return NextResponse.json({ shorts: [] }, { status: 200 });
    }

    const data = JSON.parse(match[1]);
    const shorts: { id: string; title: string; youtubeId: string }[] = [];
    const seen = new Set<string>();

    function walk(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.shortsLockupViewModel) {
        const vm = obj.shortsLockupViewModel;
        const vid = vm?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
        const rawTitle =
          vm?.overlayMetadata?.primaryText?.content ||
          vm?.accessibilityText?.split(',')[0] ||
          '';
        if (vid && !seen.has(vid)) {
          seen.add(vid);
          shorts.push({
            id: vid,
            title: cleanShortTitle(rawTitle) || 'Psikoloji Notu',
            youtubeId: vid,
          });
        }
      }
      if (obj.reelItemRenderer) {
        const r = obj.reelItemRenderer;
        const vid = r.videoId;
        const rawTitle = r.headline?.simpleText || r.headline?.runs?.[0]?.text || '';
        if (vid && !seen.has(vid)) {
          seen.add(vid);
          shorts.push({
            id: vid,
            title: cleanShortTitle(rawTitle) || 'Psikoloji Notu',
            youtubeId: vid,
          });
        }
      }
      for (const k of Object.keys(obj)) {
        walk(obj[k]);
      }
    }

    walk(data);
    return NextResponse.json({ shorts }, { status: 200 });
  } catch {
    return NextResponse.json({ shorts: [] }, { status: 200 });
  }
}
