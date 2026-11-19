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
import { ArrowUpRight, HelpCircle, Plus, Search, X } from 'lucide-react';

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

export default function SssPage() {
  const { user } = useAuth();
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchFaqs() {
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
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
      });

      setFaqs(combined);
      setLoading(false);
    }
    fetchFaqs();
  }, []);

  const stripHtml = (html: string) =>
    (html || '').replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach(f => {
      if (f.category && f.category.trim()) {
        set.add(f.category.trim());
      }
    });
    return Array.from(set);
  }, [faqs]);

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
    <div className="ed-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />

      {/* ── ÜST KAPAK (MASTHEAD) ── */}
      <header className="ed-hero">
        <div className="hx-grain" aria-hidden="true" />
        <div className="hm-wrap">
          <div className="ed-hero-bar">
            <span className="ed-hero-eyebrow">Psikoloji · Terapi Süreci · Sıkça Sorulanlar</span>
            <span className="ed-hero-rule" aria-hidden="true" />
            <span className="ed-hero-place">{faqs.length ? `${faqs.length} Soru` : ''}</span>
          </div>

          <div className="ed-hero-grid">
            <div>
              <h1 className="ed-hero-title">Sıkça Sorulan Sorular</h1>
              <p className="ed-hero-sub">
                Psikoterapi sürecine, seans çerçevesine ve psikanalitik yaklaşıma dair merak edilen temel soruların açık yanıtları.
              </p>
            </div>

            <div className="ed-filter-box">
              <div className="ed-search-input-wrap">
                <Search size={16} strokeWidth={1.6} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="SSS içinde soru, kelime veya konu ara..."
                  aria-label="SSS içinde ara"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Aramayı temizle"
                    className="ed-search-clear"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {isAdmin && (
                <Link href={`${ADMIN_PATH}?tab=faq`} className="hx-btn" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} />
                  <span>Yeni Soru-Cevap Ekle</span>
                </Link>
              )}
            </div>
          </div>

          {categories.length > 0 && (
            <div className="ed-cat-strip" role="tablist" aria-label="Soru kategorileri">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`ed-cat-btn ${selectedCategory === 'all' ? 'is-active' : ''}`}
              >
                Tümü ({faqs.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`ed-cat-btn ${selectedCategory === cat ? 'is-active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── SORULAR IZGARASI (1480px 3 SÜTUN) ── */}
      <main className="hm-wrap ed-body">
        {(searchQuery.trim() || selectedCategory !== 'all') && !loading && (
          <div className="ed-filter-status">
            <span>
              {searchQuery.trim() ? (
                <>
                  “<strong>{searchQuery}</strong>” araması için{' '}
                  <strong>{filteredFaqs.length}</strong> sonuç bulundu
                </>
              ) : (
                <>
                  Toplam <strong>{filteredFaqs.length}</strong> soru listeleniyor
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Filtreyi Temizle <X size={13} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="ed-articles-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="article-card-skeleton" />
            ))}
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="yz-empty">
            <HelpCircle size={42} className="yz-empty-icon" />
            <p>
              {searchQuery.trim() || selectedCategory !== 'all'
                ? 'Aradığınız kriterlere uygun bir soru bulunamadı.'
                : 'Henüz yayımlanmış bir soru-cevap bulunmuyor.'}
            </p>
          </div>
        ) : (
          <div className="ed-articles-grid">
            {filteredFaqs.map((faq, idx) => {
              const rawDate = faq.createdAt || faq.date;
              let formattedDate = '';
              if (rawDate) {
                try {
                  formattedDate = format(new Date(rawDate), 'd MMMM yyyy', { locale: tr });
                } catch {}
              }
              const excerpt = faq.excerpt || stripHtml(faq.content || '').slice(0, 185);

              return (
                <Link href={`/sss/${faq.id}`} key={faq.id} className="hm-article-card ed-grid-card">
                  {faq.featuredImage ? (
                    <div className="hm-article-media">
                      <img
                        src={faq.featuredImage}
                        alt={faq.title}
                        loading="lazy"
                        className="hm-article-img"
                      />
                      <div className="hm-article-img-shade" aria-hidden="true" />
                    </div>
                  ) : (
                    <div className="ed-faq-band">
                      <span>{faq.category || 'Terapi Süreci'}</span>
                    </div>
                  )}

                  <div className="hm-article-body">
                    <div className="hm-article-meta">
                      <span className="hm-article-cat">{faq.category || 'Terapi & Danışmanlık'}</span>
                      {formattedDate && <time className="hm-article-date">{formattedDate}</time>}
                    </div>

                    <h2 className="hm-article-heading">{faq.title}</h2>

                    {excerpt && (
                      <p className="hm-article-excerpt">{excerpt}</p>
                    )}

                    <div className="hm-article-foot">
                      <span>Yanıtı İncele</span>
                      <ArrowUpRight size={16} strokeWidth={1.6} className="hm-article-arrow" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
