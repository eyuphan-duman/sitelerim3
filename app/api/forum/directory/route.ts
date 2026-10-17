import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Forumun ortak verisi: üyelerin herkese açık alanları + son gönderiler.
 * Sunucuda önbelleğe alınır; Firestore ziyaretçi sayısından bağımsız olarak
 * en fazla 2 dakikada bir okunur (ücretsiz planın okuma sınırını korur).
 */
export const dynamic = 'force-static';
export const revalidate = 120;

const PUBLIC_USER_FIELDS = [
  'username', 'displayName', 'photoURL', 'coverURL', 'bio', 'title', 'location', 'website',
  'isPsychologist', 'psychologistStatus', 'role', 'hideBadge',
  'isBanned', 'isFrozen', 'isDeleted', 'isPrivate', 'hideLikes', 'hideReplies',
] as const;

const toMs = (v: any) => (v?.toMillis ? v.toMillis() : typeof v === 'number' ? v : null);

export async function GET() {
  const db = adminDb();
  if (!db) return NextResponse.json({ users: [], posts: [], at: Date.now(), configured: false });

  const [usersSnap, postsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('forum').orderBy('createdAt', 'desc').limit(200).get(),
  ]);

  const users = usersSnap.docs.map(d => {
    const data = d.data();
    const out: Record<string, any> = { uid: d.id };
    for (const f of PUBLIC_USER_FIELDS) if (data[f] !== undefined) out[f] = data[f];
    out.createdAt = toMs(data.createdAt);
    return out;
  });

  const posts = postsSnap.docs.map(d => {
    const data = d.data();
    return { ...data, id: d.id, createdAt: toMs(data.createdAt), originalCreatedAt: toMs(data.originalCreatedAt) };
  });

  return NextResponse.json({ users, posts, at: Date.now(), configured: true });
}
