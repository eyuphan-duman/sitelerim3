import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebaseAdmin';

/** Sunucu yapılandırma durumu (gizli değer döndürmez) */
export const dynamic = 'force-dynamic';

export async function GET() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  let reason = 'ok';
  if (!raw) reason = 'missing';
  else {
    try {
      const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw.trim(), 'base64').toString('utf8');
      JSON.parse(json);
    } catch { reason = 'unreadable'; }
  }
  let configured = false;
  try { configured = Boolean(getAdminApp()); } catch { reason = reason === 'ok' ? 'init-failed' : reason; }
  return NextResponse.json({ configured, reason, env: process.env.VERCEL_ENV || 'local' });
}
