'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Quote, Search, Heart, X, FileText, MessageCircle, User, Film, Play, ChevronLeft, ChevronRight, BookOpen, ShieldCheck, Users, CheckCircle2, Sparkles, Mail, GraduationCap, Compass, Shield, Clock, Award } from 'lucide-react';
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

  // Hero Slider states
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
    const intervalSec = Number(heroSettings.slideInterval) > 0 ? Number(heroSettings.slideInterval) : 10;
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
      const scrollAmount = articlesCarouselRef.current.clientWidth * 0.75;
      articlesCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Shuffle and pick 4 random videos on client mount to avoid hydration mismatch
    const shuffled = [...YOUTUBE_SHORTS].sort(() => 0.5 - Math.random());
    setRandomVideos(shuffled.slice(0, 4));
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







  const stats = [
    { n: '8+', label: 'Yıllık Deneyim' },
    { n: '100+', label: 'Yayınlanmış İçerik' },
    { n: '2', label: 'Ankara & Online' },
    { n: '4', label: 'Psikanalitik Çalışmalar' },
  ];

  return (
    <>
      {/* ══════════════════ HERO CAROUSEL ══════════════════ */}
      <section
        className="hero-slider-section"
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        onTouchStart={(e) => { heroTouchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = heroTouchStartX.current - e.changedTouches[0].clientX;
          if (diff > 50) goToSlide(1);
          else if (diff < -50) goToSlide(0);
        }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          minHeight: '100vh',
          background: '#070e1b',
        }}
      >
        <style>{`
          @media (max-width: 1024px) {
            .hero-forum-grid {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
            }
          }
        `}</style>

        {/* 2-Slide Track */}
        <div
          style={{
            display: 'flex',
            width: '200%',
            transform: `translateX(-${currentSlide * 50}%)`,
            transition: 'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)',
            minHeight: '100vh',
          }}
        >
          {/* ────── SLIDE 1: ANA KAPAK & PSİKOLOG ────── */}
          <div
            style={{
              width: '50%',
              flex: '0 0 50%',
              position: 'relative',
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              paddingTop: 120,
              paddingBottom: 90,
              boxSizing: 'border-box',
            }}
          >
            {/* Background image */}
            <Image
              src={heroSettings.slide1.bgImage || '/hero-bg.jpg'}
              alt="Psikolog Furkan Manav"
              fill
              priority
              quality={90}
              sizes="100vw"
              className="hero-image"
              style={{ objectFit: 'cover', objectPosition: 'top center' }}
            />
            <div className="hero-overlay" />
            <div className="hero-grain" />

            <div className="container-main" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
              <div style={{ maxWidth: 680 }}>
                {/* Eyebrow (Desktop) */}
                <div className="eyebrow fade-up fade-up-1" style={{ marginBottom: 28 }}>
                  {heroSettings.slide1.eyebrow}
                </div>

                {/* Main title */}
                <h1 className="display-title fade-up fade-up-2" style={{ fontSize: 'clamp(2.8rem,6.5vw,5.5rem)', marginBottom: 28 }}>
                  {heroSettings.slide1.titlePart1}
                  <br />
                  <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{heroSettings.slide1.titlePart2}</em> {heroSettings.slide1.titlePart3}
                </h1>

                {/* Sub */}
                <p className="crimson fade-up fade-up-3" style={{ color: 'rgba(255,255,255,0.76)', fontSize: 'clamp(1rem, 4vw, 1.22rem)', maxWidth: 540, marginBottom: 44, lineHeight: 1.7, overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'auto', WebkitHyphens: 'auto' }}>
                  {heroSettings.slide1.description}
                </p>

                {/* CTA */}
                <div className="fade-up fade-up-4" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                  <Link href={heroSettings.slide1.primaryBtnLink || '/forum'} className="btn-gold" style={{ position: 'relative' }}>
                    {heroSettings.slide1.primaryBtnText}
                  </Link>
                  <Link href={heroSettings.slide1.secondaryBtnLink || '/iletisim'} className="btn-ghost">
                    {heroSettings.slide1.secondaryBtnText} <ArrowRight size={14}/>
                  </Link>
                </div>

              </div>
            </div>
          </div>

          {/* ────── SLIDE 2: FORUM TANITIMI (CANLI TOPLULUK) ────── */}
          <div
            style={{
              width: '50%',
              flex: '0 0 50%',
              position: 'relative',
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              paddingTop: 120,
              paddingBottom: 90,
              boxSizing: 'border-box',
            }}
          >
            {/* Background */}
            {heroSettings.slide2.bgImage ? (
              <>
                <Image
                  src={heroSettings.slide2.bgImage}
                  alt="Psikoloji Forumu"
                  fill
                  priority
                  quality={90}
                  sizes="100vw"
                  className="hero-image"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
                <div className="hero-overlay" style={{ background: 'linear-gradient(105deg, rgba(7,14,27,0.96) 0%, rgba(7,14,27,0.85) 50%, rgba(7,14,27,0.6) 100%)' }} />
              </>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 80% 25%, rgba(201, 169, 110, 0.22) 0%, transparent 55%), radial-gradient(circle at 20% 75%, rgba(30, 58, 138, 0.45) 0%, transparent 60%), #070e1b',
                }}
              />
            )}
            <div className="hero-grain" />

            <div className="container-main" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 48, alignItems: 'center' }} className="hero-forum-grid">
                {/* Left Side: Content */}
                <div>
                  {/* Eyebrow with animated live badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 24,
                      background: 'rgba(201, 169, 110, 0.14)',
                      border: '1px solid rgba(201, 169, 110, 0.35)',
                      padding: '6px 16px',
                      borderRadius: 999,
                      color: 'var(--gold-light)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e', display: 'inline-block' }} />
                    <span>{heroSettings.slide2.eyebrow}</span>
                  </div>

                  {/* Main title */}
                  <h1 className="display-title" style={{ fontSize: 'clamp(2.8rem,6.5vw,5.5rem)', marginBottom: 26, lineHeight: 1.08 }}>
                    {heroSettings.slide2.titlePart1}
                    <br />
                    <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{heroSettings.slide2.titlePart2}</em> {heroSettings.slide2.titlePart3}
                  </h1>

                  {/* Description */}
                  <p className="crimson" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(1rem, 3.8vw, 1.22rem)', maxWidth: 580, marginBottom: 38, lineHeight: 1.75 }}>
                    {heroSettings.slide2.description}
                  </p>

                  {/* CTAs */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
                    <Link
                      href={heroSettings.slide2.primaryBtnLink || '/forum'}
                      className="btn-gold"
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        boxShadow: '0 8px 30px rgba(201, 169, 110, 0.4)',
                        padding: '16px 36px',
                      }}
                    >
                      <MessageCircle size={18} />
                      <span>{heroSettings.slide2.primaryBtnText || 'Hemen Üye Ol & Foruma Katıl'}</span>
                    </Link>

                    <Link href={heroSettings.slide2.secondaryBtnLink || '/forum'} className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span>{heroSettings.slide2.secondaryBtnText || 'Tartışmaları İncele'}</span> <ArrowRight size={14}/>
                    </Link>
                  </div>

                  {/* Trust badges */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle2 size={16} color="var(--gold)" />
                      <span>Ücretsiz Kayıt & Katılım</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle2 size={16} color="var(--gold)" />
                      <span>Psikolog & Üye Yanıtları</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle2 size={16} color="var(--gold)" />
                      <span>Saygılı & Güvenli Paylaşım</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Showcase Cards (Desktop/Tablet) */}
                <div className="hero-forum-cards hidden lg:flex" style={{ flexDirection: 'column', gap: 16 }}>
                  {/* Highlight Card 1 */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderLeft: '4px solid var(--gold)',
                      borderRadius: 14,
                      padding: '18px 22px',
                      color: 'white',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Sparkles size={18} color="var(--gold)" />
                      <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{heroSettings.slide2.highlight1Title}</div>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.55 }}>
                      {heroSettings.slide2.highlight1Desc}
                    </div>
                  </div>

                  {/* Highlight Card 2 */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderLeft: '4px solid var(--gold)',
                      borderRadius: 14,
                      padding: '18px 22px',
                      color: 'white',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <ShieldCheck size={18} color="var(--gold)" />
                      <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{heroSettings.slide2.highlight2Title}</div>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.55 }}>
                      {heroSettings.slide2.highlight2Desc}
                    </div>
                  </div>

                  {/* Highlight Card 3 */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderLeft: '4px solid var(--gold)',
                      borderRadius: 14,
                      padding: '18px 22px',
                      color: 'white',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Users size={18} color="var(--gold)" />
                      <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{heroSettings.slide2.highlight3Title}</div>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.55 }}>
                      {heroSettings.slide2.highlight3Desc}
                    </div>
                  </div>

                  {/* Interactive Forum Link pill */}
                  <Link
                    href="/forum"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(201, 169, 110, 0.16)',
                      border: '1px solid rgba(201, 169, 110, 0.4)',
                      borderRadius: 12,
                      padding: '14px 20px',
                      color: 'white',
                      textDecoration: 'none',
                      transition: 'all 0.25s',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-light)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MessageCircle size={15} color="var(--gold)" />
                      Aklındaki soruyu şimdi sor & katıl
                    </span>
                    <ArrowRight size={16} color="var(--gold)" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ────── NAVIGATION CONTROLS (BOTTOM CENTER: ARROWS ONLY) ────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(7, 14, 27, 0.85)',
            backdropFilter: 'blur(16px)',
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(201, 169, 110, 0.35)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {/* Prev Slide Arrow */}
          <button
            type="button"
            onClick={() => goToSlide(currentSlide === 0 ? 1 : 0)}
            aria-label="Önceki Slayt"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              color: 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = 'var(--gold)';
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.background = 'rgba(201, 169, 110, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Minimal Slide Indicator Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 2px' }}>
            <button
              type="button"
              onClick={() => goToSlide(0)}
              aria-label="1. Slayt"
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 8,
                  borderRadius: 999,
                  background: currentSlide === 0 ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                  transform: currentSlide === 0 ? 'scaleX(1)' : 'scaleX(0.4)',
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease, background-color 0.3s ease, opacity 0.3s ease',
                  willChange: 'transform, opacity',
                  display: 'inline-block',
                }}
              />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(1)}
              aria-label="2. Slayt"
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 8,
                  borderRadius: 999,
                  background: currentSlide === 1 ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                  transform: currentSlide === 1 ? 'scaleX(1)' : 'scaleX(0.4)',
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease, background-color 0.3s ease, opacity 0.3s ease',
                  willChange: 'transform, opacity',
                  display: 'inline-block',
                }}
              />
            </button>
          </div>

          {/* Next Slide Arrow */}
          <button
            type="button"
            onClick={() => goToSlide(currentSlide === 0 ? 1 : 0)}
            aria-label="Sonraki Slayt"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              color: 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = 'var(--gold)';
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.background = 'rgba(201, 169, 110, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ══════════════════ ABOUT ══════════════════ */}
      <section style={{ padding: '120px 0', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 28px' }}>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left: Photo */}
            <div>
              <div
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 32px 64px -16px rgba(10, 22, 40, 0.14)',
                }}
              >
                <img
                  src={aboutSettings.image || '/pskfurkanmanav.jpeg'}
                  alt={aboutSettings.name || 'Psikolog Furkan Manav'}
                  style={{ width: '100%', display: 'block', aspectRatio: '4/5', objectFit: 'cover', objectPosition: 'top center' }}
                />
              </div>
            </div>

            {/* Right: Content */}
            <div>
              {/* Eyebrow */}
              {aboutSettings.eyebrow && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{ width: 32, height: 2, background: '#c9a96e', display: 'block' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a5814' }}>
                    {aboutSettings.eyebrow}
                  </span>
                </div>
              )}

              {/* Title */}
              {aboutSettings.name && (
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', fontWeight: 700, color: '#0a1628', lineHeight: 1.1, marginBottom: 12 }}>
                  {aboutSettings.name}
                </h2>
              )}
              {aboutSettings.title && (
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontStyle: 'italic', color: '#8a5814', lineHeight: 1.2, marginBottom: 32 }}>
                  {aboutSettings.title}
                </p>
              )}

              {/* Separator */}
              <div style={{ width: 48, height: 2, background: '#c9a96e', marginBottom: 32 }} />

              {/* Body Text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
                {aboutSettings.paragraph1 && (
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#475569' }}>
                    {aboutSettings.paragraph1}
                  </p>
                )}
                {aboutSettings.paragraph2 && (
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#475569' }}>
                    {aboutSettings.paragraph2}
                  </p>
                )}
              </div>

              {/* Quote */}
              {aboutSettings.quote && (
                <blockquote style={{ borderLeft: '3px solid #c9a96e', paddingLeft: 24, marginBottom: 40 }}>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '1.15rem', lineHeight: 1.7, color: '#1e293b' }}>
                    "{aboutSettings.quote.replace(/^["“”']+|["“”']+$/g, '')}"
                  </p>
                </blockquote>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {aboutSettings.primaryBtnText && (
                  <Link href={aboutSettings.primaryBtnLink || '/ben-kimim'} className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {aboutSettings.primaryBtnText}
                    <ArrowRight size={16} />
                  </Link>
                )}
                {aboutSettings.secondaryBtnText && (
                  <Link
                    href={aboutSettings.secondaryBtnLink || '/iletisim'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '14px 28px',
                      borderRadius: 8,
                      border: '2px solid #0a1628',
                      color: '#0a1628',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      transition: 'all 0.25s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#0a1628'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0a1628'; }}
                  >
                    {aboutSettings.secondaryBtnText}
                  </Link>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>



      {/* ══════════════════ LATEST ARTICLES (HORIZONTAL CAROUSEL) ══════════════════ */}
      {latestArticles.length > 0 && (
        <section style={{ padding: '100px 0', background: '#f8fafc', overflow: 'hidden' }}>
          <style>{`
            .articles-carousel-container::-webkit-scrollbar {
              display: none;
            }
            .article-carousel-card {
              flex: 0 0 420px;
              scroll-snap-align: start;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              border: 1.5px solid rgba(212, 175, 55, 0.25);
              box-shadow: 0 8px 32px rgba(10, 22, 40, 0.06);
              transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
              display: flex;
              flex-direction: column;
              text-decoration: none;
              position: relative;
            }
            .article-carousel-card:hover {
              border-color: var(--gold);
              transform: translateY(-6px);
              box-shadow: 0 20px 48px -10px rgba(10, 22, 40, 0.14), 0 0 22px rgba(212, 175, 55, 0.2);
            }
            .article-carousel-card:hover .article-img-zoom {
              transform: scale(1.06);
            }
            .article-carousel-card:hover .article-card-arrow-icon {
              transform: translateX(4px);
            }
            .article-card-img-wrap {
              height: 220px;
              width: 100%;
              position: relative;
              overflow: hidden;
              background: #f1f5f9;
              flex-shrink: 0;
            }
            .article-card-excerpt-desktop {
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .article-card-cta-desktop { display: flex; }
            .article-nav-desktop { display: flex; }

            @media (max-width: 768px) {
              .article-carousel-card {
                flex: 0 0 300px !important;
                border-radius: 16px !important;
                min-height: auto !important;
              }
              .articles-carousel-container {
                gap: 14px !important;
                padding-left: 16px !important;
                padding-right: 16px !important;
                padding-bottom: 16px !important;
                padding-top: 4px !important;
              }
              .article-card-img-wrap {
                height: 160px !important;
              }
              .article-card-content-inner {
                padding: 16px 16px !important;
                display: flex !important;
                flex-direction: column !important;
                flex: 1 !important;
              }
              .article-card-content-inner h3 {
                font-size: 1.12rem !important;
                font-weight: 700 !important;
                line-height: 1.35 !important;
                margin-bottom: 8px !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                color: var(--navy) !important;
              }
              .article-card-excerpt-desktop {
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                font-size: 0.84rem !important;
                line-height: 1.55 !important;
                margin-bottom: 12px !important;
                color: #475569 !important;
              }
              .article-card-cta-desktop {
                padding-top: 12px !important;
                margin-top: auto !important;
                border-top: 1px solid #f1f5f9 !important;
              }
              .article-card-meta {
                margin-bottom: 10px !important;
                display: flex !important;
              }
              .article-card-meta span {
                font-size: 0.68rem !important;
                padding: 3px 9px !important;
              }
              .article-card-date {
                font-size: 0.72rem !important;
              }
              .article-nav-desktop {
                display: none !important;
              }
              .articles-section-header {
                margin-bottom: 20px !important;
                padding: 0 16px !important;
              }
              .articles-section-header h2 {
                font-size: 1.5rem !important;
              }
              .articles-section-header .eyebrow {
                font-size: 0.65rem !important;
                margin-bottom: 6px !important;
              }
              .article-see-all-mobile {
                display: flex !important;
              }
            }
          `}</style>
          <div className="container-main">
            <div className="articles-section-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 10, color: '#8a5814' }}>Güncel İçerikler</div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                  Son Yazılarım
                </h2>
              </div>
              
              <div className="article-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Arrow navigation buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => scrollArticles('left')} 
                    style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(212, 175, 55, 0.4)', background: 'white', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background-color 0.2s, border-color 0.2s, color 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)'; e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--navy)'; }}
                    title="Önceki"
                    aria-label="Önceki yazılar"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => scrollArticles('right')} 
                    style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(212, 175, 55, 0.4)', background: 'white', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background-color 0.2s, border-color 0.2s, color 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)'; e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--navy)'; }}
                    title="Sonraki"
                    aria-label="Sonraki yazılar"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <Link href="/yazilarim" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--navy)', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px', borderRadius: 999, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', transition: 'all 0.2s' }}>
                  Tümünü Gör <ArrowRight size={14}/>
                </Link>
              </div>
            </div>

            {/* Horizontal sliding track */}
            <div 
              ref={articlesCarouselRef} 
              className="articles-carousel-container"
              style={{
                display: 'flex',
                gap: 28,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                padding: '12px 4px 28px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {latestArticles.map(a => {
                const articleDate = a.createdAt || a.date;
                let formattedDate = '';
                if (articleDate) {
                  try {
                    formattedDate = format(new Date(articleDate), 'd MMM yyyy', { locale: tr });
                  } catch {}
                }

                const cardExcerpt = a.excerpt || (a.content ? truncateText(stripHtml(a.content), 150) : '');

                return (
                  <Link href={`/yazilarim/${a.id}`} key={a.id} className="article-carousel-card">
                    {/* Image / Header banner */}
                    <div className="article-card-img-wrap">
                      {a.featuredImage ? (
                        <img 
                          src={a.featuredImage} 
                          alt={a.title} 
                          className="article-img-zoom"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s ease', display: 'block' }} 
                        />
                      ) : (
                        <div className="article-card-placeholder" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle at center, var(--gold) 0%, transparent 70%)' }} />
                          <BookOpen size={38} color="var(--gold)" style={{ opacity: 0.85 }} />
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="article-card-content-inner" style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className="article-card-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        {a.category && (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {a.category}
                          </span>
                        )}
                        {formattedDate && (
                          <span className="article-card-date" style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                            {formattedDate}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.4, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.title}
                      </h3>

                      {cardExcerpt && (
                        <p className="article-card-excerpt-desktop" style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 20px', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cardExcerpt}
                        </p>
                      )}

                      <div className="article-card-cta-desktop" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: 'var(--navy)', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                          Yazıyı Oku 
                          <ArrowRight size={14} className="article-card-arrow-icon" style={{ transition: 'transform 0.2s ease', color: '#8a5814' }} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile: See all link */}
            <div className="article-see-all-mobile" style={{ display: 'none', justifyContent: 'center', marginTop: 8 }}>
              <Link href="/yazilarim" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--navy)', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 20px', borderRadius: 999, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                Tümünü Gör <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ FEATURED VIDEOS ══════════════════ */}
      {randomVideos.length > 0 && (
        <section style={{ padding: '80px 0', background: 'white', borderTop: '1px solid rgba(0,0,0,0.02)' }}>
          <div className="container-main">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 12, color: '#8a5814' }}>Video Paylaşımları</div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem,3.5vw,2.6rem)', fontWeight: 700, color: 'var(--navy)' }}>
                  Öne Çıkan <em style={{ color: '#8a5814', fontStyle: 'italic' }}>Videolarım</em>
                </h2>
              </div>
              <Link href="/videolarim" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--navy)', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Tüm Videoları Gör <ArrowRight size={14}/>
              </Link>
            </div>

            {/* Video Cards Grid */}
            <div className="featured-videos-grid">
              {randomVideos.map(video => {
                const thumbUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                return (
                  <Link 
                    href={`/videolarim?id=${video.id}`} 
                    key={video.id}
                    className="glow-frame-container aspect-[9/16]"
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div className="glow-frame-inner relative w-full h-full">
                      {/* Image Thumbnail */}
                      <Image 
                        src={thumbUrl} 
                        alt={video.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        style={{ objectFit: 'cover', opacity: 0.75, transition: 'opacity 0.3s' }}
                      />
                      
                      {/* Gradient overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent 60%, rgba(0,0,0,0.85))', pointerEvents: 'none' }} />

                      {/* Content overlay */}
                      <div style={{ position: 'absolute', top: 20, left: 16, right: 16, zIndex: 10 }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--gold-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 4 }}>
                          REELS / SHORTS
                        </span>
                        <h3 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, lineHeight: 1.3, textShadow: '0 2px 4px rgba(0,0,0,0.6)', margin: 0 }}>
                          {video.title}
                        </h3>
                      </div>

                      {/* Play Button Overlay */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', transition: 'transform 0.3s' }} className="play-btn-circle">
                          <Play size={18} fill="white" color="white" style={{ marginLeft: 3 }} />
                        </div>
                      </div>

                      {/* Watch Action Label */}
                      <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span style={{ transition: 'color 0.3s' }}>Şimdi İzle</span>
                        <ArrowRight size={12} style={{ transition: 'transform 0.3s' }} className="arrow-icon" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ FORUMDAN ══════════════════ */}
      <section className="home-forum">
        <div className="container-main">
          <div className="home-forum-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12, color: '#8a5814' }}>Logos · Psikoloji forumu</div>
              <h2>Logos'ta konuşulanlar</h2>
              <p>Merak ettiğini sor, başkalarının sorularına katıl. Psikologların yanıtları altın rozetle işaretlenir.</p>
            </div>
            <Link href="/forum" className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Logos'a git <ArrowRight size={14} />
            </Link>
          </div>

          {forumPosts.length > 0 ? (
            <div className="home-forum-grid" style={{ gridTemplateColumns: `repeat(${Math.min(forumPosts.length + (forumPosts.length < 3 ? 1 : 0), 3)}, minmax(0, 1fr))` }}>
              {forumPosts.map(p => {
                const likes = Object.values(p.reactionsData || {}).filter((v: any) => v === 'like' || v === 'heart').length;
                const date = p.createdAt?.toDate ? p.createdAt.toDate() : null;
                return (
                  <Link key={p.id} href={`/forum?thread=${p.id}`} className="home-forum-card">
                    <div className="home-forum-author">
                      <span className="home-forum-avatar">
                        {p.authorPhotoURL ? <img src={p.authorPhotoURL} alt="" /> : (p.authorName || '?')[0].toLocaleUpperCase('tr-TR')}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <strong>
                          {p.authorName || 'Üye'}
                          {p.authorIsPsychologist && <CheckCircle2 size={14} color="#a27a35" aria-label="Psikolog" />}
                        </strong>
                        <small>{p.category || 'Genel'}{date ? `, ${format(date, 'd MMMM', { locale: tr })}` : ''}</small>
                      </span>
                    </div>
                    <p>{p.body}</p>
                    <div className="home-forum-meta">
                      <span><MessageCircle size={15} /> {p.commentCount || 0} yanıt</span>
                      <span><Heart size={15} /> {likes} beğeni</span>
                    </div>
                  </Link>
                );
              })}
              {forumPosts.length < 3 && (
                <Link href="/forum?compose=open" className="home-forum-card home-forum-ask">
                  <MessageCircle size={26} />
                  <strong>Aklındaki soruyu sor</strong>
                  <p>Kaygı, ilişkiler, rüyalar ya da bir kavram hakkında merak ettiğini yaz. Topluluk ve psikologlar yanıtlasın.</p>
                  <span className="home-forum-ask-cta">Soru sor <ArrowRight size={14} /></span>
                </Link>
              )}
            </div>
          ) : (
            <div className="home-forum-empty">Logos'ta ilk soruyu sen sor; sohbet oradan başlasın.</div>
          )}
        </div>
      </section>

      {/* ══════════════════ QUOTE ══════════════════ */}
      <section style={{ padding: '88px 0', background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,169,110,0.08),transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,169,110,0.06),transparent 70%)', pointerEvents: 'none' }}/>

        <div className="container-main" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Quote size={36} color="var(--gold)" style={{ margin: '0 auto 28px', opacity: 0.7 }}/>
          <blockquote className="crimson" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(1.4rem,3vw,2.1rem)', fontStyle: 'italic', maxWidth: 780, margin: '0 auto 20px', lineHeight: 1.6 }}>
            "{dailyQuote.text}"
          </blockquote>
          <p style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 0 }}>
            {dailyQuote.author}
          </p>
        </div>
      </section>

    </>
  );
}
