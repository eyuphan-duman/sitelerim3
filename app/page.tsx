'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Quote, Search, Heart, X, FileText, MessageCircle, User, Film, Play, ChevronLeft, ChevronRight, BookOpen, ShieldCheck, Users, CheckCircle2, Sparkles, Mail, GraduationCap, Compass, Shield, Clock, Award } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, getDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useSearch } from '@/contexts/SearchContext';
import toast from 'react-hot-toast';
import { LOCAL_ARTICLES } from '@/data/local-articles';
import { QUOTES } from '@/data/quotes';
import { DEFAULT_HERO_SETTINGS, HeroSettings } from '@/lib/heroSettings';
import { DEFAULT_ABOUT_SETTINGS, AboutSettings } from '@/lib/aboutSettings';

const YOUTUBE_SHORTS = [
  { id: 'qrttUFp0eEg', title: "DUYU HASSASİYETİ", youtubeId: 'qrttUFp0eEg' },
  { id: 'O7tneYILgkQ', title: "KAPALI HAVANIN PSİKOLOJİMİZE ETKİSİ", youtubeId: 'O7tneYILgkQ' },
  { id: '6fmxBmSzsDM', title: "TERAPİNİN ESAS BELİRLEYİCİSİ", youtubeId: '6fmxBmSzsDM' },
  { id: 'ABmIev4nIkg', title: "MİTOMANİ", youtubeId: 'ABmIev4nIkg' },
  { id: 'h6QcOFJXhEk', title: "İYİLEŞMEK, YÜZLEŞMENİN YAN ETKİSİDİR.", youtubeId: 'h6QcOFJXhEk' },
  { id: 'MqNcDuOdAN4', title: "PSİKANALİZ VE TEDAVİ?", youtubeId: 'MqNcDuOdAN4' },
  { id: 'mwlGa5M92hQ', title: "SINIRDA BAĞLANMA", youtubeId: 'mwlGa5M92hQ' },
  { id: 'AIDZ4MFxPhQ', title: "İLK BAŞKA", youtubeId: 'AIDZ4MFxPhQ' },
  { id: '3f2Z7V_uaH8', title: "DUYGUSAL YEME", youtubeId: '3f2Z7V_uaH8' },
  { id: '4PL2GaHwm5E', title: "KAYGI ÖZGÜRLÜĞÜN BAŞ DÖNMESİDİR.", youtubeId: '4PL2GaHwm5E' },
  { id: 'AutXH_X1_bQ', title: "YAPAY ZEKADAN TERAPİST OLUR MU?", youtubeId: 'AutXH_X1_bQ' },
  { id: '0IOo2TBCFIo', title: "TRAVMASIZ ÇOCUKLUK MÜMKÜN MÜ?", youtubeId: '0IOo2TBCFIo' },
  { id: '0ZGO5Z6kMWM', title: "MANİPULASYON", youtubeId: '0ZGO5Z6kMWM' },
  { id: 'N7NxQbUArsM', title: "PASİF AGRESİF", youtubeId: 'N7NxQbUArsM' },
  { id: '6iWdKTNOWJU', title: "AKTARIM", youtubeId: '6iWdKTNOWJU' },
  { id: 'kEDKyzGEWt4', title: "İLİŞKİ DÖNGÜSÜ", youtubeId: 'kEDKyzGEWt4' },
  { id: '-Z1pEXOcyt8', title: "AŞIRI İSTEMEK", youtubeId: '-Z1pEXOcyt8' },
  { id: 'k4Vvc95RO-o', title: "İNSANI BASTIRDIKLARI YÖNETİR", youtubeId: 'k4Vvc95RO-o' },
  { id: 'Y5GIkYguVv8', title: "NASIL MUTLU OLURUZ ?", youtubeId: 'Y5GIkYguVv8' },
  { id: '0rFsbd7v3Do', title: "OVERTHİNKİNG", youtubeId: '0rFsbd7v3Do' },
  { id: 'GXtl4K1_ARM', title: "SERBEST ÇAĞRIŞIM", youtubeId: 'GXtl4K1_ARM' },
  { id: 'ylLFvU5j9Kk', title: "HAYATIN BİR ANLAMI VAR MIDIR ?", youtubeId: 'ylLFvU5j9Kk' },
  { id: 'Y8in1KIUceg', title: "BİLİNÇ DIŞI", youtubeId: 'Y8in1KIUceg' },
  { id: '5RqlJYyZB_E', title: "PARADOKSAL NİYET", youtubeId: '5RqlJYyZB_E' }
];

const stripHtml = (html: string) => {
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

const truncateText = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  const sub = text.slice(0, limit);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace === -1) return sub + '...';
  return sub.slice(0, lastSpace) + '...';
};

export default function HomePage() {
  const { user } = useAuth();
  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];
  const { openSearch } = useSearch();
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const articlesCarouselRef = useRef<HTMLDivElement>(null);
  const [dailyQuote, setDailyQuote] = useState(QUOTES[0]);
  const [randomVideos, setRandomVideos] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);

  // Kapak içeriği ve bölüm geçişi (yönetim panelinden düzenlenir)
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const heroTouchStartX = useRef(0);

  useEffect(() => {
    async function loadHeroSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'hero'));
        if (snap.exists()) {
          const data = snap.data();
          setHeroSettings(prev => ({
            ...prev,
            ...data,
            slide1: { ...prev.slide1, ...(data.slide1 || {}) },
            slide2: { ...prev.slide2, ...(data.slide2 || {}) },
          }));
        }
      } catch (err) {
        console.warn('Hero settings fetch notice:', err);
      }
    }
    loadHeroSettings();
  }, []);

  // About Section settings state
  const [aboutSettings, setAboutSettings] = useState<AboutSettings>(DEFAULT_ABOUT_SETTINGS);

  useEffect(() => {
    async function loadAboutSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'about'));
        if (snap.exists()) {
          setAboutSettings(prev => ({
            ...prev,
            ...snap.data(),
          }));
        }
      } catch (err) {
        console.warn('About settings fetch notice:', err);
      }
    }
    loadAboutSettings();
  }, []);

  useEffect(() => {
    if (!heroSettings.autoSlide || isHeroHovered) return;
    const intervalSec = Number(heroSettings.slideInterval) > 0 ? Number(heroSettings.slideInterval) : 15;
    const totalMs = intervalSec * 1000;
    const stepMs = 100;

    const timer = setInterval(() => {
      setSlideProgress(prev => {
        if (prev >= 100) {
          setCurrentSlide(curr => (curr === 0 ? 1 : 0));
          return 0;
        }
        return prev + (stepMs / totalMs) * 100;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [heroSettings.autoSlide, heroSettings.slideInterval, currentSlide, isHeroHovered]);

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
    setSlideProgress(0);
  };

  const scrollArticles = (direction: 'left' | 'right') => {
    if (articlesCarouselRef.current) {
      const firstCard = articlesCarouselRef.current.firstElementChild as HTMLElement | null;
      const scrollAmount = firstCard ? firstCard.offsetWidth + 28 : articlesCarouselRef.current.clientWidth * 0.35;
      articlesCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Varsayılan olarak en son yüklenen 4 videoyu göster, ardından kanaldan canlı listeyi senkronize et
    setRandomVideos(YOUTUBE_SHORTS.slice(0, 4));
    fetch('/api/youtube-shorts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data?.shorts) && data.shorts.length >= 4) {
          setRandomVideos(data.shorts.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const getDailyQuote = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const day = Math.floor(diff / oneDay);
      return QUOTES[day % QUOTES.length];
    };

    setDailyQuote(getDailyQuote());

    const interval = setInterval(() => {
      setDailyQuote(getDailyQuote());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getDocs(query(collection(db, 'forum'), orderBy('createdAt', 'desc'), limit(15)))
      .then(async snap => {
        const posts = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(p => !p.isRepost && p.body)
          .slice(0, 3);
        // Psikolog rozeti ve güncel fotoğraf yazarın profilinden gelir
        const authors = await Promise.all(
          [...new Set(posts.map(p => p.uid).filter(Boolean))].map(uid => getDoc(doc(db, 'users', uid)).catch(() => null))
        );
        const byUid: Record<string, any> = {};
        authors.forEach(a => { if (a?.exists()) byUid[a.id] = a.data(); });
        setForumPosts(posts
          .filter(p => { const u = byUid[p.uid]; return !(u?.isBanned || u?.isFrozen || u?.isDeleted || u?.isPrivate); })
          .map(p => {
            const u = byUid[p.uid] || {};
            const psych = !u.hideBadge && Boolean(p.authorIsPsychologist || (u.isPsychologist && (u.psychologistStatus === 'approved' || !u.psychologistStatus)) || u.role === 'psychologist');
            return { ...p, authorPhotoURL: u.photoURL || p.authorPhotoURL, authorIsPsychologist: psych };
          }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const snap = await getDocs(query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(15)));
        const fbArticles = snap.docs.map(d => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null) };
        });

        const combined = [...fbArticles, ...LOCAL_ARTICLES]
          .sort((a: any, b: any) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime())
          .slice(0, 8);

        setLatestArticles(combined);
      } catch (e) {
        console.error("Error fetching latest articles:", e);
      }
    }
    fetchLatest();
  }, []);







  return (
    <>
      {/* ══════════════════ KAPAK ══════════════════ */}
      <section
        className="hx"
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        onTouchStart={(e) => { heroTouchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = heroTouchStartX.current - e.changedTouches[0].clientX;
          if (diff > 50) goToSlide(1);
          else if (diff < -50) goToSlide(0);
        }}
      >
        {currentSlide === 1 && heroSettings.slide2.bgImage && (
          <div className="hx-bg-media" aria-hidden="true">
            <Image
              src={heroSettings.slide2.bgImage}
              alt=""
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        )}
        <div className="hx-grain" aria-hidden="true" />

        <div className="hx-inner">
          {/* Üst editoryal künye */}
          <div className="hx-masthead hx-rise" style={{ '--d': '0ms' } as React.CSSProperties}>
            <span className="hx-masthead-eyebrow">
              {currentSlide === 0 ? heroSettings.slide1.eyebrow : heroSettings.slide2.eyebrow}
            </span>
            <span className="hx-masthead-rule" aria-hidden="true" />
            <button
              type="button"
              onClick={openSearch}
              className="hx-search-trigger"
              aria-label="Site içinde ara"
            >
              <Search size={13} strokeWidth={1.6} />
              <span>{heroSettings.slide1.searchPlaceholder || 'Yazılar ve forumda ara...'}</span>
            </button>
            <span className="hx-masthead-place">Çankaya · Polatlı · Online</span>
          </div>

          {/* Ana içerik: Bölüm I (Psikoterapi & Yazılar) / Bölüm II (Logos Forum) */}
          {currentSlide === 0 ? (
            <div key="chapter-1" className="hx-grid hx-chapter">
              <div className="hx-copy">
                <h1 className="hx-title hx-rise" style={{ '--d': '80ms' } as React.CSSProperties}>
                  <span>{heroSettings.slide1.titlePart1}</span>
                  <span>
                    {heroSettings.slide1.titlePart2} {heroSettings.slide1.titlePart3}
                  </span>
                </h1>

                <p className="hx-lede hx-rise" style={{ '--d': '180ms' } as React.CSSProperties}>
                  {heroSettings.slide1.description}
                </p>

                <div className="hx-actions hx-rise" style={{ '--d': '280ms' } as React.CSSProperties}>
                  <Link href={heroSettings.slide1.primaryBtnLink || '/forum'} className="hx-btn">
                    <span>{heroSettings.slide1.primaryBtnText}</span>
                    <ArrowRight size={16} strokeWidth={1.6} />
                  </Link>
                  <Link href={heroSettings.slide1.secondaryBtnLink || '/iletisim'} className="hx-link">
                    {heroSettings.slide1.secondaryBtnText}
                  </Link>
                </div>
              </div>

              <figure className="hx-portrait">
                <div className="hx-photo">
                  <Image
                    src={heroSettings.slide1.bgImage || '/hero-bg.jpg'}
                    alt="Psikolog Furkan Manav"
                    fill
                    priority
                    quality={90}
                    sizes="(max-width: 960px) 100vw, 420px"
                    style={{ objectFit: 'cover', objectPosition: 'center 16%' }}
                  />
                  <div className="hx-photo-tone" aria-hidden="true" />
                </div>
                <figcaption className="hx-rise" style={{ '--d': '420ms' } as React.CSSProperties}>
                  <span>Furkan Manav</span>
                  <span>Psikolog · Ankara</span>
                </figcaption>
              </figure>
            </div>
          ) : (
            <div key="chapter-2" className="hx-grid hx-chapter">
              <div className="hx-copy">
                <h1 className="hx-title hx-rise" style={{ '--d': '80ms' } as React.CSSProperties}>
                  <span>{heroSettings.slide2.titlePart1}</span>
                  <span>
                    {heroSettings.slide2.titlePart2} {heroSettings.slide2.titlePart3}
                  </span>
                </h1>

                <p className="hx-lede hx-rise" style={{ '--d': '180ms' } as React.CSSProperties}>
                  {heroSettings.slide2.description}
                </p>

                <div className="hx-actions hx-rise" style={{ '--d': '280ms' } as React.CSSProperties}>
                  <Link href={heroSettings.slide2.primaryBtnLink || '/forum'} className="hx-btn">
                    <span>{heroSettings.slide2.primaryBtnText || 'Foruma Katıl'}</span>
                    <ArrowRight size={16} strokeWidth={1.6} />
                  </Link>
                  <Link href={heroSettings.slide2.secondaryBtnLink || '/forum'} className="hx-link">
                    {heroSettings.slide2.secondaryBtnText || 'Tartışmaları İncele'}
                  </Link>
                </div>
              </div>

              <aside className="hx-dossier hx-rise" style={{ '--d': '220ms' } as React.CSSProperties} aria-label="Logos Forum İlkeleri">
                <div className="hx-dossier-head">
                  <span>Logos — Psikoloji Forumu</span>
                  <span>I — III</span>
                </div>
                <ol className="hx-dossier-list">
                  {[
                    { no: 'I', title: heroSettings.slide2.highlight1Title, desc: heroSettings.slide2.highlight1Desc },
                    { no: 'II', title: heroSettings.slide2.highlight2Title, desc: heroSettings.slide2.highlight2Desc },
                    { no: 'III', title: heroSettings.slide2.highlight3Title, desc: heroSettings.slide2.highlight3Desc },
                  ].map((row) => (
                    <li key={row.no} className="hx-dossier-row">
                      <span className="hx-dossier-no">{row.no}.</span>
                      <div>
                        <h2 className="hx-dossier-title">{row.title}</h2>
                        <p className="hx-dossier-desc">{row.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link href={heroSettings.slide2.primaryBtnLink || '/forum'} className="hx-dossier-foot">
                  <span>Tartışmalara göz atın veya sorunuzu paylaşın</span>
                  <ArrowUpRight size={16} strokeWidth={1.5} />
                </Link>
              </aside>
            </div>
          )}

          {/* Alt editoryal fihrist & bölüm seçici */}
          <div className="hx-ledger hx-rise" style={{ '--d': '460ms' } as React.CSSProperties}>
            <div className="hx-chapters" role="tablist" aria-label="Kapak bölümleri">
              <button
                type="button"
                role="tab"
                aria-selected={currentSlide === 0}
                onClick={() => goToSlide(0)}
                className={`hx-chapter-tab ${currentSlide === 0 ? 'is-active' : ''}`}
              >
                <span
                  className="hx-chapter-bar"
                  style={{
                    transform: `scaleX(${currentSlide === 0 ? (heroSettings.autoSlide ? Math.max(0.08, slideProgress / 100) : 1) : 0})`,
                  }}
                />
                <span className="hx-chapter-no">01</span>
                <span className="hx-chapter-text">
                  <span className="hx-chapter-label">Psikoterapi & Yazılar</span>
                  <span className="hx-chapter-sub">Varoluşçu-psikanalitik yaklaşım ve denemeler</span>
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={currentSlide === 1}
                onClick={() => goToSlide(1)}
                className={`hx-chapter-tab ${currentSlide === 1 ? 'is-active' : ''}`}
              >
                <span
                  className="hx-chapter-bar"
                  style={{
                    transform: `scaleX(${currentSlide === 1 ? (heroSettings.autoSlide ? Math.max(0.08, slideProgress / 100) : 1) : 0})`,
                  }}
                />
                <span className="hx-chapter-no">02</span>
                <span className="hx-chapter-text">
                  <span className="hx-chapter-label">Logos Psikoloji Forumu</span>
                  <span className="hx-chapter-sub">Uzmanlar ve toplulukla açık düşünme alanı</span>
                </span>
              </button>
            </div>

            <nav className="hx-quicklinks" aria-label="Bölümler">
              <Link href="/yazilarim" className="hx-quicklink">
                <span>Yazılarım</span>
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </Link>
              <Link href="/forum" className="hx-quicklink">
                <span>Logos Forum</span>
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </Link>
              <Link href="/iletisim" className="hx-quicklink">
                <span>Seans & İletişim</span>
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </Link>
            </nav>
          </div>
        </div>
      </section>

      {/* ══════════════════ I — HAKKIMDA & YAKLAŞIM ══════════════════ */}
      <section className="hm-section hm-about">
        <div className="hm-wrap">
          <div className="hm-sec-bar">
            <span className="hm-sec-label">{aboutSettings.eyebrow || 'Hakkımda'}</span>
            <span className="hm-sec-rule" aria-hidden="true" />
            <span className="hm-sec-meta">Varoluşçu · Psikanalitik yönelim</span>
          </div>

          <div className="hm-about-grid">
            {/* Sol Sütun: Portre Levhası & Çalışma Alanları */}
            <div className="hm-about-left">
              <figure className="hm-about-figure">
                <div className="hm-about-img-box">
                  <img
                    src={aboutSettings.image || '/pskfurkanmanav.jpeg'}
                    alt={aboutSettings.name || 'Psikolog Furkan Manav'}
                  />
                </div>
                <figcaption className="hm-about-caption">
                  <span>{aboutSettings.name || 'Psikolog Furkan Manav'}</span>
                  <span>Çankaya · Polatlı · Online</span>
                </figcaption>
              </figure>
            </div>

            {/* Sağ Sütun: Monografi & Yaklaşım Metni */}
            <div className="hm-about-right">
              {aboutSettings.name && (
                <h2 className="hm-about-name">{aboutSettings.name}</h2>
              )}
              {aboutSettings.title && (
                <p className="hm-about-role">{aboutSettings.title}</p>
              )}

              <div className="hm-about-paragraphs">
                {aboutSettings.paragraph1 && <p>{aboutSettings.paragraph1}</p>}
                {aboutSettings.paragraph2 && <p>{aboutSettings.paragraph2}</p>}
              </div>

              {aboutSettings.quote && (
                <blockquote className="hm-about-quote">
                  <p>“{aboutSettings.quote.replace(/^["“”']+|["“”']+$/g, '')}”</p>
                </blockquote>
              )}

              <div className="hm-about-pillars">
                <div className="hm-pillar-item">
                  <span className="hm-pillar-no">01</span>
                  <div>
                    <strong>Varoluşçu Sorgulama</strong>
                    <span>Kaygı, özgürlük, anlam arayışı ve yaşam sorumluluğu üzerine derinlikli çalışma.</span>
                  </div>
                </div>
                <div className="hm-pillar-item">
                  <span className="hm-pillar-no">02</span>
                  <div>
                    <strong>Psikanalitik Dinleme</strong>
                    <span>Bilinçdışı süreçler, tekrarlayan ilişki örüntüleri, rüyalar ve aktarım dinamikleri.</span>
                  </div>
                </div>
              </div>

              <div className="hm-about-actions">
                {aboutSettings.primaryBtnText && (
                  <Link href={aboutSettings.primaryBtnLink || '/ben-kimim'} className="hm-btn-dark">
                    <span>{aboutSettings.primaryBtnText}</span>
                    <ArrowRight size={15} strokeWidth={1.6} />
                  </Link>
                )}
                {aboutSettings.secondaryBtnText && (
                  <Link href={aboutSettings.secondaryBtnLink || '/iletisim'} className="hm-btn-outline">
                    <span>{aboutSettings.secondaryBtnText}</span>
                    <ArrowUpRight size={15} strokeWidth={1.6} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ II — SON YAZILARIM (EDİTORYAL SEÇKİ) ══════════════════ */}
      {latestArticles.length > 0 && (
        <section className="hm-section hm-articles">
          <div className="hm-wrap">
            <div className="hm-sec-bar">
              <span className="hm-sec-label">Güncel İçerikler</span>
              <span className="hm-sec-rule" aria-hidden="true" />
              <span className="hm-sec-meta">{latestArticles.length} makale</span>
            </div>

            <div className="hm-header-row">
              <div>
                <h2 className="hm-sec-title">Son Yazılarım</h2>
                <p className="hm-sec-sub">
                  Psikanaliz, varoluşçuluk, insan ilişkileri ve bilinçdışının gündelik hayattaki izleri üzerine incelemeler.
                </p>
              </div>

              <div className="hm-articles-controls">
                <div className="hm-arrow-group">
                  <button
                    type="button"
                    onClick={() => scrollArticles('left')}
                    className="hm-arrow-btn"
                    title="Önceki"
                    aria-label="Önceki yazılar"
                  >
                    <ChevronLeft size={18} strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollArticles('right')}
                    className="hm-arrow-btn"
                    title="Sonraki"
                    aria-label="Sonraki yazılar"
                  >
                    <ChevronRight size={18} strokeWidth={1.6} />
                  </button>
                </div>
                <Link href="/yazilarim" className="hm-all-link">
                  <span>Tüm Arşivi İncele</span>
                  <ArrowUpRight size={15} strokeWidth={1.6} />
                </Link>
              </div>
            </div>

            <div
              ref={articlesCarouselRef}
              className="hm-articles-track"
            >
              {latestArticles.map((a, idx) => {
                const articleDate = a.createdAt || a.date;
                let formattedDate = '';
                if (articleDate) {
                  try {
                    formattedDate = format(new Date(articleDate), 'd MMMM yyyy', { locale: tr });
                  } catch {}
                }

                const cardExcerpt = a.excerpt || (a.content ? truncateText(stripHtml(a.content), 175) : '');
                const issueNo = String(idx + 1).padStart(2, '0');

                return (
                  <Link href={`/yazilarim/${a.id}`} key={a.id} className="hm-article-card">
                    {/* Görsel veya Editoryal Monografi Kapağı */}
                    <div className="hm-article-media">
                      {a.featuredImage ? (
                        <>
                          <img
                            src={a.featuredImage}
                            alt={a.title}
                            className="hm-article-img"
                          />
                          <div className="hm-article-img-shade" aria-hidden="true" />
                          <span className="hm-article-badge-no">№ {issueNo}</span>
                        </>
                      ) : (
                        <div className="hm-monograph-cover">
                          <div className="hm-monograph-frame">
                            <div className="hm-monograph-top">
                              <span>PSİKANALİTİK DEFTER</span>
                              <span>№ {issueNo}</span>
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

                    {/* Kart İçeriği */}
                    <div className="hm-article-body">
                      <div className="hm-article-meta">
                        <span className="hm-article-cat">{a.category || 'Psikoloji & Psikanaliz'}</span>
                        {formattedDate && <time className="hm-article-date">{formattedDate}</time>}
                      </div>

                      <h3 className="hm-article-heading">{a.title}</h3>

                      {cardExcerpt && (
                        <p className="hm-article-excerpt">{cardExcerpt}</p>
                      )}

                      <div className="hm-article-foot">
                        <span>Makaleyi Oku</span>
                        <ArrowUpRight size={16} strokeWidth={1.6} className="hm-article-arrow" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ III — ÖNE ÇIKAN VİDEOLARIM ══════════════════ */}
      {randomVideos.length > 0 && (
        <section className="hm-section hm-videos">
          <div className="hm-wrap">
            <div className="hm-sec-bar">
              <span className="hm-sec-label">Video Paylaşımları</span>
              <span className="hm-sec-rule" aria-hidden="true" />
              <span className="hm-sec-meta">Kısa Kayıtlar</span>
            </div>

            <div className="hm-header-row">
              <div>
                <h2 className="hm-sec-title" style={{ marginBottom: 0 }}>Öne Çıkan Videolarım</h2>
              </div>
              <Link href="/videolarim" className="hm-all-link">
                <span>Tüm Videoları Gör</span>
                <ArrowUpRight size={15} strokeWidth={1.6} />
              </Link>
            </div>

            <div className="hm-videos-grid">
              {randomVideos.map((video) => {
                const coverUrl = `/video-covers/${video.youtubeId}.jpg`;
                const fallbackUrl = `https://i.ytimg.com/vi/${video.youtubeId}/oar2.jpg`;
                return (
                  <Link
                    href={`/videolarim?id=${video.id}`}
                    key={video.id}
                    className="hm-video-card"
                    aria-label={video.title}
                  >
                    <div className="hm-video-frame is-custom-cover">
                      <img
                        src={coverUrl}
                        alt={video.title}
                        loading="lazy"
                        onError={(e) => {
                          if (e.currentTarget.src !== fallbackUrl) {
                            e.currentTarget.src = fallbackUrl;
                          }
                        }}
                        className="hm-video-cover-img"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ IV — LOGOS PSİKOLOJİ FORUMU ══════════════════ */}
      <section className="hm-section hm-forum">
        <div className="hm-wrap">
          <div className="hm-sec-bar">
            <span className="hm-sec-label">Logos · Psikoloji Forumu</span>
            <span className="hm-sec-rule" aria-hidden="true" />
            <span className="hm-sec-meta">Topluluk & Tartışma</span>
          </div>

          <div className="hm-forum-layout">
            {/* Sol: Editoryal Forum Tanıtımı */}
            <div className="hm-forum-intro">
              <h2 className="hm-sec-title">Logos’ta Konuşulanlar</h2>
              <p className="hm-forum-lead">
                Psikolojiye, ilişkilere ve iç dünyanıza dair merak ettiğiniz soruları foruma taşıyın. Onaylı psikologların yanıtları altın rozetle işaretlenir; dilerseniz profilinizle dilerseniz anonim olarak paylaşım yapabilirsiniz.
              </p>

              <ul className="hm-forum-features">
                <li>
                  <span>I.</span>
                  <span>Altın rozetli onaylı psikologlar ve topluluk yanıtları</span>
                </li>
                <li>
                  <span>II.</span>
                  <span>İsimsiz (anonim) soru sorma ve gizlilik kontrolü</span>
                </li>
                <li>
                  <span>III.</span>
                  <span>Rüyalar, bağlanma, varoluş ve psikanaliz başlıkları</span>
                </li>
              </ul>

              <div className="hm-forum-actions">
                <Link href="/forum" className="hm-btn-dark">
                  <span>Logos Forum’a Git</span>
                  <ArrowRight size={15} strokeWidth={1.6} />
                </Link>
                <Link href="/forum?compose=open" className="hm-btn-outline">
                  <span>Yeni Soru Sor</span>
                  <ArrowUpRight size={15} strokeWidth={1.6} />
                </Link>
              </div>
            </div>

            {/* Sağ: Son Tartışmalar & Soru Kartı */}
            <div className="hm-forum-cards">
              {forumPosts.length > 0 ? (
                <>
                  {forumPosts.map((p, idx) => {
                    const likes = Object.values(p.reactionsData || {}).filter((v: any) => v === 'like' || v === 'heart').length;
                    const date = p.createdAt?.toDate ? p.createdAt.toDate() : null;
                    return (
                      <Link key={p.id} href={`/forum?thread=${p.id}`} className="hm-forum-card">
                        <div className="hm-forum-card-top">
                          <div className="hm-forum-author">
                            <span className="hm-forum-avatar">
                              {p.authorPhotoURL ? (
                                <img src={p.authorPhotoURL} alt="" />
                              ) : (
                                (p.authorName || '?')[0].toLocaleUpperCase('tr-TR')
                              )}
                            </span>
                            <div>
                              <strong className="hm-forum-name">
                                {p.authorName || 'Üye'}
                                {p.authorIsPsychologist && (
                                  <CheckCircle2 size={14} color="#2b547e" aria-label="Psikolog" />
                                )}
                              </strong>
                              <small className="hm-forum-sub">
                                {p.category || 'Genel'}
                                {date ? ` · ${format(date, 'd MMMM', { locale: tr })}` : ''}
                              </small>
                            </div>
                          </div>
                          <span className="hm-forum-no">Tartışma {String(idx + 1).padStart(2, '0')}</span>
                        </div>

                        <p className="hm-forum-body">{p.body}</p>

                        <div className="hm-forum-foot">
                          <div className="hm-forum-stats">
                            <span><MessageCircle size={14} /> {p.commentCount || 0} yanıt</span>
                            <span><Heart size={14} /> {likes} beğeni</span>
                          </div>
                          <span className="hm-forum-read">
                            Tartışmaya Katıl <ArrowUpRight size={14} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  <Link href="/forum?compose=open" className="hm-forum-card hm-forum-invite">
                    <div className="hm-forum-invite-top">
                      <span>YENİ TARTIŞMA BAŞLAT</span>
                      <MessageCircle size={18} strokeWidth={1.5} />
                    </div>
                    <h3>Aklınızdaki soruyu topluluğa ve uzmanlara yöneltin</h3>
                    <p>
                      Kaygı, ilişkiler, rüyalar ya da bir kavram hakkında merak ettiğinizi paylaşın; birlikte düşünelim.
                    </p>
                    <span className="hm-forum-invite-cta">
                      <span>Şimdi Gönderi Oluştur</span>
                      <ArrowRight size={15} strokeWidth={1.6} />
                    </span>
                  </Link>
                </>
              ) : (
                <Link href="/forum?compose=open" className="hm-forum-card hm-forum-invite">
                  <div className="hm-forum-invite-top">
                    <span>LOGOS PSİKOLOJİ FORUMU</span>
                    <MessageCircle size={18} strokeWidth={1.5} />
                  </div>
                  <h3>Logos’ta yeni bir tartışma başlatın</h3>
                  <p>
                    Kaygı, ilişkiler, rüyalar ya da bir kavram hakkında merak ettiğinizi yazın; psikologlar ve topluluk yanıtlasın.
                  </p>
                  <span className="hm-forum-invite-cta">
                    <span>Foruma Katıl & Soru Sor</span>
                    <ArrowRight size={15} strokeWidth={1.6} />
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ V — GÜNÜN EPİGRAFI ══════════════════ */}
      <section className="hm-epigraph">
        <div className="hm-wrap">
          <div className="hm-epigraph-inner">
            <div className="hm-epigraph-meta">
              <span>Günün Sözü</span>
              <span>Psikanaliz & Varoluş</span>
            </div>
            <blockquote className="hm-epigraph-quote">
              “{dailyQuote.text}”
            </blockquote>
            <div className="hm-epigraph-foot">
              <span className="hm-epigraph-author">— {dailyQuote.author}</span>
              <Link href="/iletisim" className="hm-epigraph-cta">
                <span>Randevu & Görüşme Talebi</span>
                <ArrowUpRight size={15} strokeWidth={1.6} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
