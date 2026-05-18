'use client';
// ANTIGRAVITY: BU DOSYA GÜNCELLENMİŞTİR - YOUTUBE SHORTS ENTEGRASYONU AKTİF.
import React, { useState, useRef, useEffect } from 'react';
import { Film, Play, Heart, MessageCircle, Send, X, Share2, ThumbsUp, ThumbsDown, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import AuthModal from '@/components/AuthModal';
import Link from 'next/link';

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

interface CommentType {
  id: string;
  user: string;
  userId: string;
  text: string;
  likes: number;
  dislikes: number;
  replies: { id: string; user: string; text: string; userId: string; }[];
}

export default function VideolarimPage() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [reactions, setReactions] = useState<Record<string, boolean>>({}); // ReelId -> Liked
  const [dislikes, setDislikes] = useState<Record<string, boolean>>({}); // ReelId -> Disliked
  const [comments, setComments] = useState<Record<string, CommentType[]>>({});
  const [newComment, setNewComment] = useState('');
  
  const [expandedReelIndex, setExpandedReelIndex] = useState<number | null>(null);
  
  const [replyingTo, setReplyingTo] = useState<{ reelId: string, commentId: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  
  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];
  const [firebaseVideos, setFirebaseVideos] = useState<any[]>([]);

  useEffect(() => {
    const w = localStorage.getItem('manav_watched_reels');
    if (w) setWatchedVideos(JSON.parse(w));

    const q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setFirebaseVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const allReels = [...firebaseVideos, ...YOUTUBE_SHORTS];

  const handleNextReel = () => {
    if (expandedReelIndex !== null && expandedReelIndex < allReels.length - 1) {
      setExpandedReelIndex(expandedReelIndex + 1);
    }
  };

  const handlePrevReel = () => {
    if (expandedReelIndex !== null && expandedReelIndex > 0) {
      setExpandedReelIndex(expandedReelIndex - 1);
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

  // Touch Swipe Gesture Refs & Handlers for Instagram Reels Style
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null || touchEndY.current === null) return;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // threshold in pixels

    if (Math.abs(diffY) > minSwipeDistance) {
      if (diffY > 0) {
        // Swiped UP -> Next video
        handleNextReel();
      } else {
        // Swiped DOWN -> Previous video
        handlePrevReel();
      }
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  useEffect(() => {
    if (expandedReelIndex !== null) {
      document.body.style.overflow = 'hidden';
      const reelId = allReels[expandedReelIndex].id;
      if (!watchedVideos.includes(reelId)) {
        const nw = [...watchedVideos, reelId];
        setWatchedVideos(nw);
        localStorage.setItem('manav_watched_reels', JSON.stringify(nw));
      }
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [expandedReelIndex, allReels]);

  const toggleLikeReel = (id: string) => {
    setReactions(prev => ({ ...prev, [id]: !prev[id] }));
    if (dislikes[id]) setDislikes(prev => ({ ...prev, [id]: false }));
  };

  const toggleDislikeReel = (id: string) => {
    setDislikes(prev => ({ ...prev, [id]: !prev[id] }));
    if (reactions[id]) setReactions(prev => ({ ...prev, [id]: false }));
  };

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
    if (navigator.share) {
      try {
        const reel = expandedReelIndex !== null ? allReels[expandedReelIndex] : null;
        await navigator.share({
          title: title,
          text: title + ' - Psikolog Furkan Manav Videoları',
          url: url || (reel?.youtubeId ? `https://youtube.com/shorts/${reel.youtubeId}` : window.location.href),
        });
      } catch (err) {
        console.log("Shared cancelled or failed", err);
      }
    } else {
      alert("Cihazınızın paylaşma özelliği desteklenmiyor, bağlantı kopyalandı!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const submitComment = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isAnonymous) return setAuthOpen(true);
    if (!newComment.trim()) return;

    const nComm: CommentType = {
      id: Date.now().toString(),
      user: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
      userId: user.uid,
      text: newComment,
      likes: 0,
      dislikes: 0,
      replies: []
    };

    setComments(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), nComm]
    }));
    setNewComment('');
  };

  const submitReply = (reelId: string, commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isAnonymous) return setAuthOpen(true);
    if (!replyText.trim()) return;

    setComments(prev => {
      const clone = { ...prev };
      const reelComms = clone[reelId] ? [...clone[reelId]] : [];
      const cIdx = reelComms.findIndex(c => c.id === commentId);
      if (cIdx >= 0) {
        reelComms[cIdx] = {
          ...reelComms[cIdx],
          replies: [...reelComms[cIdx].replies, {
            id: Date.now().toString(),
            user: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
            userId: user.uid,
            text: replyText
          }]
        };
      }
      clone[reelId] = reelComms;
      return clone;
    });

    setReplyText('');
    setReplyingTo(null);
  };

  const rateComment = (reelId: string, commentId: string, type: 'up' | 'down') => {
    setComments(prev => {
      const clone = { ...prev };
      const rC = clone[reelId] ? [...clone[reelId]] : [];
      const idx = rC.findIndex(c => c.id === commentId);
      if (idx >= 0) {
        rC[idx] = { ...rC[idx] };
        if (type === 'up') rC[idx].likes += 1;
        if (type === 'down') rC[idx].dislikes += 1;
      }
      clone[reelId] = rC;
      return clone;
    });
  };

  const deleteComment = (reelId: string, commentId: string) => {
    if (confirm('Bu yorumu silmek istediğinize emin misiniz?')) {
      setComments(prev => {
        const clone = { ...prev };
        clone[reelId] = (clone[reelId] || []).filter(c => c.id !== commentId);
        return clone;
      });
      toast.success('Yorum silindi.');
    }
  };

  const deleteReply = (reelId: string, commentId: string, replyId: string) => {
    if (confirm('Bu yanıtı silmek istediğinize emin misiniz?')) {
      setComments(prev => {
        const clone = { ...prev };
        const reelComms = clone[reelId] ? [...clone[reelId]] : [];
        const cIdx = reelComms.findIndex(c => c.id === commentId);
        if (cIdx >= 0) {
          reelComms[cIdx] = {
            ...reelComms[cIdx],
            replies: reelComms[cIdx].replies.filter(r => r.id !== replyId)
          };
        }
        clone[reelId] = reelComms;
        return clone;
      });
      toast.success('Yanıt silindi.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      
      {/* ─── HEADER ─── */}
      <div style={{ paddingTop: '130px', paddingBottom: '24px', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="container-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-gradient-to-tr from-gray-800 to-black shadow-md">
            <Film size={32} color="white" strokeWidth={2} />
          </div>
          
          <div className="gold-line" style={{ marginBottom: '20px' }} />
          
          <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--muted)', fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.6, maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            Psikoloji ve varoluş analizleri odaklı reels serisi. İncelemek için videolara tıklayın.
          </p>
        </div>
      </div>

      {/* ─── GRID ─── */}
      <div style={{ maxWidth: '1720px', margin: '0 auto', padding: '0 24px' }} className="pt-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
          
          {allReels.map((reel, index) => {
            const hasWatched = watchedVideos.includes(reel.id);
            const isLocal = !!YOUTUBE_SHORTS.find(r => r.id === reel.id);
            const thumbUrl = reel.youtubeId 
              ? `https://img.youtube.com/vi/${reel.youtubeId}/hqdefault.jpg`
              : `${reel.videoUrl}#t=0.5`;

            return (
              <div 
                key={reel.id} 
                onClick={() => setExpandedReelIndex(index)}
                className="bg-black rounded-xl overflow-hidden shadow-sm relative group cursor-pointer aspect-[9/16] transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl border border-gray-200"
              >
                {reel.youtubeId ? (
                  <img 
                    src={thumbUrl} 
                    alt={reel.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <video 
                    src={thumbUrl} 
                    preload="metadata" 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none" />

                <div className="absolute top-4 left-3 right-3 z-10 pointer-events-none">
                  <h2 className="text-white font-bold text-[14px] leading-tight drop-shadow-md">
                    {reel.title}
                  </h2>
                </div>

                {ADMIN_EMAILS.includes(user?.email || '') && (
                  <button 
                    onClick={(e) => deleteVideoDoc(reel.id, isLocal, e)}
                    className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-full z-20 shadow-lg transition-transform hover:scale-110"
                    title="Videoyu Sil"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                )}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                    <Play size={20} fill="white" color="white" className="ml-1"/>
                  </div>
                </div>

                {hasWatched && (
                  <div className="absolute bottom-3 right-3 bg-blue-600 border border-blue-400 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 opacity-90 z-10">
                    <CheckCircle size={12}/> İzledin
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── FULLSCREEN REEL & SIDE-BY-SIDE COMMENTS ─── */}
      {expandedReelIndex !== null && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center fade-in">
          
          <button 
            onClick={() => setExpandedReelIndex(null)}
            className="absolute top-6 left-6 z-[2100] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Symmetrical Dual-Pane Layout (Video Left, Comments Right) */}
          <div className="relative w-full h-full max-w-[1200px] md:h-[90vh] md:rounded-[20px] overflow-hidden flex flex-col md:flex-row bg-[#0a0a0a] border border-white/10 shadow-2xl">
            
            {/* Video Pane */}
            <div 
              className="flex-1 relative bg-black flex flex-col justify-center h-[50vh] md:h-full group"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
               {/* Transparent gesture overlay for mobile swipe navigation (over the iframe) */}
               <div className="absolute inset-0 z-10 md:hidden bg-transparent" />
               
               {allReels[expandedReelIndex].youtubeId ? (
                 <iframe
                   src={`https://www.youtube.com/embed/${allReels[expandedReelIndex].youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                   title={allReels[expandedReelIndex].title}
                   frameBorder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                   allowFullScreen
                   className="w-full h-full aspect-[9/16] max-h-full mx-auto"
                 ></iframe>
               ) : (
                 <video 
                    src={allReels[expandedReelIndex].videoUrl} 
                    autoPlay 
                    loop 
                    controls
                    playsInline
                    className="w-auto h-full max-w-full mx-auto object-contain"
                  />
               )}
                

                {/* Watch Badge */}
                <div className="absolute top-4 right-4 pointer-events-none bg-black/50 text-white/80 text-[12px] px-3 py-1 rounded-full backdrop-blur">
                  Daha önce izledin!
                </div>

                {/* TikTok/Reels Style Floating Vertical Actions on the right edge of the video */}
                <div className="absolute right-4 bottom-24 flex flex-col gap-5 z-20">
                    <button 
                      onClick={() => toggleLikeReel(allReels[expandedReelIndex!].id)}
                      className="flex flex-col items-center gap-1 group/btn"
                    >
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center flex-col transition-all group-hover/btn:scale-105 group-active/btn:scale-95 shadow-xl">
                        <Heart size={24} className={`transition-colors ${reactions[allReels[expandedReelIndex!].id] ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                      </div>
                      <span className="text-white text-[12px] font-bold drop-shadow-md text-shadow">{reactions[allReels[expandedReelIndex!].id] ? 1 : 0}</span>
                    </button>
                    
                    <button 
                       className="flex flex-col items-center gap-1 group/btn"
                       onClick={() => toggleDislikeReel(allReels[expandedReelIndex!].id)}
                    >
                      <div className={`w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center flex-col transition-all group-hover/btn:scale-105 active:scale-95 shadow-xl`}>
                         <ThumbsDown size={20} className={`transition-colors ${dislikes[allReels[expandedReelIndex!].id] ? 'text-red-500' : 'text-white'}`} />
                      </div>
                      <span className="text-white text-[12px] font-bold drop-shadow-md text-shadow">{dislikes[allReels[expandedReelIndex!].id] ? 1 : 0}</span>
                    </button>

                    <button 
                      onClick={() => handleShare(allReels[expandedReelIndex!].title, allReels[expandedReelIndex!].videoUrl)}
                      className="flex flex-col items-center gap-1 group/btn"
                    >
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center flex-col transition-all group-hover/btn:scale-105 group-active/btn:scale-95 shadow-xl">
                        <Share2 size={24} className="text-white" />
                      </div>
                      <span className="text-white text-[12px] font-bold drop-shadow-md text-shadow">Paylaş</span>
                    </button>
                </div>
            </div>

            {/* Interactions Pane (Right Sidebar with Comments) */}
            <div className="w-full md:w-[400px] h-[50vh] md:h-full flex flex-col border-l border-white/10 bg-[#121212]">
              
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                 <div className="text-white text-md font-bold flex items-center gap-2">
                    <MessageCircle size={20}/>
                    Yorumlar ({(comments[allReels[expandedReelIndex!].id] || []).length})
                 </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {(comments[allReels[expandedReelIndex!].id] || []).length === 0 ? (
                    <div className="text-center text-white/40 mt-16 font-medium text-sm">
                       Bu videoya henüz yorum yapılmamış.<br/>Sessizliği ilk bozan sen ol!
                    </div>
                ) : (
                  (comments[allReels[expandedReelIndex!].id] || []).map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <Link href={`/forum/profil/${encodeURIComponent(c.user)}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center font-bold text-white text-[12px] shrink-0 cursor-pointer hover:scale-110 transition-transform">
                          {c.user.charAt(0).toUpperCase()}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <div className="font-semibold text-[13px] text-white/80">
                          <Link href={`/forum/profil/${encodeURIComponent(c.user)}`} className="hover:text-white transition-colors cursor-pointer">
                            {c.user}
                          </Link>
                          <span className="text-white/30 font-normal ml-2 text-[11px]">Az önce</span>
                        </div>
                        <div className="text-white text-[14px] mt-1 leading-snug">{c.text}</div>
                        
                        {/* Rating & Reply Actions */}
                        <div className="flex items-center gap-4 mt-2">
                           <button onClick={() => rateComment(allReels[expandedReelIndex!].id, c.id, 'up')} className="text-white/40 hover:text-green-400 flex items-center gap-1 text-[11px]"><ThumbsUp size={12}/> {c.likes > 0 && c.likes}</button>
                           <button onClick={() => rateComment(allReels[expandedReelIndex!].id, c.id, 'down')} className="text-white/40 hover:text-red-400 flex items-center gap-1 text-[11px]"><ThumbsDown size={12}/> {c.dislikes > 0 && c.dislikes}</button>
                           <button 
                             onClick={() => setReplyingTo({ reelId: allReels[expandedReelIndex!].id, commentId: c.id })}
                             className="text-white/40 hover:text-white/80 text-[12px] font-medium transition-colors"
                           >
                             Yanıtla
                           </button>
                           {(user?.uid === c.userId || user?.email === 'pskfurkan.manav@gmail.com') && (
                             <button 
                               onClick={() => deleteComment(allReels[expandedReelIndex!].id, c.id)}
                               className="text-red-500/70 hover:text-red-500 text-[11px] font-bold transition-colors ml-auto"
                             >
                               SİL
                             </button>
                           )}
                        </div>

                        {/* Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="mt-3 pl-3 border-l-2 border-white/10 space-y-3">
                            {c.replies.map(rep => (
                              <div key={rep.id} className="flex gap-2 relative group">
                                <Link href={`/forum/profil/${encodeURIComponent(rep.user)}`}>
                                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-[10px] shrink-0 cursor-pointer hover:bg-white/30 transition-colors">
                                    {rep.user.charAt(0).toUpperCase()}
                                  </div>
                                </Link>
                                <div className="flex-1">
                                  <div className="font-semibold text-[12px] text-white/80">
                                    <Link href={`/forum/profil/${encodeURIComponent(rep.user)}`} className="hover:text-white transition-colors cursor-pointer">
                                      {rep.user}
                                    </Link>
                                  </div>
                                  <div className="text-white/90 text-[13px] leading-snug">{rep.text}</div>
                                  {(user?.uid === rep.userId || user?.email === 'pskfurkan.manav@gmail.com') && (
                                    <button 
                                      onClick={() => deleteReply(allReels[expandedReelIndex!].id, c.id, rep.id)}
                                      className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 text-red-500 text-[10px] font-bold"
                                    >
                                      SİL
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input block */}
                        {replyingTo?.commentId === c.id && (
                          <form onSubmit={(e) => submitReply(allReels[expandedReelIndex!].id, c.id, e)} className="mt-2 flex items-center gap-2">
                             <input 
                               type="text" 
                               value={replyText} 
                               onChange={e => setReplyText(e.target.value)} 
                               placeholder="Yanıt ekle..." 
                               autoFocus
                               className="flex-1 bg-white/5 border border-white/10 rounded-full py-1.5 px-3 text-[12px] text-white outline-none"
                             />
                             <button type="submit" className="text-blue-400 text-[12px] font-bold">Gönder</button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Main Comment Input */}
              <div className="p-4 border-t border-white/5 bg-black/40">
                <form onSubmit={(e) => submitComment(allReels[expandedReelIndex!].id, e)} className="relative flex items-center">
                  <input 
                    type="text" 
                    placeholder={user && !user.isAnonymous ? "Ne düşünüyorsun?" : "Yorum yapmak için giriş yap..."}
                    className="w-full bg-white/10 border border-white/10 rounded-[20px] py-3 pl-4 pr-12 text-[14px] text-white placeholder-white/40 outline-none focus:bg-white/15 focus:border-white/20"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onClick={() => { if(!user || user.isAnonymous) setAuthOpen(true); }}
                  />
                  <button 
                    type="submit" 
                    disabled={!newComment.trim() || !user || user.isAnonymous}
                    className="absolute right-2 top-2 bottom-2 w-9 rounded-full bg-white flex items-center justify-center text-black disabled:bg-white/20 disabled:text-white/40 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── CTA: YAZILARIMA GÖZ ATIN ─── */}
      <div style={{ background: 'white', borderTop: '1px solid rgba(0,0,0,0.05)', padding: '64px 24px', textAlign: 'center', marginTop: '16px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: '12px' }}>
            Derinlemesine Analizler
          </span>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px' }}>
            Düşüncelerim ve Makalelerim
          </h3>
          <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--muted)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '28px' }}>
            İnsan psikolojisi, psikanaliz ve varoluşsal sorgulamalara dair kaleme aldığım makalelerime de göz atabilirsiniz.
          </p>
          <Link href="/yazilarim" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--navy)', color: 'white', fontWeight: 600, padding: '12px 28px', borderRadius: '30px', transition: 'all 0.3s ease', textDecoration: 'none', border: '1px solid var(--navy)', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--navy)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.color = 'white'; }}>
             Yazılarıma Göz Atın <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Required for "Üye olunmalı" restriction */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

    </div>
  );
}
