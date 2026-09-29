'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowRight, Calendar, Tag, BookOpen, Plus } from 'lucide-react';

import { LOCAL_ARTICLES } from '@/data/local-articles';

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

function ArticleCard({ article }: { article: any }) {
  const date = article.createdAt
    ? format(new Date(article.createdAt), 'd MMMM yyyy', { locale: tr })
    : '';

  return (
    <Link href={`/yazilarim/${article.id}`} className="article-card group" style={{ textDecoration: 'none' }}>
      {/* Cover Image */}
      {article.featuredImage && (
        <div className="article-card-image">
          <img
            src={article.featuredImage}
            alt={article.title}
            loading="lazy"
          />
        </div>
      )}

      {/* Body */}
      <div className="article-card-body">
        <div className="article-card-meta">
          {article.category && (
            <span className="article-card-category">
              <Tag size={11} />
              {article.category}
            </span>
          )}
          {date && (
            <span className="article-card-date">
              <Calendar size={11} />
              {date}
            </span>
          )}
        </div>

        <h2 className="article-card-title">{article.title}</h2>

        {article.excerpt && (
          <p className="article-card-excerpt">{article.excerpt}</p>
        )}

        <div className="article-card-btn">
          <BookOpen size={16} />
          Makaleyi Oku
          <ArrowRight size={16} className="article-card-btn-arrow" />
        </div>
      </div>
    </Link>
  );
}

export default function YazilarimPage() {
  const { user } = useAuth();
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const fbArticles = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
          };
        });

        // Merge local articles and sort by createdAt
        const combined = [...fbArticles, ...LOCAL_ARTICLES].sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setArticles(combined);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <div className="yz-page">
      {/* ── HERO ── */}
      <header className="yz-hero">
        <div className="yz-hero-inner">
          <span className="yz-eyebrow">Psikoloji · Psikanaliz · Varoluş</span>
          <h1 className="yz-hero-title">
            Yazılarım
          </h1>
          <p className="yz-hero-sub">
            İnsan ruhunun derinliklerine dair makaleler, analizler ve düşünceler.
          </p>
          {isAdmin && (
            <Link href="/admin?tab=posts" className="yz-new-btn">
              <Plus size={18} /> Yeni Makale Yayımla
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
        ) : articles.length === 0 ? (
          <div className="yz-empty">
            <BookOpen size={48} className="yz-empty-icon" />
            <p>Henüz yayımlanmış bir makale bulunmuyor.</p>
          </div>
        ) : (
          <div className="yz-grid">
            {articles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </main>
    </div>
  );
}
