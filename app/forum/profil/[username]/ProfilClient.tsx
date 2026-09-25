'use client';
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Camera, MapPin, Link as LinkIcon, Calendar, 
  MessageCircle, Heart, Trash2, Home, Users, Film, FileText, 
  Bell, Search, TrendingUp, Hash, X, Check, Share2, CheckCircle, UserX, Clock,
  Upload, ExternalLink, ShieldCheck, Loader
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

function Empty({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8' }}>
      {icon && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>{icon}</div>}
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
            {Boolean((pd.isPsychologist && pd.psychologistStatus === 'approved') || (pd.isPsychologist && !pd.psychologistStatus)) && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  border: '1px solid rgba(201,169,110,0.4)',
                  color: '#facc15',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 999
                }}
                title="Doğrulanmış Lisanslı Psikolog"
              >
                <CheckCircle size={11} color="#facc15" />
                <span>{pd.title || 'Psikolog'}</span>
              </span>
            )}
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
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [trends, setTrends] = useState<{ tag: string; count: number }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const photoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploadingDiploma, setUploadingDiploma] = useState(false);

  const handleUploadDiploma = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingDiploma(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'manav-platform/diplomas');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Yükleme başarısız');

      await updateDoc(doc(db, 'users', user.uid), {
        diplomaUrl: data.url,
      });
      try {
        await setDoc(doc(db, 'psychologist_applications', user.uid), {
          uid: user.uid,
          diplomaUrl: data.url,
          username: pd?.username || user.displayName || '',
          email: user.email || '',
          fullName: pd?.displayName || user.displayName || '',
          title: pd?.title || 'Psikolog',
          university: pd?.university || '',
          status: pd?.psychologistStatus || 'pending',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch {}

      setPd((prev: any) => ({ ...prev, diplomaUrl: data.url }));
      toast.success('Diploma belgeniz başarıyla yüklendi!');
    } catch (err: any) {
      toast.error('Belge yüklenirken hata oluştu: ' + (err.message || ''));
    } finally {
      setUploadingDiploma(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let data: any = null;
        const decoded = decodeURIComponent(username).trim();

        // 1. Direct UID check (doc id or uid field)
        try {
          const directDoc = await getDoc(doc(db, 'users', decoded));
          if (directDoc.exists()) {
            data = directDoc.data();
          }
        } catch {}

        if (!data) {
          try {
            const uidSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', decoded)));
            if (!uidSnap.empty) data = uidSnap.docs[0].data();
          } catch {}
        }

        // 2. Exact match strategies on username and displayName
        if (!data) {
          const strats = [
            () => getDocs(query(collection(db, 'users'), where('username', '==', decoded))),
            () => getDocs(query(collection(db, 'users'), where('username', '==', decoded.toLowerCase()))),
            () => getDocs(query(collection(db, 'users'), where('displayName', '==', decoded))),
            () => getDocs(query(collection(db, 'users'), where('displayName', '==', decoded.toLowerCase()))),
          ];
          for (const s of strats) {
            try {
              const snap = await s();
              if (!snap.empty) {
                data = snap.docs[0].data();
                break;
              }
            } catch {}
          }
        }

        // 3. Resilient fuzzy scan (handles spaces, casing, Turkish characters, email prefixes)
        if (!data) {
          try {
            const allUsersSnap = await getDocs(collection(db, 'users'));
            const norm = (str: string) => 
              (str || '')
                .toLowerCase()
                .trim()
                .replace(/[\s_\-\.]+/g, '')
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ı/g, 'i')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c');
            
            const targetNorm = norm(decoded);

            for (const d of allUsersSnap.docs) {
              const u = d.data();
              const uNorm = norm(u.username);
              const dNorm = norm(u.displayName);
              const eNorm = norm(u.email ? u.email.split('@')[0] : '');
              if (uNorm === targetNorm || dNorm === targetNorm || eNorm === targetNorm) {
                data = { ...u, uid: u.uid || d.id };
                break;
              }
            }
          } catch (e) {
            console.error('Fuzzy user lookup error:', e);
          }
        }

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

  // Real following map for current user
  useEffect(() => {
    if (!user || user.isAnonymous) {
      setFollowingMap({});
      return;
    }
    const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
    return onSnapshot(q, snap => {
      const map: Record<string, boolean> = {};
      snap.docs.forEach(d => {
        map[d.data().followingId] = true;
      });
      setFollowingMap(map);
    });
  }, [user]);

  // Real suggested users (excluding self, currently viewed user, and already followed users)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const list = snap.docs
        .map(d => ({ ...d.data(), uid: d.data().uid || d.id }))
        .filter((u: any) => {
          if (!u.uid) return false;
          if (user && u.uid === user.uid) return false;
          if (pd && u.uid === pd.uid) return false;
          if (followingMap[u.uid]) return false;
          if (!u.displayName && !u.username) return false;
          return true;
        });
      setSuggestedUsers(list.slice(0, 4));
    });
    return () => unsub();
  }, [user, pd, followingMap]);

  // Real trending tags from forum posts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'forum'), snap => {
      const tagCounts: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (d.category && d.category !== 'Tümü') {
          tagCounts[d.category] = (tagCounts[d.category] || 0) + 1;
        }
        if (d.body) {
          const matches = d.body.match(/#([a-zA-Z0-9ğıüşöçİĞÜŞÖÇ_]+)/g);
          if (matches) {
            matches.forEach((m: string) => {
              const clean = m.replace('#', '');
              tagCounts[clean] = (tagCounts[clean] || 0) + 1;
            });
          }
        }
      });
      const sorted = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTrends(sorted);
    });
    return () => unsub();
  }, []);

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

  const handleFollowSuggested = async (e: React.MouseEvent, targetUid: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user.isAnonymous) {
      return toast.error('Takip etmek için giriş yapmalısınız.');
    }
    const fid = `${user.uid}_${targetUid}`;
    try {
      await setDoc(doc(db, 'follows', fid), {
        followerId: user.uid,
        followingId: targetUid,
        createdAt: serverTimestamp(),
      });
      toast.success('Takip edildi!');
    } catch {
      toast.error('Hata oluştu.');
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
        <UserX size={44} color="#94a3b8" style={{ marginBottom: 14 }} />
        <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Hesap bulunamadı</p>
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
                <span style={{ fontSize: '0.6rem', background: '#0f172a', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>v2.0</span>
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
          
          {/* Header (normal scroll, non-sticky) */}
          <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{pd.displayName || pd.username}</h1>
              {Boolean((pd.isPsychologist && pd.psychologistStatus === 'approved') || (pd.isPsychologist && !pd.psychologistStatus)) && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    border: '1px solid rgba(201,169,110,0.5)',
                    color: '#facc15',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 999,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                  title="Doğrulanmış Lisanslı Psikolog"
                >
                  <CheckCircle size={13} color="#facc15" />
                  <span>{pd.title || 'Psikolog'}</span>
                </span>
              )}
            </div>

            {isOwn && (pd.isPsychologist || pd.role === 'psychologist' || pd.role === 'psychologist_pending' || pd.psychologistStatus === 'pending') && (
              <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: pd.diplomaUrl ? '#f0fdf4' : '#fefce8', border: `1px solid ${pd.diplomaUrl ? '#bbf7d0' : '#fef08a'}`, color: pd.diplomaUrl ? '#166534' : '#854d0e', fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color={pd.diplomaUrl ? '#16a34a' : '#ca8a04'} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 700 }}>
                      {pd.diplomaUrl ? 'Diploma Belgeniz Sistemde Kayıtlı' : 'Diploma Belgeniz Henüz Yüklenmedi'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {pd.diplomaUrl && (
                      <a href={pd.diplomaUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#166534', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                        <ExternalLink size={13} /> Belgeyi Aç
                      </a>
                    )}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: pd.diplomaUrl ? '#ffffff' : '#ca8a04', color: pd.diplomaUrl ? '#166534' : '#ffffff', border: `1px solid ${pd.diplomaUrl ? '#bbf7d0' : '#ca8a04'}`, padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: uploadingDiploma ? 'wait' : 'pointer' }}>
                      {uploadingDiploma ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
                      <span>{uploadingDiploma ? 'Yükleniyor...' : (pd.diplomaUrl ? 'Belgeyi Güncelle' : 'Diploma Yükle')}</span>
                      <input type="file" accept="image/*,application/pdf" disabled={uploadingDiploma} style={{ display: 'none' }} onChange={handleUploadDiploma} />
                    </label>
                  </div>
                </div>
                {pd.psychologistStatus === 'pending' && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#a16207' }}>
                    Belgeniz yönetici incelemesindedir. Onayın ardından profilinizde onaylı psikolog rozeti aktifleşecektir.
                  </p>
                )}
              </div>
            )}
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 14px', fontWeight: 500 }}>@{((pd.username || pd.displayName || 'kullanici').toLowerCase().replace(/\s+/g, ''))}</p>
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
          <div className="profil-tabs" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #f1f5f9', background: 'white' }}>
            {[['posts','Gönderiler'],['replies','Yanıtlar'],['likes','Beğeniler']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k as any)} className="profil-tab-btn" style={{ flex: 1, padding: '16px 12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.92rem', color: tab === k ? '#0f172a' : '#94a3b8', borderBottom: tab === k ? '3px solid #0f172a' : '3px solid transparent', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'posts' && (posts.length === 0 ? <Empty icon={<FileText size={36} color="#cbd5e1" />} text="Henüz gönderi yok" /> : posts.map(p => <PostCard key={p.id} p={p} pd={pd} isOwn={isOwn} userEmail={user?.email || ''} onDelete={delPost} />))}
          {tab === 'replies' && (replies.length === 0 ? <Empty icon={<MessageCircle size={36} color="#cbd5e1" />} text="Henüz yanıt yok" /> : replies.map((r, i) => (
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
          {tab === 'likes' && (likes.length === 0 ? <Empty icon={<Heart size={36} color="#cbd5e1" />} text="Henüz beğeni yok" /> : likes.map(p => (
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
          {/* Search box - strictly searches forum */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', borderRadius: 12, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
            <Search size={17} color="#94a3b8" />
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Forumda ara..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: '#0f172a', width: '100%' }} 
            />
            <button 
              type="submit" 
              style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >
              Ara
            </button>
          </form>

          {/* Trending Topics Widget - Real tags & categories from forum posts */}
          <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
              <TrendingUp size={18} color="#64748b" />
              <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>Gündemdekiler</h3>
            </div>
            {trends.length > 0 ? (
              trends.map(t => (
                <Link key={t.tag} href={`/forum?search=${encodeURIComponent(t.tag)}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 18px', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>Psikoloji · Gündem</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>#{t.tag.replace(/\s+/g, '')}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t.count} gönderi</span>
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ padding: '20px 18px', color: '#94a3b8', fontSize: '0.84rem', textAlign: 'center' }}>
                Henüz etiket veya konu yok
              </div>
            )}
          </div>

          {/* Suggested Users (Kimi Takip Etmeli) - Real active members with follow action */}
          <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
              <Users size={18} color="#64748b" />
              <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>Kimi Takip Etmeli</h3>
            </div>
            {suggestedUsers.length > 0 ? (
              suggestedUsers.map((su: any) => {
                const suUsername = (su.username || su.displayName || 'kullanici').toLowerCase().replace(/\s+/g, '');
                return (
                  <div key={su.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #f1f5f9' }}>
                    <Link href={`/forum/profil/${encodeURIComponent(suUsername)}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0, flex: 1 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>
                        {su.photoURL ? <img src={su.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (su.displayName || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{su.displayName || su.username}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{suUsername}</div>
                      </div>
                    </Link>
                    <button 
                      onClick={(e) => handleFollowSuggested(e, su.uid)}
                      style={{ padding: '6px 14px', borderRadius: 999, background: '#0f172a', color: 'white', fontSize: '0.78rem', fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: 8, transition: 'all 0.15s' }}
                    >
                      Takip Et
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px 18px', color: '#94a3b8', fontSize: '0.84rem', textAlign: 'center' }}>
                Şu an için yeni öneri yok
              </div>
            )}
          </div>

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
