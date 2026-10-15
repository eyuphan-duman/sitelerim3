'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowRight, Calendar, Tag, HelpCircle, Plus } from 'lucide-react';

import { LOCAL_FAQ } from '@/data/local-faq';

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

function FaqCard({ faq }: { faq: any }) {
  const date = faq.createdAt || faq.date
    ? format(new Date(faq.createdAt || faq.date), 'd MMMM yyyy', { locale: tr })
    : '';

  return (
    <Link href={`/sss/${faq.id}`} className="article-card group" style={{ textDecoration: 'none' }}>
      {faq.featuredImage && (
        <div className="article-card-image">
          <img
            src={faq.featuredImage}
            alt={faq.title}
            loading="lazy"
          />
        </div>
      )}

      <div className="article-card-body">
        <div className="article-card-meta">
          {faq.category && (
            <span className="article-card-category">
              <Tag size={11} />
              {faq.category}
            </span>
          )}
          {date && (
            <span className="article-card-date">
              <Calendar size={11} />
              {date}
            </span>
          )}
        </div>

        <h2 className="article-card-title">{faq.title}</h2>

        {faq.excerpt && (
          <p className="article-card-excerpt">{faq.excerpt}</p>
        )}

        <div className="article-card-btn">
          <HelpCircle size={16} />
          Cevabı Oku
          <ArrowRight size={16} className="article-card-btn-arrow" />
        </div>
      </div>
    </Link>
  );
}

export default function SssPage() {
  const { user } = useAuth();
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      let fbFaqs: any[] = [];
      try {
        const q = query(collection(db, 'faq'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        fbFaqs = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
          };
        });
      } catch (e) {
        console.error(e);
      }

      const combined = [...fbFaqs, ...LOCAL_FAQ].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
      });

      setFaqs(combined);
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <div className="yz-page">
      {/* ── HERO ── */}
      <header className="yz-hero">
        <div className="yz-hero-inner">
          <span className="yz-eyebrow">Psikoloji · Terapi Süreci · Sıkça Sorulanlar</span>
          <h1 className="yz-hero-title">
            Sıkça Sorulan Sorular
          </h1>
          <p className="yz-hero-sub">
            Psikolog aramaya başladığınızda aklınıza gelen soruların kısa, anlaşılır cevapları.
          </p>
          {isAdmin && (
            <Link href="/admin?tab=faq" className="yz-new-btn">
              <Plus size={18} /> Yeni Soru-Cevap Ekle
            </Link>
          )}
        </div>
      </header>

      {/* ── GRID ── */}
      <main className="yz-main">
        {loading ? (
          <div className="yz-loading">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="article-card-skeleton" />
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div className="yz-empty">
            <HelpCircle size={48} className="yz-empty-icon" />
            <p>Henüz bir soru-cevap eklenmemiş.</p>
          </div>
        ) : (
          <div className="yz-grid">
            {faqs.map(f => <FaqCard key={f.id} faq={f} />)}
          </div>
        )}
      </main>
    </div>
  );
}
