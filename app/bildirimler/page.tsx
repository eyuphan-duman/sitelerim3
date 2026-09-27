'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, MessageCircle, Heart, ArrowLeft, Home, Search, Users, 
  Bookmark, Hash, TrendingUp, Sparkles, CheckCheck, Repeat2, 
  Clock, ArrowRight, User 
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
    if (n.postId) {
      router.push(`/forum?thread=${encodeURIComponent(n.postId)}`);
    } else {
      router.push('/forum');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/forum?search=${encodeURIComponent(searchVal.trim())}`);
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
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={14} fill="#ef4444" />
        </div>
      );
    }
    if (type === 'repost') {
      return (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Repeat2 size={14} />
        </div>
      );
    }
    if (type === 'mention') {
      return (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
          @
        </div>
      );
    }
    return (
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MessageCircle size={14} />
      </div>
    );
  };

  return (
    <div data-forum-page="true" style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <style>{`
        @media (max-width: 1024px) {
          .forum-sidebar-right { display: none !important; }
          .forum-grid-3col { grid-template-columns: 240px 1fr !important; }
        }
        @media (max-width: 768px) {
          .forum-sidebar-left { display: none !important; }
          .forum-grid-3col { grid-template-columns: 1fr !important; padding-top: 56px !important; }
          .forum-mobile-bottom-nav { display: grid !important; }
        }
        .notif-card:hover {
          background: #f1f5f9 !important;
        }
      `}</style>

      {/* 3-COLUMN FORUM LAYOUT */}
      <div className="forum-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 0, paddingTop: 72 }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="forum-sidebar-left" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid #e2e8f0' }}>
          <div style={{ padding: '0 8px 16px', marginBottom: 8 }}>
            <Link href="/forum" style={{ textDecoration: 'none' }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                Topluluk
                <span style={{ fontSize: '0.6rem', background: '#0f172a', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>v2.0</span>
              </h1>
            </Link>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>Psikoloji forumu</p>
          </div>

          {[
            { label: 'Ana Akış', href: '/forum', active: false, icon: <Home size={20} /> },
            { label: 'Takip Ettiklerim', href: '/forum?feed=following', active: false, icon: <Users size={20} /> },
            { label: 'Yer İşaretleri', href: user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername)}?tab=bookmarks` : '/forum', active: false, icon: <Bookmark size={20} /> },
            { label: 'Arama', href: '/forum?search=open', active: false, icon: <Search size={20} /> },
            { label: 'Beğenilenler', href: user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername)}?tab=likes` : '/forum', active: false, icon: <Heart size={20} /> },
            { label: 'Bildirimler', href: '/bildirimler', active: true, icon: <Bell size={20} />, badge: unreadCount },
            { 
              label: 'Profilim', 
              href: user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername)}` : '/forum', 
              active: false, 
              icon: <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{(userProfile?.displayName || user?.displayName || 'U')[0]}</div> 
            },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 12, background: item.active ? '#0f172a' : 'transparent', color: item.active ? 'white' : '#475569', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span style={{ background: '#ef4444', color: 'white', fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{item.badge}</span>
                ) : null}
              </div>
            </Link>
          ))}

          <div style={{ margin: '16px 0 8px', padding: '0 8px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kategoriler</div>
          {CATEGORIES.map(c => (
            <Link key={c} href={`/forum?cat=${encodeURIComponent(c)}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, color: '#64748b', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s' }}>
                <Hash size={14} /> {c}
              </div>
            </Link>
          ))}

          {user && !user.isAnonymous && (
            <Link href={`/forum/profil/${encodeURIComponent(myUsername)}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, textDecoration: 'none', marginTop: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
                {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile?.displayName || user.displayName}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>@{myUsername}</div>
              </div>
            </Link>
          )}
        </aside>

        {/* ── CENTER COLUMN ── */}
        <main style={{ borderRight: '1px solid #e2e8f0', minHeight: 'calc(100vh - 72px)', background: 'white', paddingBottom: 80 }}>
          {/* Top Header */}
          <div style={{ position: 'sticky', top: 72, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', zIndex: 20, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link href="/forum" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', transition: 'background 0.15s' }}>
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                  Bildirimler
                </h1>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                  {unreadCount > 0 ? `${unreadCount} yeni bildirim` : 'Tüm bildirimleriniz güncel'}
                </p>
              </div>
            </div>

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
                  background: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <CheckCheck size={15} color="#2563eb" />
                <span>Tümünü Okundu İşaretle</span>
              </button>
            )}
          </div>

          {/* Sub Tabs Filter */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
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
                  color: filterType === tab.id ? '#0f172a' : '#64748b',
                  fontWeight: filterType === tab.id ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderBottom: filterType === tab.id ? '2px solid #0f172a' : '2px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>Bildirimler yükleniyor...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Not Logged In State */}
          {!loading && (!user || user.isAnonymous) && (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: '#64748b' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#0f172a' }}>
                <Bell size={28} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Bildirimleri görmek için giriş yapın</h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.5 }}>
                Gönderilerinize gelen yanıtları, beğenileri ve etkileşimleri takip edebilmek için foruma giriş yapmalısınız.
              </p>
              <Link
                href="/forum"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0f172a',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                Foruma Giriş Yap <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Empty Notifications List */}
          {!loading && user && !user.isAnonymous && filteredNotifications.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: '#64748b' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#94a3b8' }}>
                <Bell size={28} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                {filterType === 'all' ? 'Henüz bildiriminiz yok' : 'Bu kategoride bildirim bulunamadı'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.5 }}>
                Forumda paylaşımlarınıza gelen yanıtlar ve hareketler burada listelenecektir.
              </p>
              <Link
                href="/forum"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f1f5f9',
                  color: '#0f172a',
                  padding: '10px 20px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}
              >
                Ana Akışa Göz At <ArrowRight size={15} />
              </Link>
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
                    borderBottom: '1px solid #f1f5f9',
                    background: n.read ? '#ffffff' : '#f0f7ff',
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
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{n.fromUser}</span>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>@{n.fromUsername}</span>
                        <span style={{ color: '#334155', fontSize: '0.9rem' }}>{n.message}</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Post Excerpt Snippet */}
                    {n.postTitle && (
                      <div style={{ marginTop: 8, padding: '10px 14px', background: n.read ? '#f8fafc' : '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.88rem', color: '#475569', lineHeight: 1.4 }}>
                        &quot;{n.postTitle}&quot;
                      </div>
                    )}
                  </div>

                  {/* Right: Unread Indicator Dot */}
                  {!n.read && (
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 8 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="forum-sidebar-right" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f1f5f9', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
            <Search size={17} color="#94a3b8" />
            <input 
              value={searchVal} 
              onChange={e => setSearchVal(e.target.value)} 
              placeholder="Forumda ara..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: '#0f172a', width: '100%' }} 
            />
          </form>

          {/* Gündem */}
          <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
              <TrendingUp size={18} color="#64748b" />
              <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>Gündemdekiler</h3>
            </div>
            {trends.map(({ tag, count }) => (
              <Link 
                key={tag} 
                href={`/forum?tag=${encodeURIComponent(tag)}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '13px 18px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>Gündemdekiler · Türkiye</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>#{tag}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{count} gönderi</div>
                  </div>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>#{tag}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Topluluk Info Card */}
          <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
            <Sparkles size={28} color="#d97706" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontWeight: 800, color: 'white', fontSize: '1rem', marginBottom: 8 }}>Psikoloji Topluluğu</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 16, lineHeight: 1.5 }}>
              Düşüncelerinizi paylaşın, psikoloji başlıklarında sorular sorun ve uzmanlarla tartışın.
            </p>
            <Link
              href="/forum"
              style={{
                display: 'block',
                background: 'white',
                color: '#0f172a',
                padding: '10px 22px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none'
              }}
            >
              Ana Akışa Git
            </Link>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation Bar (Symmetric 4-Item Grid) */}
      <nav className="forum-mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid #e2e8f0',
        zIndex: 2100,
        gridTemplateColumns: 'repeat(4, 1fr)',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 16px rgba(15,23,42,0.06)',
      }}>
        {/* 1. Home */}
        <Link
          href="/forum"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            height: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'color 0.15s ease',
            padding: 0,
            textDecoration: 'none'
          }}
        >
          <Home size={22} strokeWidth={1.9} />
          <span style={{ fontSize: '0.68rem', fontWeight: 500 }}>Anasayfa</span>
        </Link>

        {/* 2. Search */}
        <Link
          href="/forum?search=open"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            height: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'color 0.15s ease',
            padding: 0,
            textDecoration: 'none'
          }}
        >
          <Search size={22} strokeWidth={1.9} />
          <span style={{ fontSize: '0.68rem', fontWeight: 500 }}>Ara</span>
        </Link>

        {/* 3. Notifications (Active) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            height: '100%',
            color: '#0f172a',
            padding: 0,
            position: 'relative'
          }}
        >
          <span style={{ position: 'absolute', top: 0, width: 24, height: 3, background: '#0f172a', borderRadius: '0 0 4px 4px' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={22} strokeWidth={2.4} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -6, background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 800, minWidth: 16, height: 16, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>Bildirim</span>
        </div>

        {/* 4. Profile */}
        <Link
          href={user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername || user.uid)}` : '#'}
          onClick={(e) => {
            if (!user || user.isAnonymous) {
              e.preventDefault();
              router.push('/forum');
            } else {
              const target = myUsername || user.uid;
              if (target) {
                e.preventDefault();
                router.push(`/forum/profil/${encodeURIComponent(target)}`);
              }
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            height: '100%',
            color: '#64748b',
            textDecoration: 'none',
            padding: 0,
            transition: 'color 0.15s ease'
          }}
        >
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, overflow: 'hidden' }}>
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : user && !user.isAnonymous ? (
              (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()
            ) : (
              <User size={13} color="white" />
            )}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 500 }}>Profilim</span>
        </Link>
      </nav>
    </div>
  );
}
