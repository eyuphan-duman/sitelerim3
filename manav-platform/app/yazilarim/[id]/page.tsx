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
  const serializedData = JSON.parse(JSON.stringify(data, (key, value) => {
    if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
      return new Date(value.seconds * 1000).toISOString();
    }
    return value;
  }));

  return {
    id: docSnap.id,
    ...serializedData,
    createdAt: serializedData.createdAt || null
  };
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  
  if (!article) {
    notFound();
  }
  
  return <ArticleDetailClient initialArticle={article} id={params.id} />;
}
