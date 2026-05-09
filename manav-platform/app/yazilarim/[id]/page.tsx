import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import ArticleDetailClient from './ArticleDetailClient';

export const dynamic = 'force-dynamic';

async function getArticle(id: string) {
  try {
    const docRef = doc(db, 'articles', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    
    // Safely serialize Firestore data for Client Components
    const serialized = JSON.parse(JSON.stringify(data, (key, value) => {
      // Handle Firestore Timestamps
      if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
        return new Date(value.seconds * 1000).toISOString();
      }
      return value;
    }));

    return {
      id: docSnap.id,
      ...serialized,
      createdAt: serialized.createdAt || null
    };
  } catch (err) {
    console.error("Error fetching article:", err);
    return null;
  }
}

export default async function ArticlePage({ params }: { params: any }) {
  // In Next.js 15 params is a promise, in 13/14 it's an object. 
  // Accessing it safely:
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) notFound();

  const article = await getArticle(id);
  
  if (!article) {
    notFound();
  }
  
  return <ArticleDetailClient id={id} initialArticle={article} />;
}
