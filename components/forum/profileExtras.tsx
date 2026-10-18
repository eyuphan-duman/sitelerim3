'use client';

import React from 'react';

/** Profildeki özgeçmiş alanları (users/{uid}): hepsi isteğe bağlıdır, üyelikte istenmez */
export type Education = {
  school: string;
  department?: string;
  degree?: string;
  startYear?: number | string | null; // düzenlerken metin, kayıtta sayı
  endYear?: number | string | null; // boşsa "devam ediyor"
  gpa?: string;
  gpaScale?: '4' | '100';
};
export type Certificate = { name: string; issuer?: string; year?: number | string | null; url?: string };
export type Socials = { instagram?: string; x?: string; tiktok?: string; youtube?: string };

export const DEGREES = ['Önlisans', 'Lisans', 'Yüksek lisans', 'Doktora', 'Diğer'];
export const SOCIALS: { key: keyof Socials; label: string; prefix: string }[] = [
  { key: 'instagram', label: 'Instagram', prefix: 'instagram.com/' },
  { key: 'x', label: 'X', prefix: 'x.com/' },
  { key: 'tiktok', label: 'TikTok', prefix: 'tiktok.com/@' },
  { key: 'youtube', label: 'YouTube', prefix: 'youtube.com/@' },
];

/** Kullanıcı ister adresi ister @adı yapıştırsın, yalnızca güvenli kullanıcı adı saklanır */
export function cleanHandle(raw: string): string {
  let v = (raw || '').trim();
  v = v.replace(/^https?:\/\//i, '').replace(/^(www\.|m\.)/i, '');
  v = v.replace(/^(instagram\.com|x\.com|twitter\.com|tiktok\.com|youtube\.com)\//i, '');
  v = v.replace(/^@/, '').split(/[/?#]/)[0].replace(/^@/, '');
  return v.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40);
}

export function socialUrl(key: keyof Socials, handle: string): string {
  const h = encodeURIComponent(cleanHandle(handle));
  if (key === 'instagram') return `https://www.instagram.com/${h}`;
  if (key === 'x') return `https://x.com/${h}`;
  if (key === 'tiktok') return `https://www.tiktok.com/@${h}`;
  return `https://www.youtube.com/@${h}`;
}

/** Yalnızca http(s) bağlantılarına izin verilir (javascript: vb. engellenir) */
export function safeUrl(raw?: string): string | null {
  const v = (raw || '').trim();
  if (!v) return null;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProto);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export function formatGpa(e: Education): string | null {
  if (!e.gpa) return null;
  const n = e.gpa.replace(',', '.');
  return e.gpaScale === '100' ? `Ortalama ${n.replace('.', ',')}/100` : `Ortalama ${n.replace('.', ',')}/4,00`;
}

export function yearsOf(e: Education): string {
  if (!e.startYear && !e.endYear) return '';
  if (e.startYear && !e.endYear) return `${e.startYear} – devam ediyor`;
  if (!e.startYear) return String(e.endYear);
  return `${e.startYear} – ${e.endYear}`;
}

/** Marka simgeleri (lucide'de yok) */
export function BrandIcon({ name, size = 18 }: { name: keyof Socials; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  if (name === 'instagram') {
    return (
      <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === 'x') {
    return <svg {...p} fill="currentColor"><path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" /></svg>;
  }
  if (name === 'tiktok') {
    return <svg {...p} fill="currentColor"><path d="M16.6 3c.3 2.2 1.6 3.7 3.9 3.9v3.1c-1.4.1-2.7-.3-3.9-1.1v6.3c0 3.2-2.4 5.8-5.7 5.8a5.6 5.6 0 0 1-5.6-5.7c0-3.4 2.9-5.9 6.3-5.6v3.2c-1.5-.3-3 .7-3.1 2.3-.1 1.5 1 2.7 2.5 2.7 1.6 0 2.6-1.1 2.6-2.8V3h3Z" /></svg>;
  }
  return (
    <svg {...p} fill="currentColor"><path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" /></svg>
  );
}
