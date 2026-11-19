'use client';

import { ADMIN_PATH } from '@/lib/adminPath';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowUpRight, BookOpen, Plus, Search, X } from 'lucide-react';

import { LOCAL_ARTICLES } from '@/data/local-articles';
import { getArticleCoverImage } from '@/lib/articleCovers';

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

const stripHtml = (html: string) =>
  (html || '').replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const truncateText = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  const sub = text.slice(0, limit);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace === -1 ? sub : sub.slice(0, lastSpace)) + '...';
};

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

export default function YazilarimPage() {
  const { user } = useAuth();
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchArticles() {
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

        const combined = [...fbArticles, ...LOCAL_ARTICLES].sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.date || 0).getTime();
          const dateB = new Date(b.createdAt || b.date || 0).getTime();
          return dateB - dateA;
        });

        setArticles(combined);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => {
      if (a.category && a.category.trim()) {
        set.add(a.category.trim());
      }
    });
    return Array.from(set);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedCategory !== 'all') {
      result = result.filter(a => (a.category || '').trim() === selectedCategory);
    }
    const trimmed = searchQuery.trim();
    if (!trimmed) return result;

    const queryNorm = normalizeTurkish(trimmed);
    const tokens = queryNorm.split(/\s+/).filter(Boolean);

    return result.filter(a => {
      const titleNorm = normalizeTurkish(a.title || '');
      const catNorm = normalizeTurkish(a.category || '');
      const excerptNorm = normalizeTurkish(a.excerpt || '');
      const contentNorm = normalizeTurkish(stripHtml(a.content || ''));
      return tokens.every(t =>
        titleNorm.includes(t) || catNorm.includes(t) || excerptNorm.includes(t) || contentNorm.includes(t)
      );
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <div className="ed-page">
      {/* ── ÜST KAPAK (MASTHEAD) ── */}
      <header className="ed-hero">
        <div className="hx-grain" aria-hidden="true" />
        <div className="hm-wrap">
          <div className="ed-hero-bar">
            <span className="ed-hero-eyebrow">Psikoloji · Psikanaliz · Varoluş</span>
            <span className="ed-hero-rule" aria-hidden="true" />
            <span className="ed-hero-place">{articles.length ? `${articles.length} Yazı` : ''}</span>
          </div>

          <div className="ed-hero-grid">
            <div>
              <h1 className="ed-hero-title">Yazılarım</h1>
              <p className="ed-hero-sub">
                Bilinçdışı süreçler, varoluşsal kaygılar, insan ilişkileri ve psikanalitik kuram üzerine derinlemesine incelemeler.
              </p>
            </div>

            <div className="ed-filter-box">
              <div className="ed-search-input-wrap">
                <Search size={16} strokeWidth={1.6} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Yazılarda kavram, başlık veya konu ara..."
                  aria-label="Yazılarda ara"
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
                <Link href={`${ADMIN_PATH}?tab=posts`} className="hx-btn" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} />
                  <span>Yeni Yazı Yayımla</span>
                </Link>
              )}
            </div>
          </div>

          {categories.length > 0 && (
            <div className="ed-cat-strip" role="tablist" aria-label="Yazı kategorileri">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`ed-cat-btn ${selectedCategory === 'all' ? 'is-active' : ''}`}
              >
                Tümü ({articles.length})
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

      {/* ── MAKALELER IZGARASI (1480px 3 SÜTUN) ── */}
      <main className="hm-wrap ed-body">
        {(searchQuery.trim() || selectedCategory !== 'all') && !loading && (
          <div className="ed-filter-status">
            <span>
              Toplam <strong>{filteredArticles.length}</strong> yazı listeleniyor
              {searchQuery.trim() ? ` (“${searchQuery}”)` : ''}
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
        ) : filteredArticles.length === 0 ? (
          <div className="yz-empty">
            <BookOpen size={42} className="yz-empty-icon" />
            <p>Aradığınız kriterlere uygun bir yazı bulunamadı.</p>
          </div>
        ) : (
          <div className="ed-articles-grid">
            {filteredArticles.map((a, idx) => {
              const articleDate = a.createdAt || a.date;
              let formattedDate = '';
              if (articleDate) {
                try {
                  formattedDate = format(new Date(articleDate), 'd MMMM yyyy', { locale: tr });
                } catch {}
              }
              const cardExcerpt = a.excerpt || (a.content ? truncateText(stripHtml(a.content), 185) : '');
              const coverImage = getArticleCoverImage(a);

              return (
                <Link href={`/yazilarim/${a.id}`} key={a.id} className="hm-article-card ed-grid-card">
                  <div className="hm-article-media">
                    {coverImage ? (
                      <>
                        <img
                          src={coverImage}
                          alt={a.title}
                          loading="lazy"
                          className="hm-article-img"
                        />
                        <div className="hm-article-img-shade" aria-hidden="true" />
                      </>
                    ) : (
                      <div className="hm-monograph-cover">
                        <div className="hm-monograph-frame">
                          <div className="hm-monograph-top">
                            <span>PSİKANALİTİK DEFTER</span>
                          </div>
                          <div className="hm-monograph-center">
                            <span className="hm-monograph-ornament" aria-hidden="true">§</span>
                            <p className="hm-monograph-title">{a.title}</p>
                          </div>
                          <div className="hm-monograph-bottom">
                            <span>Furkan Manav</span>
                            <span>{a.category || 'Deneme'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hm-article-body">
                    <div className="hm-article-meta">
                      <span className="hm-article-cat">{a.category || 'Psikoloji & Psikanaliz'}</span>
                      {formattedDate && <time className="hm-article-date">{formattedDate}</time>}
                    </div>

                    <h2 className="hm-article-heading">{a.title}</h2>

                    {cardExcerpt && (
                      <p className="hm-article-excerpt">{cardExcerpt}</p>
                    )}

                    <div className="hm-article-foot">
                      <span>Yazıyı Oku</span>
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
