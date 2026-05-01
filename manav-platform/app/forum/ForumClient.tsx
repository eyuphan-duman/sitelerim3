'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  addDoc, collection, serverTimestamp, orderBy, query, updateDoc, doc,
  increment, onSnapshot, deleteDoc, deleteField, where, getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import ForumPost from '@/components/forum/ForumPost';
import ForumModal from '@/components/forum/ForumModal';
import { Search, TrendingUp, Hash, Bell, Users, Home, Compass, UserCircle2, PenSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  const [threads, setThreads] = useState<Post[]>([]);
  const [filter, setFilter] = useState('Tümü');
  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all');
  const [followingUids, setFollowingUids] = useState<string[]>([]);
  const [form, setForm] = useState({ body: '', cat: 'Psikanaliz' });
  const [posting, setPosting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), snap => {
      const map: Record<string, any> = {};
      snap.docs.forEach(d => map[d.id] = d.data());
      setUsersMap(map);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'forum'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setThreads(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[]);
    });
  }, []);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const q = query(collection(db, 'notifications'), where('toUid', '==', user.uid), where('read', '==', false));
    return onSnapshot(q, snap => setUnreadCount(snap.size));
  }, [user]);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
    return onSnapshot(q, snap => setFollowingUids(snap.docs.map(d => d.data().followingId)));
  }, [user]);

  const filtered = (() => {
    let list = filter === 'Tümü' ? threads : threads.filter(t => t.category === filter);
    if (feedTab === 'following') list = list.filter(t => followingUids.includes(t.uid));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.body.toLowerCase().includes(q) || t.authorName.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list;
  })();

  const catCounts = threads.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {} as Record<string, number>);
  const trends = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const handlePost = async () => {
    if (!user || !form.body.trim()) return toast.error('Yazı boş olamaz.');
    if (user.isAnonymous) return setAuthOpen(true);
    setPosting(true);
    try {
      await addDoc(collection(db, 'forum'), {
        body: form.body, category: form.cat,
        authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || user.displayName?.toLowerCase().replace(/\s+/g, '') || 'kullanici',
        uid: user.uid, commentCount: 0, createdAt: serverTimestamp(), reactionsData: {}
      });
      setForm({ body: '', cat: 'Psikanaliz' });
      setComposeOpen(false);
      toast.success('Paylaşıldı!');
    } catch { toast.error('Hata oluştu.'); }
    finally { setPosting(false); }
  };

  const handleReact = async (e: React.MouseEvent, thread: Post, emoji: string) => {
    e.stopPropagation();
    if (!user || user.isAnonymous) return toast.error('Tepki için giriş gerekli.');
    const current = thread.reactionsData?.[user.uid];
    if (current === emoji) {
      await updateDoc(doc(db, 'forum', thread.id), { [`reactionsData.${user.uid}`]: deleteField() });
    } else {
      await updateDoc(doc(db, 'forum', thread.id), { [`reactionsData.${user.uid}`]: emoji });
    }
  };

  const openThread = (t: Post) => {
    setActiveThread(t);
    const q = query(collection(db, 'forum', t.id, 'comments'), orderBy('createdAt', 'asc'));
    onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Comment[]);
    });
  };

  const submitComment = async (text: string) => {
    if (!user || !text.trim() || !activeThread) return;
    if (user.isAnonymous) return setAuthOpen(true);
    await addDoc(collection(db, 'forum', activeThread.id, 'comments'), {
      authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
      authorUsername: userProfile?.username || user.displayName?.toLowerCase().replace(/\s+/g, '') || 'kullanici',
      text, createdAt: serverTimestamp(), reactionsData: {}, uid: user.uid
    });
    await updateDoc(doc(db, 'forum', activeThread.id), { commentCount: increment(1) });
    toast.success('Yorum eklendi.');
  };

  const deletePost = async (id: string) => {
    if (confirm('Emin misin?')) {
      await deleteDoc(doc(db, 'forum', id));
      toast.success('Kaldırıldı.');
    }
  };

  const deleteComment = async (id: string) => {
    if (!activeThread) return;
    if (confirm('Emin misin?')) {
      await deleteDoc(doc(db, 'forum', activeThread.id, 'comments', id));
      await updateDoc(doc(db, 'forum', activeThread.id), { commentCount: increment(-1) });
      toast.success('Kaldırıldı.');
    }
  };

  const myUsername = userProfile?.username || user?.displayName?.toLowerCase().replace(/\s+/g, '') || '';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div className="forum-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 0, paddingTop: 72 }}>
        {/* LEFT SIDEBAR */}
        <aside style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 16px', borderRight: '1px solid #e2e8f0' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, marginBottom: 20 }}>Topluluk</h1>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: filter === c ? '#eff6ff' : 'transparent', color: filter === c ? '#1d4ed8' : '#64748b', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
              <Hash size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} /> {c}
            </button>
          ))}
        </aside>

        {/* MAIN FEED */}
        <main style={{ background: 'white', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <textarea placeholder="Ne düşünüyorsunuz?" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ width: '100%', border: 'none', fontSize: '1.1rem', outline: 'none', minHeight: 100, resize: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #ddd' }}>
                 {CATEGORIES.filter(c=>c!=='Tümü').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handlePost} className="btn-gold">Paylaş</button>
            </div>
          </div>
          {filtered.map(t => (
            <ForumPost key={t.id} post={{ ...t, authorPhotoURL: usersMap[t.uid]?.photoURL }} currentUserUid={user?.uid} adminEmails={ADMIN_EMAILS} onOpen={openThread} onReact={handleReact} onDelete={deletePost} />
          ))}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside style={{ padding: 24 }}>
          <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={18} color="#94a3b8" />
            <input placeholder="Ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', width: '100%' }} />
          </div>
          <div style={{ marginTop: 24, background: '#f8fafc', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontWeight: 800, marginBottom: 12 }}>Gündem</h3>
            {trends.map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                <span>#{cat}</span>
                <span style={{ color: '#94a3b8' }}>{count}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {activeThread && (
        <ForumModal post={{ ...activeThread, authorPhotoURL: usersMap[activeThread.uid]?.photoURL }} comments={comments} currentUser={user} userProfile={userProfile} onClose={()=>setActiveThread(null)} onSubmitComment={submitComment} />
      )}
      <AuthModal isOpen={authOpen} onClose={()=>setAuthOpen(false)} />
    </div>
  );
}
