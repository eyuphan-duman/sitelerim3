import { Metadata } from 'next';
import ProfilClient from './ProfilClient';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username);

  // Profil verisini SEO için önceden çekmeye çalışalım
  let displayName = username;
  try {
    const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      displayName = snap.docs[0].data().displayName || username;
    }
  } catch (e) {
    console.error("Metadata fetch error:", e);
  }

  return {
    title: `${displayName} (@${username})`,
    description: `${displayName} kullanıcısının Furkan Manav psikoloji forumu profili. Paylaşımları, yanıtları ve topluluk aktiviteleri.`,
    openGraph: {
      title: `${displayName} - Psikoloji Forumu`,
      description: `${displayName} kullanıcısının paylaşımları ve tartışmaları.`,
    }
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username);
  
  return <ProfilClient username={username} />;
}
