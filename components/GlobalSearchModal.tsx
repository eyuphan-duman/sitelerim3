'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/contexts/SearchContext';
import { Search, X, HelpCircle, BookOpen, Film, MessageCircle, User, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LOCAL_FAQ } from '@/data/local-faq';
import { LOCAL_ARTICLES } from '@/data/local-articles';

// Turkish character normalization for accent/diacritic-insensitive search
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

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export interface SearchResultItem {
  id: string;
  type: 'faq' | 'article' | 'video' | 'forum' | 'page' | 'profile';
  title: string;
  category?: string;
  excerpt: string;
  href: string;
  score: number;
}

export default function GlobalSearchModal() {
  const { isOpen, closeSearch } = useSearch();
  const router = useRouter();

  const [queryText, setQueryText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'faq' | 'article' | 'video' | 'forum'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Cached datasets
  const [firestoreFaqs, setFirestoreFaqs] = useState<any[]>([]);
  const [firestoreArticles, setFirestoreArticles] = useState<any[]>([]);
  const [firestoreVideos, setFirestoreVideos] = useState<any[]>([]);
  const [firestoreForum, setFirestoreForum] = useState<any[]>([]);
  const [firestoreUsers, setFirestoreUsers] = useState<any[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQueryText('');
      setActiveFilter('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Load Firestore data when modal is opened for the first time
  useEffect(() => {
    if (!isOpen || hasLoadedData) return;

    let isMounted = true;
    async function loadSearchData() {
      setLoading(true);
      try {
        const [faqSnap, articleSnap, videoSnap, forumSnap, usersSnap] = await Promise.allSettled([
          getDocs(query(collection(db, 'faq'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'reels'), orderBy('createdAt', 'desc'), limit(40))),
          getDocs(query(collection(db, 'forum'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'users'), limit(50))),
        ]);

        if (!isMounted) return;

        if (faqSnap.status === 'fulfilled') {
          setFirestoreFaqs(faqSnap.value.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        if (articleSnap.status === 'fulfilled') {
          setFirestoreArticles(articleSnap.value.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        if (videoSnap.status === 'fulfilled') {
          setFirestoreVideos(videoSnap.value.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        if (forumSnap.status === 'fulfilled') {
          setFirestoreForum(forumSnap.value.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        if (usersSnap.status === 'fulfilled') {
          setFirestoreUsers(usersSnap.value.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        setHasLoadedData(true);
      } catch (err) {
        console.error('Error loading search index:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSearchData();
    return () => { isMounted = false; };
  }, [isOpen, hasLoadedData]);

  // Static site pages
  const staticPages = useMemo(() => [
    {
      id: 'page-sss',
      type: 'page' as const,
      title: 'Sıkça Sorulan Sorular (SSS)',
      category: 'Bilgi Merkezi',
      excerpt: 'Psikoterapi süreci, psikolog seçimi, seans ücretleri ve terapi yöntemleri hakkında en çok merak edilenler.',
      href: '/sss',
    },
    {
      id: 'page-yazilarim',
      type: 'page' as const,
      title: 'Yazılarım',
      category: 'Klinik Yazılar',
      excerpt: 'Psikoloji, psikanaliz ve varoluşçuluk üzerine derinlemesine analizler ve klinik yazılar.',
      href: '/yazilarim',
    },
    {
      id: 'page-ben-kimim',
      type: 'page' as const,
      title: 'Hakkımda & Biyografi',
      category: 'Psikolog',
      excerpt: 'Psikolog Furkan Manav kimdir? Eğitim geçmişi, klinik çalışma alanları ve varoluşçu psikoterapi yaklaşımı.',
      href: '/ben-kimim',
    },
    {
      id: 'page-iletisim',
      type: 'page' as const,
      title: 'İletişim & Randevu',
      category: 'Randevu',
      excerpt: 'Yüz yüze (Ankara) veya Online psikoterapi seansı için randevu oluşturun ve iletişime geçin.',
      href: '/iletisim',
    },
    {
      id: 'page-videolarim',
      type: 'page' as const,
      title: 'Videolarım',
      category: 'Video',
      excerpt: 'İnsan psikolojisi, rüyalar, travma ve psikanalitik kavramlar üzerine eğitici video serileri.',
      href: '/videolarim',
    },
    {
      id: 'page-forum',
      type: 'page' as const,
      title: 'Psikoloji Forumu',
      category: 'Topluluk',
      excerpt: 'Sorularınızı paylaşabileceğiniz, deneyimlerinizi aktarabileceğiniz psikoloji tartışma platformu.',
      href: '/forum',
    },
  ], []);

  // Merge and deduplicate FAQs
  const allFaqs = useMemo(() => {
    const existingIds = new Set(firestoreFaqs.map(f => f.id));
    const existingTitles = new Set(firestoreFaqs.map(f => normalizeTurkish(f.title || '')));
    const uniqueLocal = LOCAL_FAQ.filter(
      l => !existingIds.has(l.id) && !existingTitles.has(normalizeTurkish(l.title || ''))
    );
    return [...firestoreFaqs, ...uniqueLocal];
  }, [firestoreFaqs]);

  // Merge and deduplicate Articles
  const allArticles = useMemo(() => {
    const existingIds = new Set(firestoreArticles.map(a => a.id));
    const existingTitles = new Set(firestoreArticles.map(a => normalizeTurkish(a.title || '')));
    const uniqueLocal = LOCAL_ARTICLES.filter(
      l => !existingIds.has(l.id) && !existingTitles.has(normalizeTurkish(l.title || ''))
    );
    return [...firestoreArticles, ...uniqueLocal];
  }, [firestoreArticles]);

  // Computed Search Results with relevance scoring
  const searchResults = useMemo(() => {
    const trimmed = queryText.trim();
    if (!trimmed) return [];

    const normalizedQuery = normalizeTurkish(trimmed);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    const list: SearchResultItem[] = [];

    // Helper to calculate match score
    const scoreText = (titleNorm: string, catNorm: string, contentNorm: string): number => {
      let score = 0;
      // Exact full match in title
      if (titleNorm.includes(normalizedQuery)) {
        score += 150;
      }
      if (titleNorm.startsWith(normalizedQuery)) {
        score += 50;
      }

      // Token matches
      let matchedTokens = 0;
      for (const t of tokens) {
        let tokenMatched = false;
        if (titleNorm.includes(t)) {
          score += 40;
          tokenMatched = true;
        }
        if (catNorm.includes(t)) {
          score += 25;
          tokenMatched = true;
        }
        if (contentNorm.includes(t)) {
          score += 15;
          tokenMatched = true;
        }
        if (tokenMatched) matchedTokens++;
      }

      // If multi-token query and not all tokens match somewhere, penalize
      if (tokens.length > 1 && matchedTokens < tokens.length) {
        return 0;
      }

      return score;
    };

    // 1. SSS (Soru - Cevap) Indexing
    allFaqs.forEach(faq => {
      const rawContent = stripHtml(faq.content || '');
      const excerpt = faq.excerpt || (rawContent.length > 160 ? rawContent.slice(0, 160) + '…' : rawContent);
      const titleNorm = normalizeTurkish(faq.title || '');
      const catNorm = normalizeTurkish(faq.category || '');
      const contentNorm = normalizeTurkish(rawContent);

      const score = scoreText(titleNorm, catNorm, contentNorm);
      if (score > 0) {
        list.push({
          id: `faq-${faq.id}`,
          type: 'faq',
          title: faq.title,
          category: faq.category || 'SSS',
          excerpt,
          href: `/sss/${faq.id}`,
          score: score + 10, // SSS bonus to surface direct answers prominently
        });
      }
    });

    // 2. Yazılarım (Articles) Indexing
    allArticles.forEach(art => {
      const rawContent = stripHtml(art.content || '');
      const excerpt = art.excerpt || (rawContent.length > 160 ? rawContent.slice(0, 160) + '…' : rawContent);
      const titleNorm = normalizeTurkish(art.title || '');
      const catNorm = normalizeTurkish(art.category || '');
      const contentNorm = normalizeTurkish(rawContent);

      const score = scoreText(titleNorm, catNorm, contentNorm);
      if (score > 0) {
        list.push({
          id: `art-${art.id}`,
          type: 'article',
          title: art.title,
          category: art.category || 'Yazı',
          excerpt,
          href: `/yazilarim/${art.id}`,
          score: score + 8,
        });
      }
    });

    // 3. Static Pages Indexing
    staticPages.forEach(p => {
      const titleNorm = normalizeTurkish(p.title);
      const catNorm = normalizeTurkish(p.category);
      const contentNorm = normalizeTurkish(p.excerpt);

      const score = scoreText(titleNorm, catNorm, contentNorm);
      if (score > 0) {
        list.push({
          id: p.id,
          type: 'page',
          title: p.title,
          category: p.category,
          excerpt: p.excerpt,
          href: p.href,
          score: score + 12,
        });
      }
    });

    // 4. Videolar Indexing
    firestoreVideos.forEach(vid => {
      const titleNorm = normalizeTurkish(vid.title || '');
      const catNorm = normalizeTurkish(vid.category || '');
      const contentNorm = normalizeTurkish(vid.desc || '');

      const score = scoreText(titleNorm, catNorm, contentNorm);
      if (score > 0) {
        list.push({
          id: `vid-${vid.id}`,
          type: 'video',
          title: vid.title,
          category: vid.category || 'Video',
          excerpt: vid.desc || 'Video içerik',
          href: `/videolarim?v=${vid.id}`,
          score,
        });
      }
    });

    // 5. Forum Indexing
    firestoreForum.forEach(f => {
      const rawBody = f.body || '';
      const title = f.authorName ? `${f.authorName} - Forum Gönderisi` : 'Forum Gönderisi';
      const titleNorm = normalizeTurkish(title);
      const catNorm = normalizeTurkish(f.category || '');
      const contentNorm = normalizeTurkish(rawBody);

      const score = scoreText(titleNorm, catNorm, contentNorm);
      if (score > 0) {
        list.push({
          id: `forum-${f.id}`,
          type: 'forum',
          title: f.title || title,
          category: f.category || 'Forum',
          excerpt: rawBody.slice(0, 140) + (rawBody.length > 140 ? '…' : ''),
          href: `/forum?thread=${f.id}`,
          score,
        });
      }
    });

    // 6. Users / Profiles Indexing
    firestoreUsers.forEach(u => {
      const title = u.displayName || u.username || 'Kullanıcı';
      const titleNorm = normalizeTurkish(title);
      const catNorm = normalizeTurkish(u.title || 'Üye');
      const contentNorm = normalizeTurkish(u.bio || '');

      const score = scoreText(titleNorm, catNorm, contentNorm);
      if (score > 0) {
        list.push({
          id: `user-${u.id}`,
          type: 'profile',
          title,
          category: u.title || (u.isPsychologist ? 'Onaylı Psikolog' : 'Üye'),
          excerpt: u.bio || `@${u.username || 'kullanici'}`,
          href: `/forum/profil/${encodeURIComponent(u.username || u.id)}`,
          score,
        });
      }
    });

    // Sort by score descending
    return list.sort((a, b) => b.score - a.score);
  }, [queryText, allFaqs, allArticles, staticPages, firestoreVideos, firestoreForum, firestoreUsers]);

  // Filtered by selected category pill
  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') return searchResults;
    if (activeFilter === 'faq') return searchResults.filter(r => r.type === 'faq');
    if (activeFilter === 'article') return searchResults.filter(r => r.type === 'article');
    if (activeFilter === 'video') return searchResults.filter(r => r.type === 'video');
    if (activeFilter === 'forum') return searchResults.filter(r => r.type === 'forum' || r.type === 'profile');
    return searchResults;
  }, [searchResults, activeFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    const c = { all: searchResults.length, faq: 0, article: 0, video: 0, forum: 0 };
    searchResults.forEach(r => {
      if (r.type === 'faq') c.faq++;
      else if (r.type === 'article') c.article++;
      else if (r.type === 'video') c.video++;
      else if (r.type === 'forum' || r.type === 'profile') c.forum++;
    });
    return c;
  }, [searchResults]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = filteredResults[selectedIndex];
      if (selectedItem) {
        closeSearch();
        router.push(selectedItem.href);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(10, 22, 40, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8vh 16px 24px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={closeSearch}
    >
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: 680,
          background: '#ffffff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '84vh',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* ── SEARCH INPUT HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <Search size={22} color="var(--navy)" style={{ flexShrink: 0, opacity: 0.8 }} />
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={e => {
              setQueryText(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="SSS, klinik yazılar, konular veya sorular ara..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1.08rem',
              color: '#0f172a',
              background: 'transparent',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
            }}
          />
          {loading && (
            <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: 'var(--navy)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          )}
          {queryText && (
            <button
              type="button"
              onClick={() => { setQueryText(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              title="Temizle"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Kapat (ESC)"
          >
            ESC
          </button>
        </div>

        {/* ── CATEGORY FILTER PILLS ── */}
        {queryText.trim() && searchResults.length > 0 && (
          <div style={{ display: 'flex', gap: 8, padding: '12px 22px', borderBottom: '1px solid #f1f5f9', background: '#ffffff', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <button
              onClick={() => { setActiveFilter('all'); setSelectedIndex(0); }}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: activeFilter === 'all' ? 'var(--navy)' : '#f1f5f9',
                color: activeFilter === 'all' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Tümü <span style={{ opacity: 0.75 }}>({counts.all})</span>
            </button>

            <button
              onClick={() => { setActiveFilter('faq'); setSelectedIndex(0); }}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: activeFilter === 'faq' ? '#0284c7' : '#f0f9ff',
                color: activeFilter === 'faq' ? '#ffffff' : '#0369a1',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <HelpCircle size={13} /> SSS <span style={{ opacity: 0.8 }}>({counts.faq})</span>
            </button>

            <button
              onClick={() => { setActiveFilter('article'); setSelectedIndex(0); }}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: activeFilter === 'article' ? '#854d0e' : '#fefce8',
                color: activeFilter === 'article' ? '#ffffff' : '#854d0e',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <BookOpen size={13} /> Yazılarım <span style={{ opacity: 0.8 }}>({counts.article})</span>
            </button>

            {counts.video > 0 && (
              <button
                onClick={() => { setActiveFilter('video'); setSelectedIndex(0); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeFilter === 'video' ? '#7c3aed' : '#f5f3ff',
                  color: activeFilter === 'video' ? '#ffffff' : '#7c3aed',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Film size={13} /> Videolar <span style={{ opacity: 0.8 }}>({counts.video})</span>
              </button>
            )}

            {counts.forum > 0 && (
              <button
                onClick={() => { setActiveFilter('forum'); setSelectedIndex(0); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeFilter === 'forum' ? '#059669' : '#ecfdf5',
                  color: activeFilter === 'forum' ? '#ffffff' : '#047857',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <MessageCircle size={13} /> Forum <span style={{ opacity: 0.8 }}>({counts.forum})</span>
              </button>
            )}
          </div>
        )}

        {/* ── RESULTS LIST ── */}
        <div style={{ overflowY: 'auto', flex: 1, maxHeight: 460 }}>
          {queryText.trim() && filteredResults.length > 0 && (
            <div style={{ padding: '8px 0' }}>
              {filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isFaq = item.type === 'faq';
                const isArticle = item.type === 'article';
                const isVideo = item.type === 'video';
                const isPage = item.type === 'page';
                const isProfile = item.type === 'profile';

                const icon = isFaq ? (
                  <HelpCircle size={18} color="#0284c7" />
                ) : isArticle ? (
                  <BookOpen size={18} color="#b45309" />
                ) : isVideo ? (
                  <Film size={18} color="#7c3aed" />
                ) : isPage ? (
                  <Sparkles size={18} color="#059669" />
                ) : isProfile ? (
                  <User size={18} color="#d97706" />
                ) : (
                  <MessageCircle size={18} color="#2563eb" />
                );

                const badgeBg = isFaq
                  ? '#e0f2fe'
                  : isArticle
                  ? '#fef3c7'
                  : isVideo
                  ? '#ede9fe'
                  : isPage
                  ? '#dcfce7'
                  : '#f1f5f9';

                const badgeColor = isFaq
                  ? '#0369a1'
                  : isArticle
                  ? '#b45309'
                  : isVideo
                  ? '#6d28d9'
                  : isPage
                  ? '#15803d'
                  : '#475569';

                const badgeLabel = isFaq ? 'SSS' : isArticle ? 'Yazı' : isVideo ? 'Video' : isPage ? 'Sayfa' : isProfile ? 'Profil' : 'Forum';

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={closeSearch}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '12px 22px',
                      textDecoration: 'none',
                      background: isSelected ? '#f8fafc' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--gold)' : '3px solid transparent',
                      transition: 'background 0.1s ease',
                      borderBottom: '1px solid #f8fafc',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: badgeBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: badgeBg,
                            color: badgeColor,
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {badgeLabel}
                        </span>
                        {item.category && item.category !== badgeLabel && (
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                            {item.category}
                          </span>
                        )}
                      </div>

                      <h4
                        style={{
                          margin: '0 0 4px',
                          fontSize: '0.96rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          lineHeight: 1.35,
                          fontFamily: isFaq ? 'Inter, sans-serif' : 'Playfair Display, serif',
                        }}
                      >
                        {item.title}
                      </h4>

                      {item.excerpt && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.82rem',
                            color: '#475569',
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {item.excerpt}
                        </p>
                      )}
                    </div>

                    <div style={{ alignSelf: 'center', color: isSelected ? 'var(--gold)' : '#cbd5e1', paddingLeft: 6, flexShrink: 0 }}>
                      <CornerDownLeft size={16} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* NO RESULTS FOUND */}
          {queryText.trim() && filteredResults.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
              <HelpCircle size={40} style={{ margin: '0 auto 14px', color: '#94a3b8' }} />
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: 6 }}>
                &quot;<em>{queryText}</em>&quot; ile eşleşen sonuç bulunamadı
              </p>
              <p style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.5 }}>
                Aramayı &quot;terapi süresi&quot;, &quot;kaygı&quot;, &quot;narsist&quot;, &quot;varoluş&quot; gibi farklı kelimelerle deneyebilir veya SSS bölümümüzü inceleyebilirsiniz.
              </p>
              <Link
                href="/sss"
                onClick={closeSearch}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  background: 'var(--navy)',
                  color: 'white',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Tüm Sıkça Sorulan Sorulara Git <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* DEFAULT / POPULAR SUGGESTIONS (WHEN INPUT IS EMPTY) */}
          {!queryText.trim() && (
            <div style={{ padding: '24px 22px' }}>
              {/* Popular SSS Topics Suggestions */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <HelpCircle size={15} color="var(--gold)" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>
                    Sıkça Aranan Sorular (SSS)
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    'Varoluşçu Psikoterapi Nedir?',
                    'Online Terapi Etkili mi?',
                    'Panik Atak ve Kaygı',
                    'Narsistik İlişkiler',
                    'Terapi Ne Kadar Sürer?',
                    'Mükemmeliyetçilik',
                    'Öfke Kontrolü'
                  ].map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setQueryText(topic.replace(/\?/g, ''))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = 'var(--gold)';
                        e.currentTarget.style.background = '#fefce8';
                        e.currentTarget.style.color = '#854d0e';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', display: 'block', marginBottom: 12 }}>
                  Bölümlere Göz Atın
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {[
                    { label: 'Sıkça Sorulan Sorular', href: '/sss', desc: '30+ Soru ve Klinik Cevap', icon: HelpCircle },
                    { label: 'Yazılarım', href: '/yazilarim', desc: 'Psikanaliz ve Denemeler', icon: BookOpen },
                    { label: 'Videolarım', href: '/videolarim', desc: 'Psikoloji Video Serileri', icon: Film },
                    { label: 'Psikoloji Forumu', href: '/forum', desc: 'Topluluk Tartışmaları', icon: MessageCircle },
                    { label: 'Hakkımda', href: '/ben-kimim', desc: 'Özgeçmiş & Çalışma Alanları', icon: User },
                    { label: 'İletişim & Randevu', href: '/iletisim', desc: 'Seans Bilgisi & İletişim', icon: ArrowRight },
                  ].map(item => {
                    const IconComp = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSearch}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 10,
                          textDecoration: 'none',
                          border: '1px solid #f1f5f9',
                          background: '#fafbfc',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#fafbfc';
                          e.currentTarget.style.borderColor = '#f1f5f9';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconComp size={16} color="var(--navy)" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER HINT ── */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span><strong style={{ color: '#0f172a' }}>↑↓</strong> Gezin</span>
            <span><strong style={{ color: '#0f172a' }}>Enter</strong> Seç</span>
            <span><strong style={{ color: '#0f172a' }}>ESC</strong> Kapat</span>
          </div>
          <span style={{ color: '#94a3b8' }}>
            SSS, Yazılar ve Tüm İçerik İndekslendi
          </span>
        </div>
      </div>
    </div>
  );
}
