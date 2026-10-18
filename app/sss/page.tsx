'use client';

import { ADMIN_PATH } from '@/lib/adminPath';
import { jsonLdString } from '@/lib/sanitizeServer';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowRight, Calendar, Tag, HelpCircle, Plus, Search, X, Sparkles, Filter } from 'lucide-react';

import { LOCAL_FAQ } from '@/data/local-faq';

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

function normalizeTurkish(text: string): string {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

      const existingIds = new Set(fbFaqs.map(f => f.id));
      const existingTitles = new Set(fbFaqs.map(f => f.title?.trim().toLowerCase()));
      const uniqueLocal = LOCAL_FAQ.filter(
        l => !existingIds.has(l.id) && !existingTitles.has(l.title?.trim().toLowerCase())
      );

      const combined = [...fbFaqs, ...uniqueLocal].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
      });

      setFaqs(combined);
      setLoading(false);
    }
    fetch();
  }, []);

  const stripHtml = (html: string) =>
    (html || '').replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach(f => {
      if (f.category && f.category.trim()) {
        set.add(f.category.trim());
      }
    });
    return Array.from(set);
  }, [faqs]);

  // Filtered list with Turkish-aware multi-token search
  const filteredFaqs = useMemo(() => {
    let result = faqs;

    if (selectedCategory !== 'all') {
      result = result.filter(f => (f.category || '').trim() === selectedCategory);
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) return result;

    const queryNorm = normalizeTurkish(trimmed);
    const tokens = queryNorm.split(/\s+/).filter(Boolean);

    return result.filter(f => {
      const titleNorm = normalizeTurkish(f.title || '');
      const catNorm = normalizeTurkish(f.category || '');
      const excerptNorm = normalizeTurkish(f.excerpt || '');
      const contentNorm = normalizeTurkish(stripHtml(f.content || ''));

      return tokens.every(t =>
        titleNorm.includes(t) || catNorm.includes(t) || excerptNorm.includes(t) || contentNorm.includes(t)
      );
    });
  }, [faqs, searchQuery, selectedCategory]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtml(f.excerpt || f.content).slice(0, 300),
      },
    })),
  };

  return (
    <div className="yz-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
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

          {/* ── INLINE SSS SEARCH BAR ── */}
          <div style={{ maxWidth: 580, margin: '28px auto 0', width: '100%' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(201, 169, 110, 0.35)',
                borderRadius: 16,
                padding: '4px 8px 4px 18px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.25s ease',
              }}
            >
              <Search size={20} color="var(--gold)" style={{ flexShrink: 0, marginRight: 10 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="SSS içinde soru, kelime veya konu ara..."
                aria-label="SSS içinde ara"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.96rem',
                  padding: '12px 0',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Aramayı temizle"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255, 255, 255, 0.6)',
                    padding: 8,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categories.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    transition: 'all 0.2s',
                    background: selectedCategory === 'all' ? 'var(--gold)' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedCategory === 'all' ? 'var(--navy)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: selectedCategory === 'all' ? 'var(--gold)' : 'rgba(201, 169, 110, 0.2)',
                  }}
                >
                  Tümü ({faqs.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      transition: 'all 0.2s',
                      background: selectedCategory === cat ? 'var(--gold)' : 'rgba(255, 255, 255, 0.05)',
                      color: selectedCategory === cat ? 'var(--navy)' : 'rgba(255, 255, 255, 0.8)',
                      borderColor: selectedCategory === cat ? 'var(--gold)' : 'rgba(201, 169, 110, 0.2)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAdmin && (
            <div style={{ marginTop: 24 }}>
              <Link href={`${ADMIN_PATH}?tab=faq`} className="yz-new-btn">
                <Plus size={18} /> Yeni Soru-Cevap Ekle
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── GRID ── */}
      <main className="yz-main">
        {/* Results summary if searching */}
        {(searchQuery.trim() || selectedCategory !== 'all') && !loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(201, 169, 110, 0.15)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.88rem',
            }}
          >
            <span>
              {searchQuery.trim() ? (
                <>
                  "<strong>{searchQuery}</strong>" araması için{' '}
                  <strong style={{ color: 'var(--gold)' }}>{filteredFaqs.length}</strong> sonuç bulundu
                </>
              ) : (
                <>
                  <strong style={{ color: 'var(--gold)' }}>{filteredFaqs.length}</strong> soru listeleniyor
                </>
              )}
            </span>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                }}
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="yz-loading">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="article-card-skeleton" />
            ))}
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="yz-empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <HelpCircle size={48} className="yz-empty-icon" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: 8, color: '#fff' }}>Aramanızla Eşleşen Soru Bulunamadı</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 440, margin: '0 auto 20px', fontSize: '0.92rem' }}>
              Farklı anahtar kelimeler deneyebilir veya filtreyi temizleyerek tüm soruları görüntüleyebilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="btn-gold"
              style={{ fontSize: '0.85rem', padding: '10px 20px' }}
            >
              Tüm Soruları Göster
            </button>
          </div>
        ) : (
          <div className="yz-grid">
            {filteredFaqs.map(f => <FaqCard key={f.id} faq={f} />)}
          </div>
        )}
      </main>
    </div>
  );
}
