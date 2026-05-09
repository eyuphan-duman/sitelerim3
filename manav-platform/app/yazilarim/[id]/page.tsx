import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import ArticleDetailClient from './ArticleDetailClient';

export const dynamic = 'force-dynamic';

async function getArticle(id: string) {
  const docRef = doc(db, 'articles', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // Convert Firestore Timestamp to string or plain object to pass to client component safely
    createdAt: data.createdAt?.toDate()?.toISOString() || null
  };
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  
  if (!article) {
    notFound();
  }
  
  return <ArticleDetailClient initialArticle={article} id={params.id} />;
}
