'use client';
import React, { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, orderBy, query, updateDoc, doc, increment, onSnapshot, deleteDoc, deleteField, where, getDocs, getDoc, limit, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import ForumPost from '@/components/forum/ForumPost';
import ThreadView from '@/components/forum/ThreadView';
import { Search, TrendingUp, Hash, Bell, Users, Home, X, PenSquare, FileText, MessageCircle, ArrowRight, Film, Camera, Loader2, Sparkles, MessageSquare, User, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface Post {
  id: string;
  title?: string;
  body: string;
  category?: string;
  authorName: string;
  authorUsername?: string;
  uid: string;
  commentCount: number;
  createdAt: any;
  reactionsData?: Record<string, string>;
  repostsData?: Record<string, any>;
  bookmarksData?: Record<string, any>;
  authorPhotoURL?: string;
  authorIsPsychologist?: boolean;
  imageUrl?: string;
  isRepost?: boolean;
  originalPostId?: string;
  originalAuthorName?: string;
  originalAuthorUsername?: string;
  originalAuthorPhotoURL?: string;
  originalAuthorIsPsychologist?: boolean;
}
interface Comment {
  id: string; authorName: string; authorUsername?: string;
  text: string; createdAt: Date; reactionsData?: Record<string, string>; uid: string;
  authorPhotoURL?: string;
  authorIsPsychologist?: boolean;
  imageUrl?: string;
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
  const [form, setForm] = useState({ body: '', cat: 'Psikanaliz', imageUrl: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
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

  // Sync search query, category, and feed from URL
  useEffect(() => {
    const qParam = searchParams.get('search') || searchParams.get('q');
    if (qParam !== null && qParam !== undefined) {
      setSearchQuery(qParam);
    }
    const catParam = searchParams.get('cat');
    if (catParam) {
      setFilter(catParam);
    }
    const feedParam = searchParams.get('feed');
    if (feedParam === 'following') {
      setFeedTab('following');
    }
  }, [searchParams]);

  const filtered = (() => {
    let list = filter === 'Tümü' ? threads : threads.filter(t => t.category === filter);
    if (feedTab === 'following') list = list.filter(t => followingUids.includes(t.uid));
    if (searchQuery.trim()) { 
      const q = searchQuery.toLowerCase(); 
      list = list.filter(t => 
        t.body.toLowerCase().includes(q) || 
        t.authorName.toLowerCase().includes(q) || 
        (t.category && t.category.toLowerCase().includes(q))
      ); 
    }
    return list;
  })();

  const catCounts = threads.reduce((acc, t) => { 
    if (t.category) { 
      acc[t.category] = (acc[t.category] || 0) + 1; 
    } 
    return acc; 
  }, {} as Record<string, number>);
  const trends = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const toastId = toast.loading('Görsel Cloudinary\'ye yükleniyor...');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'manav-platform/forum');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setForm(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('Görsel eklendi!', { id: toastId });
    } catch (err: any) {
      toast.error('Hata: ' + err.message, { id: toastId });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handlePost = async () => {
    if (!user || (!form.body.trim() && !form.imageUrl)) return toast.error('Yazı veya görsel eklemelisiniz.');
    if (user.isAnonymous) return setAuthOpen(true);
    setPosting(true);
    const isPsychologist = Boolean(
      (userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
      (userProfile?.isPsychologist && !userProfile?.psychologistStatus)
    );
    try {
      await addDoc(collection(db, 'forum'), {
        body: form.body,
        category: form.cat,
        imageUrl: form.imageUrl || '',
        authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || (user.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
        authorIsPsychologist: isPsychologist,
        uid: user.uid,
        commentCount: 0,
        createdAt: serverTimestamp(),
        reactionsData: {}
      });
      setForm({ body: '', cat: 'Psikanaliz', imageUrl: '' });
      toast.success('Paylaşıldı!');
    } catch {
      toast.error('Hata oluştu.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, thread: Post) => {
    e.stopPropagation();
    if (!user || user.isAnonymous) return setAuthOpen(true);
    const postRef = doc(db, 'forum', thread.id);
    const userReaction = thread.reactionsData?.[user.uid];
    if (userReaction === 'like' || userReaction === 'heart') {
      await updateDoc(postRef, { [`reactionsData.${user.uid}`]: deleteField() });
    } else {
      await updateDoc(postRef, { [`reactionsData.${user.uid}`]: 'like' });
    }
  };

  const handleDislike = async (e: React.MouseEvent, thread: Post) => {
    e.stopPropagation();
    if (!user || user.isAnonymous) return setAuthOpen(true);
    const postRef = doc(db, 'forum', thread.id);
    const userReaction = thread.reactionsData?.[user.uid];
    if (userReaction === 'dislike') {
      await updateDoc(postRef, { [`reactionsData.${user.uid}`]: deleteField() });
    } else {
      await updateDoc(postRef, { [`reactionsData.${user.uid}`]: 'dislike' });
    }
  };

  const handleRepost = async (e: React.MouseEvent, thread: Post) => {
    e.stopPropagation();
    if (!user || user.isAnonymous) return setAuthOpen(true);
    const targetPostId = thread.originalPostId || thread.id;
    const postRef = doc(db, 'forum', targetPostId);
    const hasReposted = Boolean(thread.repostsData?.[user.uid]);
    const existingRepostDocId = typeof thread.repostsData?.[user.uid] === 'string'
      ? thread.repostsData[user.uid]
      : null;

    if (hasReposted) {
      await updateDoc(postRef, { [`repostsData.${user.uid}`]: deleteField() });
      if (existingRepostDocId) {
        try { await deleteDoc(doc(db, 'forum', existingRepostDocId)); } catch {}
      } else {
        try {
          const qSnap = await getDocs(query(
            collection(db, 'forum'),
            where('originalPostId', '==', targetPostId),
            where('uid', '==', user.uid),
            where('isRepost', '==', true)
          ));
          for (const d of qSnap.docs) {
            await deleteDoc(d.ref);
          }
        } catch {}
      }
      toast.success('Yeniden paylaşım geri alındı');
    } else {
      const isPsychologist = Boolean(
        (userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
        (userProfile?.isPsychologist && !userProfile?.psychologistStatus) ||
        userProfile?.role === 'psychologist'
      );

      const repostDoc = await addDoc(collection(db, 'forum'), {
        body: thread.body,
        category: thread.category || 'Genel',
        imageUrl: thread.imageUrl || '',
        createdAt: serverTimestamp(),
        uid: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || (user.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
        authorPhotoURL: userProfile?.photoURL || user.photoURL || '',
        isPsychologist: isPsychologist,
        commentCount: 0,
        reactionsData: {},
        repostsData: {},
        bookmarksData: {},
        isRepost: true,
        originalPostId: targetPostId,
        originalAuthorName: thread.originalAuthorName || thread.authorName,
        originalAuthorUsername: thread.originalAuthorUsername || thread.authorUsername || (thread.authorName || '').toLowerCase().replace(/\s+/g, ''),
        originalAuthorPhotoURL: thread.originalAuthorPhotoURL || thread.authorPhotoURL || '',
        originalAuthorIsPsychologist: thread.originalAuthorIsPsychologist ?? thread.authorIsPsychologist ?? false,
        originalCreatedAt: thread.createdAt instanceof Date ? thread.createdAt : new Date(),
      });

      await updateDoc(postRef, { [`repostsData.${user.uid}`]: repostDoc.id });
      toast.success('Yeniden paylaşıldı');
    }
  };

  const handleBookmark = async (e: React.MouseEvent, thread: Post) => {
    e.stopPropagation();
    if (!user || user.isAnonymous) return setAuthOpen(true);
    const targetPostId = thread.originalPostId || thread.id;
    const postRef = doc(db, 'forum', targetPostId);
    const userBookmarkRef = doc(db, 'users', user.uid, 'bookmarks', targetPostId);
    const hasBookmarked = Boolean(thread.bookmarksData?.[user.uid]);

    if (hasBookmarked) {
      await updateDoc(postRef, { [`bookmarksData.${user.uid}`]: deleteField() });
      try { await deleteDoc(userBookmarkRef); } catch {}
      toast.success('Yer işaretlerinden kaldırıldı');
    } else {
      await updateDoc(postRef, { [`bookmarksData.${user.uid}`]: true });
      try {
        await setDoc(userBookmarkRef, {
          postId: targetPostId,
          createdAt: serverTimestamp(),
          postBody: thread.body?.slice(0, 100) || '',
          authorName: thread.authorName || ''
        });
      } catch {}
      toast.success('Yer işaretlerine kaydedildi');
    }
  };

  const openThread = (t: Post) => {
    const targetId = t.originalPostId || t.id;
    if (t.originalPostId) {
      const original = threads.find(x => x.id === t.originalPostId);
      if (original) {
        setActiveThread(original);
        router.replace(`/forum?thread=${targetId}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    setActiveThread(t);
    router.replace(`/forum?thread=${targetId}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeThread = () => {
    setActiveThread(null);
    router.replace('/forum', { scroll: false });
  };

  useEffect(() => {
    const threadId = searchParams.get('thread');
    if (!threadId) {
      if (activeThread) setActiveThread(null);
      return;
    }
    if (activeThread?.id === threadId) return;

    const found = threads.find(t => t.id === threadId);
    if (found) {
      setActiveThread(found);
      return;
    }

    // Direct fetch fallback for direct links or shared post URLs
    getDoc(doc(db, 'forum', threadId)).then(snap => {
      if (snap.exists()) {
        setActiveThread({ id: snap.id, ...snap.data() } as Post);
      }
    }).catch(console.error);
  }, [searchParams, threads]);

  const submitComment = async (text: string, imageUrl?: string) => {
    if (!user || (!text.trim() && !imageUrl) || !activeThread) return;
    if (user.isAnonymous) return setAuthOpen(true);
    const isPsychologist = Boolean(
      (userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
      (userProfile?.isPsychologist && !userProfile?.psychologistStatus)
    );
    await addDoc(collection(db, 'forum', activeThread.id, 'comments'), {
      authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
      authorUsername: userProfile?.username || '',
      authorIsPsychologist: isPsychologist,
      text,
      imageUrl: imageUrl || '',
      createdAt: serverTimestamp(),
      reactionsData: {},
      uid: user.uid
    });
    await updateDoc(doc(db, 'forum', activeThread.id), { commentCount: increment(1) });
    toast.success('Yorum eklendi.');
  };

  const deletePost = async (id: string) => { if (confirm('Emin misin?')) { await deleteDoc(doc(db, 'forum', id)); toast.success('Kaldırıldı.'); } };
  const deleteComment = async (id: string) => { if (!activeThread) return; if (confirm('Emin misin?')) { await deleteDoc(doc(db, 'forum', activeThread.id, 'comments', id)); await updateDoc(doc(db, 'forum', activeThread.id), { commentCount: increment(-1) }); toast.success('Kaldırıldı.'); } };

  const myUsername = userProfile?.username || user?.displayName?.toLowerCase().replace(/\s+/g, '') || '';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Mobile category pills */}
      <div className="forum-mobile-cats" style={{ display: 'none', overflowX: 'auto', padding: '8px 12px', gap: 8, background: 'white', borderBottom: '1px solid #e2e8f0', position: 'relative', zIndex: 10, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
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
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              Topluluk
              <span style={{ fontSize: '0.6rem', background: '#0f172a', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>v2.0</span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>Psikoloji forumu</p>
          </div>
          {[{ label: 'Ana Akış', action: () => { setFeedTab('all'); setFilter('Tümü'); }, active: feedTab === 'all', icon: <Home size={20} /> },
            { label: 'Takip Ettiklerim', action: () => !user?.uid ? setAuthOpen(true) : setFeedTab('following'), active: feedTab === 'following', icon: <Users size={20} /> },
            { label: 'Yer İşaretleri', action: () => !user?.uid ? setAuthOpen(true) : router.push(`/forum/profil/${myUsername}?tab=bookmarks`), active: false, icon: <Bookmark size={20} /> },
            { label: 'Videolarım', action: () => router.push('/videolarim'), active: false, icon: <Film size={20} /> },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%', background: item.active ? '#0f172a' : 'transparent', color: item.active ? 'white' : '#475569', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s' }}>
              {item.icon} {item.label}
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

        {/* MAIN FEED / THREAD VIEW */}
        <main style={{ borderRight: '1px solid #e2e8f0', minHeight: 'calc(100vh - 72px)', background: 'white' }}>
          {activeThread ? (
            <ThreadView
              post={{
                ...activeThread,
                authorPhotoURL: usersMap[activeThread.uid]?.photoURL || activeThread.authorPhotoURL,
                authorIsPsychologist: Boolean(
                  activeThread.authorIsPsychologist ||
                  usersMap[activeThread.uid]?.isPsychologist ||
                  usersMap[activeThread.uid]?.role === 'psychologist'
                )
              }}
              currentUser={user}
              userProfile={userProfile}
              adminEmails={ADMIN_EMAILS}
              onBack={closeThread}
              onOpenAuth={() => setAuthOpen(true)}
              onPostDeleted={(deletedId) => {
                setThreads(prev => prev.filter(t => t.id !== deletedId));
                closeThread();
              }}
            />
          ) : (
            <>
              {/* Tabs */}
              <div style={{ position: 'relative', background: '#ffffff', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
                <div style={{ display: 'flex' }}>
                  {[{ key: 'all', label: 'Ana Akış' }, { key: 'following', label: 'Takip Ettiklerim' }].map(tab => (
                    <button key={tab.key} onClick={() => tab.key === 'following' && !user?.uid ? setAuthOpen(true) : setFeedTab(tab.key as any)}
                      style={{ flex: 1, padding: '16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', background: 'transparent', color: feedTab === tab.key ? '#0f172a' : '#94a3b8', borderBottom: feedTab === tab.key ? '3px solid #0f172a' : '3px solid transparent', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {tab.label}
                      {tab.key === 'all' && <span style={{ fontSize: '0.55rem', background: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>v2.0</span>}
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
                    
                    {form.imageUrl && (
                      <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: 12 }}>
                        <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => setForm({ ...form, imageUrl: '' })} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ border: 'none', background: '#f1f5f9', padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', color: '#475569', cursor: 'pointer', outline: 'none', fontWeight: 600 }}>
                          {CATEGORIES.filter(c => c !== 'Tümü').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '6px 12px', borderRadius: 999, fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: 600 }} title="Görsel ekle">
                          {uploadingImage ? (
                            <>
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Yükleniyor…</span>
                            </>
                          ) : (
                            <>
                              <Camera size={14} />
                              <span>Görsel Ekle</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                        </label>
                      </div>

                      <button onClick={handlePost} disabled={posting || (!form.body.trim() && !form.imageUrl)} style={{ background: (form.body.trim() || form.imageUrl) ? '#0f172a' : '#e2e8f0', color: (form.body.trim() || form.imageUrl) ? 'white' : '#94a3b8', border: 'none', padding: '10px 22px', borderRadius: 999, fontWeight: 700, cursor: (form.body.trim() || form.imageUrl) ? 'pointer' : 'default', fontSize: '0.9rem', transition: 'all 0.2s' }}>Paylaş</button>
                    </div>
                  </div>
                </div>
              )}

              {!user && (
                <div style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', background: 'linear-gradient(135deg,#f8fafc,#eff6ff)' }}>
                  <Users size={32} color="#0f172a" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Psikoloji topluluğuna katılın</h3>
                  <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.95rem' }}>Düşüncelerinizi paylaşın, tartışmalara katılın.</p>
                  <button onClick={() => setAuthOpen(true)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>Katıl</button>
                </div>
              )}

              {/* Active Search Banner */}
              {searchQuery.trim() && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                  <div style={{ color: '#1e3a8a', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Search size={15} />
                    <span><strong>"{searchQuery}"</strong> için arama sonuçları ({filtered.length} gönderi)</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      router.replace('/forum', { scroll: false });
                    }} 
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Aramayı Temizle
                  </button>
                </div>
              )}

              {/* Posts */}
              {filtered.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <MessageSquare size={36} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ color: '#94a3b8', fontWeight: 700 }}>
                    {searchQuery.trim() ? `"${searchQuery}" ile eşleşen gönderi bulunamadı.` : (feedTab === 'following' ? 'Takip ettiğiniz kişi paylaşım yapmamış.' : 'Bu kategoride henüz gönderi yok.')}
                  </h3>
                </div>
              ) : (
                filtered.map(t => {
                  const isAuthorPsych = Boolean(
                    t.authorIsPsychologist ||
                    (usersMap[t.uid]?.isPsychologist && usersMap[t.uid]?.psychologistStatus === 'approved') ||
                    (usersMap[t.uid]?.isPsychologist && !usersMap[t.uid]?.psychologistStatus)
                  );
                  return (
                    <ForumPost
                      key={t.id}
                      post={{
                        ...t,
                        authorPhotoURL: usersMap[t.uid]?.photoURL,
                        authorIsPsychologist: isAuthorPsych
                      }}
                      currentUserUid={user?.uid}
                      currentUserEmail={user?.email || ''}
                      adminEmails={ADMIN_EMAILS}
                      onOpen={openThread}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      onRepost={handleRepost}
                      onBookmark={handleBookmark}
                      onDelete={deletePost}
                    />
                  );
                })
              )}
            </>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="forum-sidebar-right" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f1f5f9', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
            <Search size={17} color="#94a3b8" />
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Forumda ara..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: '#0f172a', width: '100%' }} 
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  router.replace('/forum', { scroll: false });
                }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}
                title="Aramayı temizle"
              >
                <X size={16} />
              </button>
            )}
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
              <Sparkles size={28} color="#d97706" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontWeight: 800, color: 'white', fontSize: '1rem', marginBottom: 8 }}>Topluluğa Katılın</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 16, lineHeight: 1.5 }}>Paylaşın, tartışın, büyüyün.</p>
              <button onClick={() => setAuthOpen(true)} style={{ background: 'white', color: '#0f172a', border: 'none', padding: '10px 22px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', width: '100%' }}>Katıl</button>
            </div>
          )}
        </aside>
      </div>

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
        <button
          type="button"
          onClick={() => { setFeedTab('all'); setFilter('Tümü'); setSearchQuery(''); }}
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
            color: feedTab === 'all' && filter === 'Tümü' && !searchQuery ? '#0f172a' : '#64748b',
            transition: 'color 0.15s ease',
            padding: 0,
            position: 'relative'
          }}
        >
          {feedTab === 'all' && filter === 'Tümü' && !searchQuery && (
            <span style={{ position: 'absolute', top: 0, width: 24, height: 3, background: '#0f172a', borderRadius: '0 0 4px 4px' }} />
          )}
          <Home size={22} strokeWidth={feedTab === 'all' && filter === 'Tümü' && !searchQuery ? 2.4 : 1.9} />
          <span style={{ fontSize: '0.68rem', fontWeight: feedTab === 'all' && filter === 'Tümü' && !searchQuery ? 700 : 500 }}>Anasayfa</span>
        </button>

        {/* 2. Search */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
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
            color: mobileSearchOpen || searchQuery ? '#0f172a' : '#64748b',
            transition: 'color 0.15s ease',
            padding: 0,
            position: 'relative'
          }}
        >
          {(mobileSearchOpen || searchQuery) && (
            <span style={{ position: 'absolute', top: 0, width: 24, height: 3, background: '#0f172a', borderRadius: '0 0 4px 4px' }} />
          )}
          <Search size={22} strokeWidth={mobileSearchOpen || searchQuery ? 2.4 : 1.9} />
          <span style={{ fontSize: '0.68rem', fontWeight: mobileSearchOpen || searchQuery ? 700 : 500 }}>Ara</span>
        </button>

        {/* 3. Notifications */}
        <Link
          href={user && !user.isAnonymous ? '/bildirimler' : '#'}
          onClick={!user || user.isAnonymous ? (e) => { e.preventDefault(); setAuthOpen(true); } : undefined}
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
            position: 'relative',
            transition: 'color 0.15s ease'
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={22} strokeWidth={1.9} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -6, background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 800, minWidth: 16, height: 16, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 500 }}>Bildirim</span>
        </Link>

        {/* 4. Profile */}
        <Link
          href={user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername)}` : '#'}
          onClick={!user || user.isAnonymous ? (e) => { e.preventDefault(); setAuthOpen(true); } : undefined}
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
            position: 'relative',
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
