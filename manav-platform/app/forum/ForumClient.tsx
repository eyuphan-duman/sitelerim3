'use client';
import React, { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, orderBy, query, updateDoc, doc, increment, onSnapshot, deleteDoc, deleteField, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import ForumPost from '@/components/forum/ForumPost';
import ForumModal from '@/components/forum/ForumModal';
import { Search, TrendingUp, Hash, Bell, Users, Home, X, PenSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface Post {
  id: string; title?: string; body: string; category: string;
  authorName: string; authorUsername?: string; uid: string;
  commentCount: number; createdAt: Date; reactionsData?: Record<string, string>;
  authorPhotoURL?: string;
}
interface Comment {
  id: string; authorName: string; authorUsername?: string;
  text: string; createdAt: Date; reactionsData?: Record<string, string>; uid: string;
  authorPhotoURL?: string;
}

const CATEGORIES = ['Tümü','Psikanaliz','Varoluş & Anlam','Kaygı & Depresyon','İlişkiler','Çocukluk & Travma','Rüyalar','Kimlik & Benlik','Kişisel Gelişim'];
const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

export default function ForumClient() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [threads, setThreads] = useState<Post[]>([]);
  const [filter, setFilter] = useState('Tümü');
  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all');
  const [followingUids, setFollowingUids] = useState<string[]>([]);
  const [form, setForm] = useState({ body: '', cat: 'Psikanaliz' });
  const [posting, setPosting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => { return onSnapshot(collection(db, 'users'), snap => { const m: Record<string, any> = {}; snap.docs.forEach(d => m[d.id] = d.data()); setUsersMap(m); }); }, []);
  useEffect(() => { const q = query(collection(db, 'forum'), orderBy('createdAt', 'desc')); return onSnapshot(q, snap => { setThreads(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[]); }); }, []);
  useEffect(() => { if (!user || user.isAnonymous) return; const q = query(collection(db, 'notifications'), where('toUid', '==', user.uid), where('read', '==', false)); return onSnapshot(q, snap => setUnreadCount(snap.size)); }, [user]);
  useEffect(() => { if (!user || user.isAnonymous) return; const q = query(collection(db, 'follows'), where('followerId', '==', user.uid)); return onSnapshot(q, snap => setFollowingUids(snap.docs.map(d => d.data().followingId))); }, [user]);

  const filtered = (() => {
    let list = filter === 'Tümü' ? threads : threads.filter(t => t.category === filter);
    if (feedTab === 'following') list = list.filter(t => followingUids.includes(t.uid));
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); list = list.filter(t => t.body.toLowerCase().includes(q) || t.authorName.toLowerCase().includes(q)); }
    return list;
  })();

  const catCounts = threads.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {} as Record<string, number>);
  const trends = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const handlePost = async () => {
    if (!user || !form.body.trim()) return toast.error('Yazı boş olamaz.');
    if (user.isAnonymous) return setAuthOpen(true);
    setPosting(true);
    try {
      await addDoc(collection(db, 'forum'), { body: form.body, category: form.cat, authorName: userProfile?.displayName || user.displayName || 'Kullanıcı', authorUsername: userProfile?.username || user.displayName?.toLowerCase().replace(/\s+/g, '') || 'kullanici', uid: user.uid, commentCount: 0, createdAt: serverTimestamp(), reactionsData: {} });
      setForm({ body: '', cat: 'Psikanaliz' }); toast.success('Paylaşıldı!');
    } catch { toast.error('Hata oluştu.'); } finally { setPosting(false); }
  };

  const handleReact = async (e: React.MouseEvent, thread: Post, emoji: string) => {
    e.stopPropagation();
    if (!user || user.isAnonymous) return toast.error('Tepki için giriş gerekli.');
    const current = thread.reactionsData?.[user.uid];
    if (current === emoji) { await updateDoc(doc(db, 'forum', thread.id), { [`reactionsData.${user.uid}`]: deleteField() }); }
    else { await updateDoc(doc(db, 'forum', thread.id), { [`reactionsData.${user.uid}`]: emoji }); }
  };

  const openThread = (t: Post) => {
    setActiveThread(t);
    router.replace(`/forum?thread=${t.id}`, { scroll: false });
    onSnapshot(query(collection(db, 'forum', t.id, 'comments'), orderBy('createdAt', 'asc')), snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Comment[]);
    });
  };

  const closeThread = () => {
    setActiveThread(null);
    router.replace('/forum', { scroll: false });
  };

  useEffect(() => {
    if (threads.length > 0) {
      const threadId = searchParams.get('thread');
      if (threadId && !activeThread) {
        const found = threads.find(t => t.id === threadId);
        if (found) {
          openThread(found);
        }
      }
    }
  }, [threads, searchParams, activeThread]);

  const submitComment = async (text: string) => {
    if (!user || !text.trim() || !activeThread) return;
    if (user.isAnonymous) return setAuthOpen(true);
    await addDoc(collection(db, 'forum', activeThread.id, 'comments'), { authorName: userProfile?.displayName || user.displayName || 'Kullanıcı', authorUsername: userProfile?.username || '', text, createdAt: serverTimestamp(), reactionsData: {}, uid: user.uid });
    await updateDoc(doc(db, 'forum', activeThread.id), { commentCount: increment(1) });
    toast.success('Yorum eklendi.');
  };

  const deletePost = async (id: string) => { if (confirm('Emin misin?')) { await deleteDoc(doc(db, 'forum', id)); toast.success('Kaldırıldı.'); } };
  const deleteComment = async (id: string) => { if (!activeThread) return; if (confirm('Emin misin?')) { await deleteDoc(doc(db, 'forum', activeThread.id, 'comments', id)); await updateDoc(doc(db, 'forum', activeThread.id), { commentCount: increment(-1) }); toast.success('Kaldırıldı.'); } };

  const myUsername = userProfile?.username || user?.displayName?.toLowerCase().replace(/\s+/g, '') || '';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Mobile category pills */}
      <div className="forum-mobile-cats" style={{ display: 'none', overflowX: 'auto', padding: '8px 12px', gap: 8, background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 64, zIndex: 90, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => { setFilter(c); setFeedTab('all'); }} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, background: filter === c ? '#0f172a' : '#f1f5f9', color: filter === c ? 'white' : '#64748b', whiteSpace: 'nowrap' }}>
            {c}
          </button>
        ))}
      </div>

      <div className="forum-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 0, paddingTop: 72 }}>

        {/* LEFT SIDEBAR */}
        <aside className="forum-sidebar-left" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid #e2e8f0' }}>
          <div style={{ padding: '0 8px 16px', marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Topluluk</h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>Psikoloji forumu</p>
          </div>
          {[{ label: 'Ana Akış', action: () => { setFeedTab('all'); setFilter('Tümü'); }, active: feedTab === 'all' },
            { label: 'Takip Ettiklerim', action: () => !user?.uid ? setAuthOpen(true) : setFeedTab('following'), active: feedTab === 'following' },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%', background: item.active ? '#0f172a' : 'transparent', color: item.active ? 'white' : '#475569', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s' }}>
              {item.label === 'Ana Akış' ? <Home size={20} /> : <Users size={20} />} {item.label}
            </button>
          ))}
          <div style={{ margin: '16px 0 8px', padding: '0 8px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kategoriler</div>
          {CATEGORIES.filter(c => c !== 'Tümü').map(c => (
            <button key={c} onClick={() => { setFilter(c); setFeedTab('all'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', background: filter === c ? '#eff6ff' : 'transparent', color: filter === c ? '#1d4ed8' : '#64748b', fontWeight: filter === c ? 700 : 500, fontSize: '0.88rem', transition: 'all 0.15s' }}>
              <Hash size={15} /> {c}
            </button>
          ))}
          {user && !user.isAnonymous && (
            <Link href={`/forum/profil/${myUsername}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, textDecoration: 'none', marginTop: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden' }}>
                {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{userProfile?.displayName || user.displayName}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>@{myUsername}</div>
              </div>
            </Link>
          )}
        </aside>

        {/* MAIN FEED */}
        <main style={{ borderRight: '1px solid #e2e8f0', minHeight: 'calc(100vh - 72px)', background: 'white' }}>
          {/* Tabs */}
          <div style={{ position: 'sticky', top: 72, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', zIndex: 100 }}>
            <div style={{ display: 'flex' }}>
              {[{ key: 'all', label: 'Ana Akış' }, { key: 'following', label: 'Takip Ettiklerim' }].map(tab => (
                <button key={tab.key} onClick={() => tab.key === 'following' && !user?.uid ? setAuthOpen(true) : setFeedTab(tab.key as any)}
                  style={{ flex: 1, padding: '16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', background: 'transparent', color: feedTab === tab.key ? '#0f172a' : '#94a3b8', borderBottom: feedTab === tab.key ? '3px solid #0f172a' : '3px solid transparent', transition: 'all 0.2s' }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {filter !== 'Tümü' && (
              <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>#{filter}</span>
                <button onClick={() => setFilter('Tümü')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            )}
          </div>

          {/* Compose */}
          {user && !user.isAnonymous && (
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, overflow: 'hidden' }}>
                {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <textarea placeholder="Ne düşünüyorsunuz? Psikoloji topluluğuyla paylaşın..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ width: '100%', border: 'none', fontSize: '1.05rem', color: '#0f172a', minHeight: 72, resize: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', lineHeight: 1.5 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                  <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ border: 'none', background: '#f1f5f9', padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', color: '#475569', cursor: 'pointer', outline: 'none', fontWeight: 600 }}>
                    {CATEGORIES.filter(c => c !== 'Tümü').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={handlePost} disabled={posting || !form.body.trim()} style={{ background: form.body.trim() ? '#0f172a' : '#e2e8f0', color: form.body.trim() ? 'white' : '#94a3b8', border: 'none', padding: '10px 22px', borderRadius: 999, fontWeight: 700, cursor: form.body.trim() ? 'pointer' : 'default', fontSize: '0.9rem', transition: 'all 0.2s' }}>Paylaş</button>
                </div>
              </div>
            </div>
          )}

          {!user && (
            <div style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', background: 'linear-gradient(135deg,#f8fafc,#eff6ff)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🧠</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Psikoloji topluluğuna katılın</h3>
              <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.95rem' }}>Düşüncelerinizi paylaşın, tartışmalara katılın.</p>
              <button onClick={() => setAuthOpen(true)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>Katıl</button>
            </div>
          )}

          {/* Posts */}
          {filtered.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>💭</div>
              <h3 style={{ color: '#94a3b8', fontWeight: 700 }}>{feedTab === 'following' ? 'Takip ettiğiniz kişi paylaşım yapmamış.' : 'Bu kategoride henüz gönderi yok.'}</h3>
            </div>
          ) : (
            filtered.map(t => (
              <ForumPost key={t.id} post={{ ...t, authorPhotoURL: usersMap[t.uid]?.photoURL }} currentUserUid={user?.uid} currentUserEmail={user?.email || ''} adminEmails={ADMIN_EMAILS} onOpen={openThread} onReact={handleReact} onDelete={deletePost} />
            ))
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="forum-sidebar-right" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f1f5f9', borderRadius: 12, padding: '12px 16px' }}>
            <Search size={17} color="#94a3b8" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Forumda ara..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: '#0f172a', width: '100%' }} />
          </div>
          {user && !user.isAnonymous && (
            <Link href="/bildirimler" style={{ textDecoration: 'none' }}>
              <div style={{ background: unreadCount > 0 ? '#eff6ff' : '#f8fafc', border: `1px solid ${unreadCount > 0 ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ position: 'relative' }}>
                  <Bell size={22} color={unreadCount > 0 ? '#2563eb' : '#94a3b8'} />
                  {unreadCount > 0 && <div style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</div>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Bildirimler</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{unreadCount > 0 ? `${unreadCount} okunmamış` : 'Hepsi okundu'}</div>
                </div>
              </div>
            </Link>
          )}
          <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
              <TrendingUp size={18} color="#64748b" />
              <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>Gündem</h3>
            </div>
            {trends.map(([cat, count]) => (
              <button key={cat} onClick={() => { setFilter(cat); setFeedTab('all'); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '13px 18px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }} onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>Psikoloji · Gündem</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>#{cat.replace(/\s+/g, '')}</div>
                </div>
                <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{count}</span>
              </button>
            ))}
          </div>
          {!user && (
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>🧠</div>
              <h3 style={{ fontWeight: 800, color: 'white', fontSize: '1rem', marginBottom: 8 }}>Topluluğa Katılın</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 16, lineHeight: 1.5 }}>Paylaşın, tartışın, büyüyün.</p>
              <button onClick={() => setAuthOpen(true)} style={{ background: 'white', color: '#0f172a', border: 'none', padding: '10px 22px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', width: '100%' }}>Katıl</button>
            </div>
          )}
        </aside>
      </div>

      {activeThread && (
        <ForumModal post={{ ...activeThread, authorPhotoURL: usersMap[activeThread.uid]?.photoURL }} comments={comments.map(c => ({ ...c, authorPhotoURL: usersMap[c.uid]?.photoURL }))} currentUser={user} userProfile={userProfile} adminEmails={ADMIN_EMAILS} onClose={closeThread} onReact={handleReact} onCommentReact={async () => {}} onSubmitComment={submitComment} onDeleteComment={deleteComment} onOpenAuth={() => setAuthOpen(true)} />
      )}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', padding: '20px 16px' }} onClick={() => setMobileSearchOpen(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <Search size={18} color="#94a3b8" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Forumda ara..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', color: '#0f172a', background: 'transparent' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div style={{ marginTop: 12, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              {threads.filter(t => t.body.toLowerCase().includes(searchQuery.toLowerCase()) || t.authorName.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(t => (
                <div key={t.id} onClick={() => { openThread(t); setMobileSearchOpen(false); setSearchQuery(''); }} style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: 2 }}>{t.authorName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="forum-mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid #e2e8f0',
        zIndex: 400,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(15,23,42,0.06)',
      }}>
        {/* Search */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px 20px', borderRadius: 12, transition: 'all 0.15s' }}
        >
          <Search size={24} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Ara</span>
        </button>

        {/* Home - center, prominent */}
        <button
          onClick={() => { setFeedTab('all'); setFilter('Tümü'); setSearchQuery(''); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: feedTab === 'all' && filter === 'Tümü' ? '#0f172a' : '#f1f5f9', border: 'none', cursor: 'pointer', color: feedTab === 'all' && filter === 'Tümü' ? 'white' : '#475569', padding: '10px 24px', borderRadius: 16, transition: 'all 0.2s', transform: feedTab === 'all' && filter === 'Tümü' ? 'scale(1.05)' : 'scale(1)', boxShadow: feedTab === 'all' && filter === 'Tümü' ? '0 4px 12px rgba(15,23,42,0.25)' : 'none' }}
        >
          <Home size={24} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Anasayfa</span>
        </button>

        {/* Notifications */}
        <Link
          href={user && !user.isAnonymous ? '/bildirimler' : '#'}
          onClick={!user || user.isAnonymous ? (e) => { e.preventDefault(); setAuthOpen(true); } : undefined}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: '#64748b', textDecoration: 'none', padding: '8px 20px', borderRadius: 12, position: 'relative' }}
        >
          <div style={{ position: 'relative' }}>
            <Bell size={24} />
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Bildirim</span>
        </Link>
      </nav>
    </div>
  );
}
