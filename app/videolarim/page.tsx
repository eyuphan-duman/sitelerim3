'use client';
// ANTIGRAVITY: BU DOSYA GÜNCELLENMİŞTİR - YOUTUBE SHORTS ENTEGRASYONU AKTİF.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Film, Play, Pause, X, Share2, CheckCircle, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
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

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const lastWheelTime = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  // Wheel event for desktop Instagram-style vertical scroll
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 450) return; // 450ms cooldown
    if (e.deltaY > 35) {
      lastWheelTime.current = now;
      handleNextReel();
    } else if (e.deltaY < -35) {
      lastWheelTime.current = now;
      handlePrevReel();
    }
  };

  const handleNextReel = () => {
    if (expandedReelIndex !== null && expandedReelIndex < allReels.length - 1) {
      setExpandedReelIndex(expandedReelIndex + 1);
      setIsPlaying(true);
    }
  };

  const handlePrevReel = () => {
    if (expandedReelIndex !== null && expandedReelIndex > 0) {
      setExpandedReelIndex(expandedReelIndex - 1);
      setIsPlaying(true);
    }
  };

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (expandedReelIndex === null) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        handleNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        handlePrevReel();
      } else if (e.key === 'Escape') {
        setExpandedReelIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedReelIndex, allReels]);

  // Touch Swipe Gesture Handlers (Instagram Reels Style)
  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    dragStartYRef.current = e.touches[0].clientY;
    dragStartTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - dragStartYRef.current;
    setDragY(delta);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    const elapsed = Date.now() - dragStartTimeRef.current;
    finishGesture(dragY, elapsed);
  };

  // Mouse Drag Handlers for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientY - dragStartYRef.current;
    setDragY(delta);
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    const elapsed = Date.now() - dragStartTimeRef.current;
    finishGesture(dragY, elapsed);
  };

  const finishGesture = (deltaY: number, elapsed: number) => {
    setDragY(0);
    // Tap detection (< 10px hareket ve < 300ms) -> oynat / duraklat
    if (Math.abs(deltaY) < 10 && elapsed < 300) {
      togglePlay();
      return;
    }

    const threshold = 50; // 50px eşik değeri
    if (deltaY < -threshold) {
      // Parmağı yukarı kaydırma -> Sonraki Video (Instagram Reels akışı)
      handleNextReel();
    } else if (deltaY > threshold) {
      // Parmağı aşağı kaydırma -> Önceki Video
      handlePrevReel();
    }
  };

  const togglePlay = () => {
    const iframe = iframeRef.current;
    const nextState = !isPlaying;
    if (iframe && iframe.contentWindow) {
      const command = nextState ? 'playVideo' : 'pauseVideo';
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: command, args: '' }),
          '*'
        );
      } catch { }
    }
    setIsPlaying(nextState);
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 700);
  };

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
            className="absolute top-5 right-5 z-[2100] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
            title="Kapat (Esc)"
          >
            <X size={22} />
          </button>

          {/* Önceki Video (Desktop) */}
          {expandedReelIndex > 0 && (
            <button
              onClick={handlePrevReel}
              className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-[2100] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-colors"
              title="Önceki Video (Sol / Yukarı Ok)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Sonraki Video (Desktop) */}
          {expandedReelIndex < allReels.length - 1 && (
            <button
              onClick={handleNextReel}
              className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-[2100] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-colors"
              title="Sonraki Video (Sağ / Aşağı Ok)"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Dikey Video Çerçevesi (9:16 Sinematik Odak & Instagram Jest Kontrolü) */}
          <div 
            className="relative w-full max-w-[460px] h-full max-h-[92vh] aspect-[9/16] rounded-[24px] overflow-hidden bg-black border border-white/10 shadow-2xl flex flex-col justify-center items-center group select-none"
            onWheel={handleWheel}
            style={{
              transform: `translate3d(0, ${dragY}px, 0)`,
              transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            {/* Üst İlerleme ve İpucu Rozeti */}
            <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-30">
              <span className="text-[11px] text-white/70 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
                <span className="font-semibold">{expandedReelIndex + 1} / {allReels.length}</span>
                <span className="opacity-40">•</span>
                <span>Aşağı / Yukarı kaydır</span>
              </span>
            </div>

            {/* Video Oynatıcı */}
            {allReels[expandedReelIndex].youtubeId ? (
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${allReels[expandedReelIndex].youtubeId}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={allReels[expandedReelIndex].title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full aspect-[9/16] object-cover pointer-events-none"
              ></iframe>
            ) : (
              <video 
                src={allReels[expandedReelIndex].videoUrl} 
                autoPlay 
                loop 
                controls={false}
                playsInline
                className="w-full h-full object-contain pointer-events-none"
              />
            )}

            {/* ŞEFFAF DOKUNMATİK JEST KATMANI: Instagram Reels gibi parmakla aşağı/yukarı kaydırmayı ve dokunarak duraklatmayı sağlar */}
            <div
              className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              title="Kaydırarak diğer videoya geçin, dokunarak duraklatın"
            />

            {/* Oynat / Duraklat Görsel Geri Bildirimi */}
            {showPlayIcon && (
              <div className="absolute z-30 pointer-events-none w-16 h-16 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white shadow-2xl transition-all scale-110">
                {isPlaying ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
              </div>
            )}

            {/* Alt Bilgi & Doğrudan YouTube Etkileşim Barı */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5 pt-12 flex flex-col gap-3 pointer-events-auto">
              <h3 className="text-white text-sm md:text-base font-semibold line-clamp-2 drop-shadow-md">
                {allReels[expandedReelIndex].title}
              </h3>

              <div className="flex items-center justify-between gap-3 pt-1">
                {allReels[expandedReelIndex].youtubeId && (
                  <a
                    href={`https://www.youtube.com/shorts/${allReels[expandedReelIndex].youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur transition-all shadow-lg"
                    title="YouTube'da Aç (Beğen ve Yorum Yap)"
                  >
                    <ExternalLink size={13} />
                    <span>YouTube'da Aç (Beğen / Yorum Yap)</span>
                  </a>
                )}

                <button
                  onClick={() => handleShare(allReels[expandedReelIndex].title, allReels[expandedReelIndex].videoUrl)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur transition-all ml-auto"
                >
                  <Share2 size={13} />
                  <span>Paylaş</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
