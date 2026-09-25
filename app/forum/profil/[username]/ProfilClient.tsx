'use client';
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Camera, MapPin, Link as LinkIcon, Calendar, 
  MessageCircle, Heart, Trash2, Home, Users, Film, FileText, 
  Bell, Search, TrendingUp, Hash, X, Check, Share2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Post { 
  id: string; body: string; authorName: string; uid: string; 
  createdAt: any; commentCount: number; reactionsData?: Record<string, string>; 
  category?: string; imageUrl?: string; authorPhotoURL?: string;
}

const CATEGORIES = ['Tümü','Psikanaliz','Varoluş & Anlam','Kaygı & Depresyon','İlişkiler','Çocukluk & Travma','Rüyalar','Kimlik & Benlik','Kişisel Gelişim'];
const ADMIN = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>{icon}</div>
      <p style={{ fontWeight: 700, fontSize: '1rem', color: '#64748b' }}>{text}</p>
    </div>
  );
}

function PostCard({ p, pd, isOwn, userEmail, onDelete }: { p: Post; pd: any; isOwn: boolean; userEmail: string; onDelete: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '20px 24px', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', background: 'white' }}
      onMouseOver={e => (e.currentTarget.style.background = '#fafbfc')}
      onMouseOut={e => (e.currentTarget.style.background = 'white')}
    >
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>
        {pd.photoURL ? <img key={pd.photoURL} src={pd.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (pd.displayName || 'U')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.96rem' }}>{pd.displayName || pd.username}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{pd.username}</span>
            <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>·</span>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{p.createdAt?.toLocaleDateString?.('tr-TR')}</span>
            {p.category && <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.category}</span>}
          </div>
          {(isOwn || ADMIN.includes(userEmail)) && (
            <button onClick={() => onDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 6, transition: 'all 0.15s' }} onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }} onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }} title="Gönderiyi Sil">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p style={{ color: '#334155', fontSize: '0.97rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{p.body}</p>
        
        {p.imageUrl && (
          <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', maxHeight: 380, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <img src={p.imageUrl} alt="" style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, marginTop: 12, color: '#94a3b8', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 500 }}><MessageCircle size={15} />{p.commentCount || 0}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 500 }}><Heart size={15} />{Object.keys(p.reactionsData || {}).length}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProfilClient({ username }: { username: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [pd, setPd] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [likes, setLikes] = useState<Post[]>([]);
  const [tab, setTab] = useState<'posts'|'replies'|'likes'>('posts');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followings, setFollowings] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [ed, setEd] = useState({ displayName:'', bio:'', location:'', website:'' });
  const [saving, setSaving] = useState(false);
  const [upPhoto, setUpPhoto] = useState(false);
  const [upCover, setUpCover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const photoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let data: any = null;
        const strats = [
          () => getDocs(query(collection(db,'users'), where('username','==',username))),
          () => getDocs(query(collection(db,'users'), where('username','==',username.toLowerCase()))),
          () => getDocs(query(collection(db,'users'), where('displayName','==',username))),
        ];
        for (const s of strats) { try { const snap = await s(); if (!snap.empty) { data = snap.docs[0].data(); break; } } catch {} }
        if (!data) { try { const d = await getDoc(doc(db,'users',username)); if (d.exists()) data = d.data(); } catch {} }
        if (data) {
          setPd(data);
          setEd({ displayName: data.displayName||'', bio: data.bio||'', location: data.location||'', website: data.website||'' });
          try {
            const ps = await getDocs(query(collection(db,'forum'), where('uid','==',data.uid)));
            const pList = ps.docs.map(d => ({ id:d.id, ...d.data(), createdAt: d.data().createdAt?.toDate()||new Date() })) as Post[];
            setPosts(pList.sort((a,b) => b.createdAt - a.createdAt));
          } catch (e) { console.error('Posts fetch error:', e); }
          try {
            const all = await getDocs(collection(db,'forum'));
            setLikes(all.docs.filter(d => d.data().reactionsData?.[data.uid]).map(d => ({ id:d.id, ...d.data(), createdAt: d.data().createdAt?.toDate()||new Date() })) as Post[]);
            const rList: any[] = [];
            for (const p of all.docs) {
              try {
                const cs = await getDocs(query(collection(db,'forum',p.id,'comments'), where('uid','==',data.uid)));
                cs.docs.forEach(c => rList.push({ ...c.data(), id:c.id, postId:p.id, postBody:p.data().body?.slice(0,60), createdAt:c.data().createdAt?.toDate()||new Date() }));
              } catch {}
            }
            setReplies(rList.sort((a,b) => b.createdAt - a.createdAt));
          } catch (e) { console.error('Likes/replies fetch error:', e); }
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  useEffect(() => {
    if (!pd) return;
    const u1 = onSnapshot(query(collection(db,'follows'), where('followingId','==',pd.uid)), s => setFollowers(s.size));
    const u2 = onSnapshot(query(collection(db,'follows'), where('followerId','==',pd.uid)), s => setFollowings(s.size));
    if (user && !user.isAnonymous) getDoc(doc(db,'follows',`${user.uid}_${pd.uid}`)).then(d => setFollowing(d.exists()));
    return () => { u1(); u2(); };
  }, [pd, user]);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const q = query(collection(db, 'notifications'), where('toUid', '==', user.uid), where('read', '==', false));
    return onSnapshot(q, snap => setUnreadCount(snap.size));
  }, [user]);

  useEffect(() => {
    getDocs(query(collection(db, 'users'), limit(8))).then(snap => {
      const list = snap.docs.map(d => d.data()).filter((u: any) => u.uid !== pd?.uid && u.uid !== user?.uid);
      setSuggestedUsers(list.slice(0, 3));
    }).catch(() => {});
  }, [pd, user]);

  const uploadImg = async (file: File, path: string): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', `manav-platform/${path.split('/')[0]}`);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Yükleme başarısız oldu');
    }
    return data.url;
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !user) return;
    setUpPhoto(true);
    const toastId = toast.loading('Profil fotoğrafı Cloudinary\'ye yükleniyor...');
    try {
      const url = await uploadImg(f, `avatars/${user.uid}`);
      await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true });
      try { await updateProfile(user, { photoURL: url }); } catch {}
      setPd((p: any) => ({ ...p, photoURL: url }));
      toast.success('Profil fotoğrafı güncellendi!', { id: toastId });
    } catch (err: any) {
      console.error('handlePhoto error:', err);
      toast.error('Hata: ' + (err.message || 'Yükleme başarısız'), { id: toastId });
    } finally {
      setUpPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !user) return;
    setUpCover(true);
    const toastId = toast.loading('Kapak fotoğrafı Cloudinary\'ye yükleniyor...');
    try {
      const url = await uploadImg(f, `covers/${user.uid}`);
      await setDoc(doc(db, 'users', user.uid), { coverURL: url }, { merge: true });
      setPd((p: any) => ({ ...p, coverURL: url }));
      toast.success('Kapak fotoğrafı güncellendi!', { id: toastId });
    } catch (err: any) {
      console.error('handleCover error:', err);
      toast.error('Hata: ' + (err.message || 'Yükleme başarısız'), { id: toastId });
    } finally {
      setUpCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const toggleFollow = async () => {
    if (!user || user.isAnonymous || !pd) return toast.error('Giriş gerekli.');
    const fid = `${user.uid}_${pd.uid}`;
    if (following) { await deleteDoc(doc(db,'follows',fid)); setFollowing(false); }
    else { await setDoc(doc(db,'follows',fid), { followerId:user.uid, followingId:pd.uid, createdAt:serverTimestamp() }); setFollowing(true); }
  };

  const saveProfile = async () => {
    if (!user || !pd) return; setSaving(true);
    try { await updateDoc(doc(db,'users',user.uid), ed); setPd((p: any) => ({ ...p, ...ed })); setEditOpen(false); toast.success('Profil güncellendi!'); }
    catch { toast.error('Hata.'); } finally { setSaving(false); }
  };

  const delPost = async (id: string) => {
    if (!confirm('Silmek istediğine emin misin?')) return;
    await deleteDoc(doc(db,'forum',id)); setPosts(p => p.filter(x => x.id !== id)); toast.success('Silindi.');
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/forum?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!pd) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>👤 Hesap bulunamadı</p>
        <Link href="/forum" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>← Topluluğa Dön</Link>
      </div>
    );
  }

  const isOwn = user?.uid === pd.uid;
  const myUsername = userProfile?.username || user?.displayName?.toLowerCase().replace(/\s+/g, '') || '';
  const joined = pd.createdAt?.toDate?.().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) || '';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 1024px) {
          .profile-sidebar-right { display: none !important; }
          .profile-grid-3col { grid-template-columns: 240px 1fr !important; }
        }
        @media (max-width: 768px) {
          .profile-sidebar-left { display: none !important; }
          .profile-grid-3col { grid-template-columns: 1fr !important; padding-top: 56px !important; }
        }
        .profil-tab-btn:hover { background: #f8fafc; }
      `}</style>

      {/* 3-COLUMN X (TWITTER) LAYOUT */}
      <div className="profile-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: 0, paddingTop: 72 }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="profile-sidebar-left" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid #e2e8f0' }}>
          <div style={{ padding: '0 8px 16px', marginBottom: 8 }}>
            <Link href="/forum" style={{ textDecoration: 'none' }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                Topluluk
                <span style={{ fontSize: '0.6rem', background: '#0f172a', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>BETA</span>
              </h1>
            </Link>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>Psikoloji forumu</p>
          </div>

          {[
            { label: 'Ana Akış', href: '/forum', active: false, icon: <Home size={20} /> },
            { label: 'Takip Ettiklerim', href: '/forum?feed=following', active: false, icon: <Users size={20} /> },
            { label: 'Videolarım', href: '/videolarim', active: false, icon: <Film size={20} /> },
            { label: 'Yazılarım', href: '/yazilarim', active: false, icon: <FileText size={20} /> },
            { label: 'Bildirimler', href: '/bildirimler', active: false, icon: <Bell size={20} />, badge: unreadCount },
            { label: 'Profilim', href: `/forum/profil/${myUsername || username}`, active: isOwn, icon: <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{(userProfile?.displayName || user?.displayName || 'U')[0]}</div> },
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
          {CATEGORIES.filter(c => c !== 'Tümü').slice(0, 6).map(c => (
            <Link key={c} href={`/forum?cat=${encodeURIComponent(c)}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, color: '#64748b', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s' }}>
                <Hash size={14} /> {c}
              </div>
            </Link>
          ))}

          {user && !user.isAnonymous && (
            <Link href={`/forum/profil/${myUsername}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, textDecoration: 'none', marginTop: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
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

        {/* ── CENTER COLUMN (PROFILE) ── */}
        <main style={{ borderRight: '1px solid #e2e8f0', minHeight: 'calc(100vh - 72px)', background: 'white' }}>
          
          {/* Sticky header */}
          <div style={{ position: 'sticky', top: 72, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 20, zIndex: 100 }}>
            <Link href="/forum" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', textDecoration: 'none', color: '#0f172a' }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{pd.displayName || pd.username}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{posts.length} gönderi</div>
            </div>
          </div>

          {/* Cover Photo */}
          <div style={{ height: 220, position: 'relative', background: pd.coverURL ? 'transparent' : 'linear-gradient(135deg,#667eea,#764ba2)', backgroundImage: pd.coverURL ? `url(${pd.coverURL})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCover} />
            {isOwn && (
              <button onClick={() => coverRef.current?.click()} disabled={upCover} style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(0,0,0,0)', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 700, transition: 'background 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }} onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}>
                <Camera size={20} /> {upCover ? 'Yükleniyor...' : 'Kapak Değiştir'}
              </button>
            )}
          </div>

          {/* Avatar + Action Row */}
          <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -60, marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <div style={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid white', background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '2.4rem', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}>
                {pd.photoURL ? <img key={pd.photoURL} src={pd.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (pd.displayName || 'U')[0].toUpperCase()}
              </div>
              {isOwn && (
                <button onClick={() => photoRef.current?.click()} disabled={upPhoto} style={{ position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: '50%', border: '2px solid white', background: upPhoto ? '#64748b' : '#0f172a', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} title="Profil Resmini Değiştir">
                  <Camera size={15} />
                </button>
              )}
            </div>
            <div>
              {isOwn ? (
                <button onClick={() => setEditOpen(true)} style={{ border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a', borderRadius: 999, padding: '9px 24px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.15s' }}>
                  Profili Düzenle
                </button>
              ) : (
                <button onClick={toggleFollow} style={{ background: following ? 'white' : '#0f172a', color: following ? '#0f172a' : 'white', border: following ? '1.5px solid #e2e8f0' : 'none', borderRadius: 999, padding: '9px 24px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.15s' }}>
                  {following ? 'Takip Ediliyor' : 'Takip Et'}
                </button>
              )}
            </div>
          </div>

          {/* Profile Bio Details */}
          <div style={{ padding: '0 24px 24px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{pd.displayName || pd.username}</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '2px 0 14px', fontWeight: 500 }}>@{pd.username}</p>
            {pd.bio && <p style={{ fontSize: '1rem', color: '#334155', lineHeight: 1.6, marginBottom: 14 }}>{pd.bio}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, color: '#64748b', fontSize: '0.88rem', marginBottom: 16 }}>
              {pd.location && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={15} />{pd.location}</span>}
              {pd.website && (
                <a href={pd.website.startsWith('http') ? pd.website : `https://${pd.website}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                  <LinkIcon size={15} />{pd.website}
                </a>
              )}
              {joined && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={15} />Katıldı: {joined}</span>}
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: '0.92rem' }}>
              <span><strong style={{ color: '#0f172a' }}>{followings}</strong> <span style={{ color: '#94a3b8' }}>Takip edilen</span></span>
              <span><strong style={{ color: '#0f172a' }}>{followers}</strong> <span style={{ color: '#94a3b8' }}>Takipçi</span></span>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="profil-tabs" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #f1f5f9', position: 'sticky', top: 132, background: 'white', zIndex: 90 }}>
            {[['posts','Gönderiler'],['replies','Yanıtlar'],['likes','Beğeniler']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k as any)} className="profil-tab-btn" style={{ flex: 1, padding: '16px 12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.92rem', color: tab === k ? '#0f172a' : '#94a3b8', borderBottom: tab === k ? '3px solid #0f172a' : '3px solid transparent', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'posts' && (posts.length === 0 ? <Empty icon="📝" text="Henüz gönderi yok" /> : posts.map(p => <PostCard key={p.id} p={p} pd={pd} isOwn={isOwn} userEmail={user?.email || ''} onDelete={delPost} />))}
          {tab === 'replies' && (replies.length === 0 ? <Empty icon="💬" text="Henüz yanıt yok" /> : replies.map((r, i) => (
            <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8 }}>Yanıtladı: <em>"{r.postBody}..."</em></p>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                  {pd.photoURL ? <img key={pd.photoURL} src={pd.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (pd.displayName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{pd.displayName}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.82rem', marginLeft: 8 }}>· {r.createdAt?.toLocaleDateString?.('tr-TR')}</span>
                  <p style={{ margin: '6px 0 0', fontSize: '0.95rem', color: '#334155', lineHeight: 1.6 }}>{r.text}</p>
                </div>
              </div>
            </div>
          )))}
          {tab === 'likes' && (likes.length === 0 ? <Empty icon="❤️" text="Henüz beğeni yok" /> : likes.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 14, padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>{(p.authorName || 'U')[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{p.authorName}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>· {p.createdAt?.toLocaleDateString?.('tr-TR')}</span>
                </div>
                <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>{p.body}</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, color: '#94a3b8', fontSize: '0.82rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14} />{p.commentCount}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}><Heart size={14} fill="#ef4444" />{Object.keys(p.reactionsData || {}).length}</span>
                </div>
              </div>
            </div>
          )))}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="profile-sidebar-right" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Search box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f1f5f9', borderRadius: 12, padding: '12px 16px' }}>
            <Search size={17} color="#94a3b8" />
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              onKeyDown={handleSearchSubmit} 
              placeholder="Forumda veya kullanıcı ara..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: '#0f172a', width: '100%' }} 
            />
          </div>

          {/* Trending Topics Widget */}
          <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
              <TrendingUp size={18} color="#64748b" />
              <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>Gündemdekiler</h3>
            </div>
            {[
              { tag: 'Psikanaliz', count: '14 gönderi' },
              { tag: 'VaroluşveAnlam', count: '9 gönderi' },
              { tag: 'Rüyalar', count: '6 gönderi' },
              { tag: 'KaygıveDepresyon', count: '11 gönderi' },
              { tag: 'İlişkiler', count: '8 gönderi' },
            ].map(t => (
              <Link key={t.tag} href={`/forum?cat=${encodeURIComponent(t.tag)}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 18px', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>Psikoloji · Gündem</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>#{t.tag}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t.count}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Suggested Users (Kimi Takip Etmeli) */}
          {suggestedUsers.length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
                <Users size={18} color="#64748b" />
                <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>Kimi Takip Etmeli</h3>
              </div>
              {suggestedUsers.map((su: any) => (
                <div key={su.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #f1f5f9' }}>
                  <Link href={`/forum/profil/${encodeURIComponent(su.username || '')}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>
                      {su.photoURL ? <img src={su.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (su.displayName || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{su.displayName || su.username}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>@{su.username}</div>
                    </div>
                  </Link>
                  <Link href={`/forum/profil/${encodeURIComponent(su.username || '')}`} style={{ padding: '6px 14px', borderRadius: 999, background: '#0f172a', color: 'white', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                    Gör
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Footer & Copyright */}
          <div style={{ padding: '0 8px', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginBottom: 8 }}>
              <Link href="/gizlilik" style={{ color: '#94a3b8', textDecoration: 'none' }}>Gizlilik Politikası</Link>
              <Link href="/iletisim" style={{ color: '#94a3b8', textDecoration: 'none' }}>İletişim</Link>
              <Link href="/ben-kimim" style={{ color: '#94a3b8', textDecoration: 'none' }}>Hakkında</Link>
            </div>
            <div>© 2026 Furkan Manav · Psikoloji Platformu</div>
          </div>
        </aside>

      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditOpen(false)}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', marginBottom: 24 }}>Profili Düzenle</h2>
            {([['displayName','Ad Soyad','text','Adınız'],['bio','Hakkımda','textarea','Kendinizden bahsedin...'],['location','Konum','text','Şehir, Ülke'],['website','Web Sitesi','text','ornek.com']] as const).map(([k,l,t,ph]) => (
              <div key={k} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{l}</label>
                {t === 'textarea'
                  ? <textarea rows={3} placeholder={ph} value={ed[k as keyof typeof ed]} onChange={e => setEd({...ed,[k]:e.target.value})} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: '0.93rem', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  : <input type="text" placeholder={ph} value={ed[k as keyof typeof ed]} onChange={e => setEd({...ed,[k]:e.target.value})} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: '0.93rem', outline: 'none', boxSizing: 'border-box' }} />
                }
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setEditOpen(false)} style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 999, padding: '12px', fontWeight: 700, cursor: 'pointer', background: 'white', color: '#0f172a' }}>İptal</button>
              <button onClick={saveProfile} disabled={saving} style={{ flex: 1, background: '#0f172a', color: 'white', border: 'none', borderRadius: 999, padding: '12px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
