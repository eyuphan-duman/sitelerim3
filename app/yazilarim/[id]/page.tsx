import { cleanHtml, jsonLdString } from '@/lib/sanitizeServer';
import { LOCAL_ARTICLES } from '@/data/local-articles';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ArticleDetailClient from './ArticleDetailClient';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://pskfurkanmanav.com';
const DEFAULT_IMAGE = `${SITE_URL}/pskfurkanmanav.jpeg`;

function stripHtml(html: string) {
  return (html || '').replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function toIsoDate(value: any): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function getArticle(id: string) {
  // First check local articles
  const localArticle = LOCAL_ARTICLES.find(a => a.id === id);
  if (localArticle) return localArticle;

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
      content: cleanHtml(serialized.content),
      createdAt: serialized.createdAt || null
    };
  } catch (err) {
    console.error("Error fetching article:", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return {};

  const article = await getArticle(id);
  if (!article) return {};

  const description = article.excerpt
    ? stripHtml(article.excerpt).slice(0, 160)
    : stripHtml(article.content).slice(0, 160);
  const image = article.featuredImage || DEFAULT_IMAGE;
  const url = `${SITE_URL}/yazilarim/${id}`;

  const fullTitle = `${article.title} | Psikolog Furkan Manav`;

  return {
    title: fullTitle,
    description,
    keywords: article.category ? [article.category, 'psikolog', 'psikoterapi', 'furkan manav'] : undefined,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
      publishedTime: toIsoDate(article.createdAt || article.date),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [image],
    },
  };
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

  const url = `${SITE_URL}/yazilarim/${id}`;
  const description = article.excerpt
    ? stripHtml(article.excerpt).slice(0, 300)
    : stripHtml(article.content).slice(0, 300);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description,
    image: article.featuredImage || DEFAULT_IMAGE,
    datePublished: toIsoDate(article.createdAt || article.date),
    dateModified: toIsoDate(article.updatedAt || article.createdAt || article.date),
    articleSection: article.category || undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@id': `${SITE_URL}/#person` },
    publisher: { '@id': `${SITE_URL}/#person` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <ArticleDetailClient id={id} initialArticle={article} />
    </>
  );
}
