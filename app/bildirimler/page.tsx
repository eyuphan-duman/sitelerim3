'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, MessageCircle, Heart, ArrowLeft, Home, Search, Users, 
  Bookmark, Hash, TrendingUp, Sparkles, CheckCheck, Repeat2, 
  Clock, ArrowRight, User, Sun, Moon, Plus 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'comment' | 'reaction' | 'mention' | 'repost';
  fromUid?: string;
  fromUser: string;
  fromUsername: string;
  fromPhotoURL?: string;
  postId: string;
  postTitle?: string;
  message: string;
  read: boolean;
  createdAt: any;
}

const CATEGORIES = [
  'Psikanaliz',
  'Varoluş & Anlam',
  'Kaygı & Depresyon',
  'İlişkiler',
  'Çocukluk & Travma',
  'Rüyalar',
  'Kimlik & Benlik',
  'Kişisel Gelişim'
];

function formatTimeAgo(val: any): string {
  if (!val) return 'az önce';
  try {
    let d: Date;
    if (val instanceof Date) d = val;
    else if (typeof val?.toDate === 'function') d = val.toDate();
    else if (typeof val === 'number' || typeof val === 'string') d = new Date(val);
    else if (val?.seconds) d = new Date(val.seconds * 1000);
    else return 'az önce';
    if (isNaN(d.getTime())) return 'az önce';

    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return 'az önce';
  }
}

export default function BildirimlerPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'comment' | 'reaction' | 'repost'>('all');
  const [trends, setTrends] = useState<{ tag: string; count: number }[]>([]);
  const [searchVal, setSearchVal] = useState('');

  // Dark Mode State with localStorage persistence
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('forum_theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDark(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'forum_theme') {
        setIsDark(e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleDarkMode = () => {
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem('forum_theme', next ? 'dark' : 'light');
      } catch (e) {}
      return next;
    });
  };

  const skipSplashAndGo = (href: string) => {
    try {
      sessionStorage.setItem('forum_skip_splash', 'true');
      sessionStorage.setItem('forum_splash_shown', '1');
    } catch (e) {}
    router.push(href);
  };

  const myUsername = userProfile?.username || (user?.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici';

  // Dynamic trending hashtags from forum
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'forum'), snap => {
      const tagCounts: Record<string, { tag: string; count: number }> = {};
      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        if (d.body) {
          const matches = d.body.match(/#([a-zA-Z0-9ğıüşöçİĞÜŞÖÇ_]+)/g);
          if (matches) {
            const set = new Set(matches.map((m: string) => m.trim()));
            set.forEach((rawTag: any) => {
              const clean = rawTag.startsWith('#') ? rawTag.slice(1) : rawTag;
              if (!clean) return;
              const key = clean.toLocaleLowerCase('tr-TR');
              if (!tagCounts[key]) tagCounts[key] = { tag: clean, count: 0 };
              tagCounts[key].count += 1;
            });
          }
        }
      });
      CATEGORIES.forEach(c => {
        const clean = c.replace(/[\s&]+/g, '');
        const key = clean.toLocaleLowerCase('tr-TR');
        const catCount = snap.docs.filter(d => d.data().category === c).length;
        if (!tagCounts[key]) tagCounts[key] = { tag: clean, count: catCount || 1 };
        else tagCounts[key].count += catCount;
      });
      setTrends(Object.values(tagCounts).sort((a, b) => b.count - a.count).slice(0, 5));
    });
    return () => unsub();
  }, []);

  // Firestore query: only filter by toUid to prevent missing composite index error
  useEffect(() => {
    if (!user || user.isAnonymous) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        // Sort in memory by createdAt descending
        list.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return tB - tA;
        });
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.error('Bildirimler onSnapshot error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('markAllRead error:', e);
    }
  };

  const markRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error('markRead error:', e);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await markRead(n.id);
    }
    skipSplashAndGo(n.postId ? `/forum?thread=${encodeURIComponent(n.postId)}` : '/forum');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      skipSplashAndGo(`/forum?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'comment') return n.type === 'comment' || n.type === 'mention';
    if (filterType === 'reaction') return n.type === 'reaction';
    if (filterType === 'repost') return n.type === 'repost';
    return true;
  });

  const iconFor = (type: string) => {
    if (type === 'reaction') {
      return (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={14} fill="#ef4444" />
        </div>
      );
    }
    if (type === 'repost') {
      return (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDark ? 'rgba(34,197,94,0.2)' : '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Repeat2 size={14} />
        </div>
      );
    }
    if (type === 'mention') {
      return (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
          @
        </div>
      );
    }
    return (
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDark ? 'rgba(56,189,248,0.2)' : '#dbeafe', color: isDark ? '#38bdf8' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MessageCircle size={14} />
      </div>
    );
  };

  return (
    <div 
      data-forum-page="true" 
      data-forum-dark={isDark ? 'true' : 'false'} 
      className={isDark ? 'forum-dark' : ''} 
      style={{ minHeight: '100vh', background: isDark ? '#000000' : '#f8fafc', color: isDark ? '#e7e9ea' : '#0f172a', transition: 'background-color 0.2s ease' }}
    >
      <style>{`
        @media (max-width: 1024px) {
          .forum-sidebar-right { display: none !important; }
          .forum-grid-3col { grid-template-columns: 240px 1fr !important; }
        }
        @media (max-width: 768px) {
          .forum-sidebar-left { display: none !important; }
          .forum-grid-3col { grid-template-columns: 1fr !important; padding-top: 0 !important; }
        }
        .notif-card:hover {
          background: ${isDark ? '#0a0a0a' : '#f1f5f9'} !important;
        }
      `}</style>

      {/* 3-COLUMN FORUM LAYOUT */}
      <div className="forum-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 0, paddingTop: 0 }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="forum-sidebar-left" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderRight: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, background: isDark ? '#000000' : 'transparent' }}>
          <div style={{ padding: '0 8px 16px', marginBottom: 8 }}>
            <Link href="/" style={{ textDecoration: 'none' }} title="Ana Sayfaya Dön">
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.45rem', fontWeight: 900, color: isDark ? '#e7e9ea' : '#0f172a', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                MANAV FORUM
                <span style={{ fontSize: '0.58rem', background: isDark ? '#1d9bf0' : '#0f172a', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>v2.0</span>
              </h1>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <p style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#94a3b8', margin: 0 }}>Psikoloji Topluluğu</p>
              <Link href="/" style={{ fontSize: '0.74rem', color: isDark ? '#38bdf8' : '#2563eb', textDecoration: 'none', fontWeight: 700 }}>
                ← Ana Site
              </Link>
            </div>
          </div>

          {[
            { label: 'Ana Akış', action: () => skipSplashAndGo('/forum'), active: false, icon: <Home size={20} /> },
            { label: 'Takip Ettiklerim', action: () => skipSplashAndGo('/forum?feed=following'), active: false, icon: <Users size={20} /> },
            { label: 'Yer İşaretleri', action: () => skipSplashAndGo(user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername)}?tab=bookmarks` : '/forum'), active: false, icon: <Bookmark size={20} /> },
            { label: 'Arama', action: () => skipSplashAndGo('/forum?search=open'), active: false, icon: <Search size={20} /> },
            { label: 'Beğenilenler', action: () => skipSplashAndGo(user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername)}?tab=likes` : '/forum'), active: false, icon: <Heart size={20} /> },
            { label: 'Bildirimler', action: () => {}, active: true, icon: <Bell size={20} />, badge: unreadCount },
            { 
              label: isDark ? 'Açık Mod' : 'Karanlık Mod', 
              action: toggleDarkMode, 
              active: false, 
              icon: isDark ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} /> 
            },
            { 
              label: 'Profilim', 
              action: () => skipSplashAndGo(user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername)}` : '/forum'), 
              active: false, 
              icon: <div style={{ width: 22, height: 22, borderRadius: '50%', background: isDark ? '#1d9bf0' : '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{(userProfile?.displayName || user?.displayName || 'U')[0]}</div> 
            },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%', background: item.active ? (isDark ? '#e7e9ea' : '#0f172a') : 'transparent', color: item.active ? (isDark ? '#000000' : 'white') : (isDark ? '#e7e9ea' : '#475569'), fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span style={{ background: '#ef4444', color: 'white', fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{item.badge}</span>
              ) : null}
            </button>
          ))}

          <div style={{ margin: '16px 0 8px', padding: '0 8px', fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#71767b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kategoriler</div>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => skipSplashAndGo(`/forum?cat=${encodeURIComponent(c)}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: isDark ? '#71767b' : '#64748b', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s', width: '100%', textAlign: 'left' }}>
              <Hash size={14} /> {c}
            </button>
          ))}

          {user && !user.isAnonymous && (
            <div onClick={() => skipSplashAndGo(`/forum/profil/${encodeURIComponent(myUsername)}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', marginTop: 'auto', background: isDark ? '#16181c' : '#f8fafc', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
                {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile?.displayName || user.displayName}</div>
                <div style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.8rem' }}>@{myUsername}</div>
              </div>
            </div>
          )}
        </aside>

        {/* ── CENTER COLUMN ── */}
        <main style={{ borderRight: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, minHeight: '100vh', background: isDark ? '#000000' : 'white', paddingBottom: 80, boxSizing: 'border-box' }}>
          {/* Top Header */}
          <div style={{ position: 'sticky', top: 0, background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, zIndex: 20, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                onClick={() => skipSplashAndGo('/forum')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isDark ? '#16181c' : '#f1f5f9',
                  color: isDark ? '#e7e9ea' : '#0f172a',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                title="Foruma Dön"
                aria-label="Foruma Dön"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                  Bildirimler
                </h1>
                <p style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#64748b', margin: '2px 0 0' }}>
                  {unreadCount > 0 ? `${unreadCount} yeni bildirim` : 'Tüm bildirimleriniz güncel'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Dark mode button in header */}
              <button
                type="button"
                onClick={toggleDarkMode}
                style={{
                  background: isDark ? '#16181c' : '#f1f5f9',
                  border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
                  borderRadius: 999,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isDark ? '#fbbf24' : '#475569',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                title={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
                aria-label="Karanlık Mod Değiştir"
              >
                {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: isDark ? '#16181c' : '#f1f5f9',
                    color: isDark ? '#e7e9ea' : '#0f172a',
                    border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <CheckCheck size={15} color={isDark ? '#38bdf8' : '#2563eb'} />
                  <span>Tümünü Okundu İşaretle</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub Tabs Filter */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, background: isDark ? '#000000' : 'white' }}>
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'comment', label: 'Yorumlar' },
              { id: 'reaction', label: 'Beğeniler' },
              { id: 'repost', label: 'Paylaşımlar' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '14px 10px',
                  border: 'none',
                  background: 'transparent',
                  color: filterType === tab.id ? (isDark ? '#e7e9ea' : '#0f172a') : (isDark ? '#71767b' : '#64748b'),
                  fontWeight: filterType === tab.id ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderBottom: filterType === tab.id ? `2px solid ${isDark ? '#e7e9ea' : '#0f172a'}` : '2px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: isDark ? '#71767b' : '#94a3b8' }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, borderTopColor: isDark ? '#e7e9ea' : '#0f172a', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>Bildirimler yükleniyor...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Not Logged In State */}
          {!loading && (!user || user.isAnonymous) && (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: isDark ? '#71767b' : '#64748b' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: isDark ? '#16181c' : '#f1f5f9', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: isDark ? '#e7e9ea' : '#0f172a' }}>
                <Bell size={28} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', marginBottom: 8 }}>Bildirimleri görmek için giriş yapın</h2>
              <p style={{ fontSize: '0.9rem', color: isDark ? '#71767b' : '#64748b', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.5 }}>
                Gönderilerinize gelen yanıtları, beğenileri ve etkileşimleri takip edebilmek için foruma giriş yapmalısınız.
              </p>
              <button
                type="button"
                onClick={() => skipSplashAndGo('/forum')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isDark ? '#ffffff' : '#0f172a',
                  color: isDark ? '#000000' : 'white',
                  padding: '12px 24px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                Foruma Giriş Yap <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Empty Notifications List */}
          {!loading && user && !user.isAnonymous && filteredNotifications.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: isDark ? '#71767b' : '#64748b' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: isDark ? '#16181c' : '#f8fafc', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: isDark ? '#71767b' : '#94a3b8' }}>
                <Bell size={28} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', marginBottom: 8 }}>
                {filterType === 'all' ? 'Henüz bildiriminiz yok' : 'Bu kategoride bildirim bulunamadı'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: isDark ? '#71767b' : '#64748b', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.5 }}>
                Forumda paylaşımlarınıza gelen yanıtlar ve hareketler burada listelenecektir.
              </p>
              <button
                type="button"
                onClick={() => skipSplashAndGo('/forum')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isDark ? '#16181c' : '#f1f5f9',
                  color: isDark ? '#e7e9ea' : '#0f172a',
                  border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
                  padding: '10px 20px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}
              >
                Ana Akışa Göz At <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Notifications List */}
          {!loading && user && !user.isAnonymous && filteredNotifications.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredNotifications.map(n => (
                <div
                  key={n.id}
                  className="notif-card"
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '18px 20px',
                    borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`,
                    background: n.read ? (isDark ? '#000000' : '#ffffff') : (isDark ? 'rgba(29, 155, 240, 0.08)' : '#f0f7ff'),
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {/* Left: Avatar with type icon badge */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', overflow: 'hidden' }}>
                      {n.fromPhotoURL ? (
                        <img src={n.fromPhotoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (n.fromUser || 'K')[0].toUpperCase()
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
                      {iconFor(n.type)}
                    </div>
                  </div>

                  {/* Center: Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.95rem' }}>{n.fromUser}</span>
                        <span style={{ color: isDark ? '#71767b' : '#64748b', fontSize: '0.85rem' }}>@{n.fromUsername}</span>
                        <span style={{ color: isDark ? '#d1d5db' : '#334155', fontSize: '0.9rem' }}>{n.message}</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#94a3b8', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Post Excerpt Snippet */}
                    {n.postTitle && (
                      <div style={{ marginTop: 8, padding: '10px 14px', background: isDark ? '#16181c' : '#f8fafc', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, borderRadius: 10, fontSize: '0.88rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.4 }}>
                        &quot;{n.postTitle}&quot;
                      </div>
                    )}
                  </div>

                  {/* Right: Unread Indicator Dot */}
                  {!n.read && (
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: isDark ? '#38bdf8' : '#2563eb', flexShrink: 0, marginTop: 8, boxShadow: isDark ? '0 0 8px rgba(56,189,248,0.5)' : 'none' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="forum-sidebar-right" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, background: isDark ? '#000000' : 'transparent' }}>
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isDark ? '#16181c' : '#f1f5f9', borderRadius: 12, padding: '12px 16px', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
            <Search size={17} color={isDark ? '#71767b' : '#94a3b8'} />
            <input 
              value={searchVal} 
              onChange={e => setSearchVal(e.target.value)} 
              placeholder="Forumda ara..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: isDark ? '#e7e9ea' : '#0f172a', width: '100%' }} 
            />
          </form>

          {/* Gündem */}
          <div style={{ background: isDark ? '#16181c' : '#f8fafc', borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
              <TrendingUp size={18} color={isDark ? '#71767b' : '#64748b'} />
              <h3 style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '1rem', margin: 0 }}>Gündemdekiler</h3>
            </div>
            {trends.map(({ tag, count }) => (
              <div 
                key={tag} 
                onClick={() => skipSplashAndGo(`/forum?tag=${encodeURIComponent(tag)}`)}
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '13px 18px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, cursor: 'pointer', transition: 'background 0.15s' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: isDark ? '#71767b' : '#94a3b8', marginBottom: 2 }}>Gündemdekiler · Türkiye</div>
                    <div style={{ fontWeight: 700, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.92rem' }}>#{tag}</div>
                    <div style={{ fontSize: '0.74rem', color: isDark ? '#71767b' : '#64748b', marginTop: 2 }}>{count} gönderi</div>
                  </div>
                  <span style={{ background: isDark ? 'rgba(56,189,248,0.15)' : '#eff6ff', color: isDark ? '#38bdf8' : '#1d4ed8', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: isDark ? '1px solid rgba(56,189,248,0.3)' : 'none' }}>#{tag}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Topluluk Info Card */}
          <div style={{ background: isDark ? '#16181c' : 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', border: isDark ? '1px solid #2f3336' : 'none' }}>
            <Sparkles size={28} color={isDark ? '#fbbf24' : '#d97706'} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontWeight: 800, color: 'white', fontSize: '1rem', marginBottom: 8 }}>Psikoloji Topluluğu</h3>
            <p style={{ color: isDark ? '#94a3b8' : '#94a3b8', fontSize: '0.82rem', marginBottom: 16, lineHeight: 1.5 }}>
              Düşüncelerinizi paylaşın, psikoloji başlıklarında sorular sorun ve uzmanlarla tartışın.
            </p>
            <button
              type="button"
              onClick={() => skipSplashAndGo('/forum')}
              style={{
                display: 'block',
                width: '100%',
                background: isDark ? '#ffffff' : 'white',
                color: isDark ? '#000000' : '#0f172a',
                padding: '10px 22px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
              }}
            >
              Ana Akışa Git
            </button>
          </div>
        </aside>
      </div>

      {/* ─── THREADS-STYLE FLOATING BOTTOM DOCK (MOBILE ONLY) ─── */}
      <nav className="forum-floating-dock" aria-label="Mobil Forum Navigasyonu">
        {/* 1. Home button */}
        <button
          type="button"
          onClick={() => skipSplashAndGo('/forum')}
          className="dock-btn"
          aria-label="Ana Akış"
        >
          <Home size={24} strokeWidth={1.9} />
        </button>

        {/* 2. Search button */}
        <button
          type="button"
          onClick={() => skipSplashAndGo('/forum?search=open')}
          className="dock-btn"
          aria-label="Arama"
        >
          <Search size={24} strokeWidth={1.9} />
        </button>

        {/* 3. Center Create (+) button (Threads style prominent pill) */}
        <button
          type="button"
          onClick={() => skipSplashAndGo('/forum?compose=open')}
          className="dock-create-btn"
          aria-label="Yeni Gönderi Paylaş"
        >
          <Plus size={22} strokeWidth={2.6} />
        </button>

        {/* 4. Heart / Activity button (ACTIVE on Bildirimler) */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="dock-btn active"
          aria-label="Bildirimler"
          style={{ position: 'relative' }}
        >
          <Heart size={24} strokeWidth={2.4} fill={isDark ? '#ffffff' : '#0f172a'} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ef4444',
            }} />
          )}
        </button>

        {/* 5. User Profile button */}
        <button
          type="button"
          onClick={() => {
            if (!user || user.isAnonymous) {
              skipSplashAndGo('/forum');
            } else {
              skipSplashAndGo(`/forum/profil/${encodeURIComponent(myUsername || user.uid)}`);
            }
          }}
          className="dock-btn"
          aria-label="Profilim"
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isDark ? '#2f3336' : '#0f172a',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#ffffff',
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.3)'}`,
          }}>
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : user && !user.isAnonymous ? (
              (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()
            ) : (
              <User size={15} color="white" />
            )}
          </div>
        </button>
      </nav>
    </div>
  );
}
