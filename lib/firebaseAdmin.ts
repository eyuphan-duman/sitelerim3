import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Sunucu tarafı Firebase Admin. Kimlik bilgisi FIREBASE_SERVICE_ACCOUNT ortam değişkeninden
 * (servis hesabı JSON'u, düz ya da base64) okunur. Tanımlı değilse null döner.
 */
let app: App | null = null;

function loadCredentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const sa = JSON.parse(json);
    if (sa.private_key) sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
    return sa;
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT okunamadı (JSON ya da base64 olmalı).');
    return null;
  }
}

export function getAdminApp(): App | null {
  if (app) return app;
  if (getApps().length) { app = getApps()[0]; return app; }
  const sa = loadCredentials();
  if (!sa) return null;
  app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
  return app;
}

export function adminDb() {
  const a = getAdminApp();
  return a ? getFirestore(a) : null;
}

/** Kullanıcı adından e-postayı sunucuda çözer (gizli koleksiyon; geçiş süresince eski alan yedek) */
export async function emailForUsername(username: string): Promise<string | null> {
  const db = adminDb();
  if (!db) throw new Error('admin-not-configured');
  const snap = await db.collection('users').where('username', '==', username).limit(1).get();
  if (snap.empty) return null;
  const uid = snap.docs[0].id;
  const priv = await db.collection('private_users').doc(uid).get();
  return (priv.exists && priv.data()?.email) || snap.docs[0].data().email || null;
}
