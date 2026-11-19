'use client';
// ANTIGRAVITY: BU DOSYA GÜNCELLENMİŞTİR - YOUTUBE SHORTS ENTEGRASYONU AKTİF.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Film, Play, X, Share2, CheckCircle, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';

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

export default function VideolarimPage() {
  const { user } = useAuth();
  const [expandedReelIndex, setExpandedReelIndex] = useState<number | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  
  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];
  const [firebaseVideos, setFirebaseVideos] = useState<any[]>([]);
  const [youtubeShorts, setYoutubeShorts] = useState(YOUTUBE_SHORTS);

  useEffect(() => {
    const w = localStorage.getItem('manav_watched_reels');
    if (w) setWatchedVideos(JSON.parse(w));

    fetch('/api/youtube-shorts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data?.shorts) && data.shorts.length > 0) {
          const seen = new Set(data.shorts.map((s: any) => s.youtubeId));
          const merged = [
            ...data.shorts,
            ...YOUTUBE_SHORTS.filter(s => !seen.has(s.youtubeId)),
          ];
          setYoutubeShorts(merged);
        }
      })
      .catch(() => {});

    const q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setFirebaseVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const allReels = useMemo(() => [...firebaseVideos, ...youtubeShorts], [firebaseVideos, youtubeShorts]);

  // URL query parameter check to auto-open video
  useEffect(() => {
    if (allReels.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlId = searchParams.get('id');
      if (urlId) {
        const idx = allReels.findIndex(r => r.id === urlId);
        if (idx !== -1) {
          setExpandedReelIndex(idx);
        }
      }
    }
  }, [allReels]);

  const lastWheelTime = useRef(0);

  const transitionToNext = () => {
    if (expandedReelIndex === null || expandedReelIndex >= allReels.length - 1) return;
    setExpandedReelIndex(prev => (prev !== null ? prev + 1 : null));
  };

  const transitionToPrev = () => {
    if (expandedReelIndex === null || expandedReelIndex <= 0) return;
    setExpandedReelIndex(prev => (prev !== null ? prev - 1 : null));
  };

  // Wheel event for desktop
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 450) return;
    if (e.deltaY > 30) {
      lastWheelTime.current = now;
      transitionToNext();
    } else if (e.deltaY < -30) {
      lastWheelTime.current = now;
      transitionToPrev();
    }
  };

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (expandedReelIndex === null) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        transitionToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        transitionToPrev();
      } else if (e.key === 'Escape') {
        setExpandedReelIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedReelIndex, allReels]);

  useEffect(() => {
    if (expandedReelIndex !== null) {
      document.body.style.overflow = 'hidden';
      if (allReels[expandedReelIndex]) {
        const reelId = allReels[expandedReelIndex].id;
        if (!watchedVideos.includes(reelId)) {
          const nw = [...watchedVideos, reelId];
          setWatchedVideos(nw);
          localStorage.setItem('manav_watched_reels', JSON.stringify(nw));
        }
      }
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [expandedReelIndex]);

  const deleteVideoDoc = async (id: string, isLocal: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocal) {
      toast.error('Varsayılan videolar silinemez.');
      return;
    }
    if (confirm('Bu videoyu silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'reels', id));
        toast.success('Video silindi.');
      } catch (err) {
        toast.error('Silinirken hata oluştu.');
      }
    }
  };

  const handleShare = async (title: string, url: string) => {
    const reel = expandedReelIndex !== null ? allReels[expandedReelIndex] : null;
    const shareUrl = url || (reel?.youtubeId ? `https://youtube.com/shorts/${reel.youtubeId}` : window.location.href);
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: title + ' - Psikolog Furkan Manav Videoları',
          url: shareUrl,
        });
      } catch (err) {
        console.log("Shared cancelled or failed", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Bağlantı kopyalandı!');
    }
  };

  return (
    <div className="ed-page">
      {/* ─── ÜST KAPAK (MASTHEAD) ─── */}
      <header className="ed-hero">
        <div className="hx-grain" aria-hidden="true" />
        <div className="hm-wrap">
          <div className="ed-hero-bar">
            <span className="ed-hero-eyebrow">Psikoloji · Psikanaliz · Kısa Kayıtlar</span>
            <span className="ed-hero-rule" aria-hidden="true" />
            <span className="ed-hero-place">{allReels.length} Video</span>
          </div>

          <div className="ed-hero-grid">
            <div>
              <h1 className="ed-hero-title">Videolarım</h1>
              <p className="ed-hero-sub">
                Psikanalitik kavramlar, ilişki döngüleri, savunma mekanizmaları ve varoluşsal meseleler üzerine kısa video kayıtları.
              </p>
            </div>
            <div className="ed-hero-actions">
              <Link href="/yazilarim" className="hx-link">
                Yazılı Denemelere Göz Atın
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── VİDEOLAR IZGARASI (1480px) ─── */}
      <div className="hm-wrap ed-body">
        <div className="ed-videos-grid">
          {allReels.map((reel, index) => {
            const hasWatched = watchedVideos.includes(reel.id);
            const isLocal = !!YOUTUBE_SHORTS.find(r => r.id === reel.id);
            const coverUrl = reel.youtubeId
              ? `/video-covers/${reel.youtubeId}.jpg`
              : `${reel.videoUrl}#t=0.5`;
            const fallbackUrl = reel.youtubeId
              ? `https://i.ytimg.com/vi/${reel.youtubeId}/oar2.jpg`
              : '';

            return (
              <div
                key={reel.id}
                onClick={() => setExpandedReelIndex(index)}
                className="hm-video-card ed-video-item"
                style={{ cursor: 'pointer' }}
              >
                <div className="hm-video-frame is-custom-cover">
                  {reel.youtubeId ? (
                    <img
                      src={coverUrl}
                      alt={reel.title}
                      loading="lazy"
                      onError={(e) => {
                        if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                          e.currentTarget.src = fallbackUrl;
                        }
                      }}
                      className="hm-video-cover-img"
                    />
                  ) : (
                    <>
                      <video
                        src={coverUrl}
                        preload="metadata"
                        muted
                        className="hm-video-thumb"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div className="hm-video-overlay" aria-hidden="true" />
                      <div className="hm-video-play" aria-hidden="true">
                        <Play size={16} fill="currentColor" strokeWidth={1.5} style={{ marginLeft: 2 }} />
                      </div>
                      <div className="hm-video-bottom">
                        <h2 className="hm-video-title">{reel.title}</h2>
                        <span className="hm-video-cta">
                          <span>Kaydı İzle</span>
                          <ArrowUpRight size={14} strokeWidth={1.6} />
                        </span>
                      </div>
                    </>
                  )}

                  {hasWatched && (
                    <span className="ed-video-watched" style={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}>
                      <CheckCircle size={11} /> İzlendi
                    </span>
                  )}

                  {ADMIN_EMAILS.includes(user?.email || '') && (
                    <button
                      onClick={(e) => deleteVideoDoc(reel.id, isLocal, e)}
                      className="absolute top-3 left-3 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-full z-20 shadow-lg transition-transform hover:scale-110"
                      title="Videoyu Sil"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bk-bottom-banner" style={{ marginTop: 64 }}>
          <div>
            <span className="bk-bottom-eyebrow">Derinlemesine İncelemeler</span>
            <h2>Düşüncelerim ve Psikanalitik Yazılarım</h2>
          </div>
          <div className="bk-bottom-actions">
            <Link href="/yazilarim" className="hx-btn">
              <span>Yazılarıma Göz Atın</span>
              <ArrowRight size={15} strokeWidth={1.6} />
            </Link>
            <Link href="/forum" className="hx-link">
              Logos Forum’da Tartışmalara Katılın
            </Link>
          </div>
        </div>
      </div>

      {/* ─── FULLSCREEN REEL THEATER (SADE VE ODAKLANMIŞ OYNATICI) ─── */}
      {expandedReelIndex !== null && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center fade-in p-4">
          
          {/* Kapat Butonu */}
          <button 
            onClick={() => setExpandedReelIndex(null)}
            className="absolute top-5 right-5 z-[2100] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
            title="Kapat (Esc)"
          >
            <X size={22} />
          </button>

          {/* Önceki Video (Mobil & Masaüstü) */}
          {expandedReelIndex > 0 && (
            <button
              onClick={transitionToPrev}
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-[2100] w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              title="Önceki Video"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Sonraki Video (Mobil & Masaüstü) */}
          {expandedReelIndex < allReels.length - 1 && (
            <button
              onClick={transitionToNext}
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-[2100] w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              title="Sonraki Video"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Dikey Video Görüntüleme Penceresi (Sabit 9:16 Çerçeve) */}
          <div 
            className="relative w-full max-w-[460px] h-full max-h-[92vh] aspect-[9/16] rounded-[24px] overflow-hidden bg-black border border-white/10 shadow-2xl flex flex-col justify-center items-center"
            onWheel={handleWheel}
          >
            {allReels[expandedReelIndex] && (
              allReels[expandedReelIndex].youtubeId ? (
                <iframe
                  key={allReels[expandedReelIndex].youtubeId}
                  src={`https://www.youtube.com/embed/${allReels[expandedReelIndex].youtubeId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
                  title={allReels[expandedReelIndex].title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full aspect-[9/16] object-cover"
                />
              ) : (
                <video
                  src={allReels[expandedReelIndex].videoUrl}
                  autoPlay
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )
            )}
          </div>
        </div>
      )}

    </div>
  );
}
