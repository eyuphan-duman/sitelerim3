import { LOCAL_FAQ } from '@/data/local-faq';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import FaqDetailClient from './FaqDetailClient';

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

async function getFaq(id: string) {
  const local = LOCAL_FAQ.find(a => a.id === id);
  if (local) return local;

  try {
    const docRef = doc(db, 'faq', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const serialized = JSON.parse(JSON.stringify(data, (key, value) => {
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
    console.error('Error fetching FAQ entry:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return {};

  const faq = await getFaq(id);
  if (!faq) return {};

  const description = faq.excerpt
    ? stripHtml(faq.excerpt).slice(0, 160)
    : stripHtml(faq.content).slice(0, 160);
  const url = `${SITE_URL}/sss/${id}`;
  const fullTitle = `${faq.title} | Psikolog Furkan Manav`;
  const image = faq.featuredImage || DEFAULT_IMAGE;

  return {
    title: fullTitle,
    description,
    keywords: faq.category ? [faq.category, 'psikolog', 'sıkça sorulan sorular', 'furkan manav'] : undefined,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: faq.title }],
      publishedTime: toIsoDate(faq.createdAt || faq.date),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export default async function FaqPage({ params }: { params: any }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) notFound();

  const faq = await getFaq(id);

  if (!faq) {
    notFound();
  }

  // Google expects the schema answer to match the full visible answer text, not a truncated snippet.
  const fullAnswerText = stripHtml(faq.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: faq.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: fullAnswerText,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FaqDetailClient id={id} initialFaq={faq} />
    </>
  );
}
