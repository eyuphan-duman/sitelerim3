'use client';
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MessageCircle, Heart, Calendar, MapPin, BadgeCheck, Camera, Edit3, UserPlus, UserCheck, Settings, Trash2, Hash, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import toast from 'react-hot-toast';

interface Post {
  id: string; title?: string; body: string; authorName: string; uid: string;
  createdAt: any; commentCount: number; reactionsData?: Record<string, string>; category?: string;
}

const CATEGORIES = ['Psikanaliz','Varoluş & Anlam','Kaygı & Depresyon','İlişkiler','Çocukluk & Travma','Rüyalar','Kimlik & Benlik','Kişisel Gelişim'];
const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

export default function ProfilPage({ params: paramsPromise }: { params: Promise<{ username: string }> }) {
  const params = use(paramsPromise);
  const { user, userProfile } = useAuth();
  const username = decodeURIComponent(params.username);

  const [profileData, setProfileData] = useState<any>(null);
  const [tab, setTab] = useState<'posts' | 'likes'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', location: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        let pData: any = null;
        const strategies = [
          () => getDocs(query(collection(db, 'users'), where('username', '==', username))),
          () => getDocs(query(collection(db, 'users'), where('username', '==', username.toLowerCase()))),
          () => getDocs(query(collection(db, 'users'), where('displayName', '==', username))),
        ];
        for (const strategy of strategies) {
          const snap = await strategy();
          if (!snap.empty) { pData = snap.docs[0].data(); break; }
        }
        if (!pData) {
          const docSnap = await getDoc(doc(db, 'users', username));
          if (docSnap.exists()) pData = docSnap.data();
        }
        if (!pData) {
          const all = await getDocs(collection(db, 'users'));
          const found = all.docs.find(d => {
            const dn = d.data().displayName || '';
            return dn.toLowerCase().replace(/\s+/g, '') === username.toLowerCase().replace(/\s+/g, '');
          });
          if (found) pData = found.data();
        }
        if (pData) {
          setProfileData(pData);
          setEditData({ displayName: pData.displayName || '', location: pData.location || '', bio: pData.bio || '' });
          const postsSnap = await getDocs(query(collection(db, 'forum'), where('uid', '==', pData.uid)));
          const fetched = postsSnap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[];
          setPosts(fetched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!profileData) return;
    const uid = profileData.uid;
    const unsub1 = onSnapshot(query(collection(db, 'follows'), where('followingId', '==', uid)), snap => setFollowerCount(snap.size));
    const unsub2 = onSnapshot(query(collection(db, 'follows'), where('followerId', '==', uid)), snap => setFollowingCount(snap.size));
    if (user && !user.isAnonymous) {
      const followId = `${user.uid}_${uid}`;
      getDoc(doc(db, 'follows', followId)).then(d => setIsFollowing(d.exists()));
    }
    return () => { unsub1(); unsub2(); };
  }, [profileData, user]);

  const toggleFollow = async () => {
    if (!user || user.isAnonymous || !profileData) return toast.error('Takip etmek için giriş gerekli.');
    const followId = `${user.uid}_${profileData.uid}`;
    const ref2 = doc(db, 'follows', followId);
    if (isFollowing) {
      await deleteDoc(ref2);
      setIsFollowing(false);
      toast.success('Takipten çıkıldı.');
    } else {
      await setDoc(ref2, { followerId: user.uid, followingId: profileData.uid, createdAt: serverTimestamp() });
      setIsFollowing(true);
      toast.success('Takip edildi!');
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed', null, reject, async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      });
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) return toast.error('Sadece görsel yüklenebilir.');
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file, `avatars/${user.uid}`);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      setProfileData((prev: any) => ({ ...prev, photoURL: url }));
      toast.success('Profil fotoğrafı güncellendi!');
    } catch { toast.error('Yükleme hatası.'); }
    finally { setUploadingPhoto(false); }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) return toast.error('Sadece görsel yüklenebilir.');
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, `covers/${user.uid}`);
      await updateDoc(doc(db, 'users', user.uid), { coverURL: url });
      setProfileData((prev: any) => ({ ...prev, coverURL: url }));
      toast.success('Kapak fotoğrafı güncellendi!');
    } catch { toast.error('Yükleme hatası.'); }
    finally { setUploadingCover(false); }
  };

  const handleSaveProfile = async () => {
    if (!user || !profileData) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName: editData.displayName, location: editData.location, bio: editData.bio });
      setProfileData((prev: any) => ({ ...prev, ...editData }));
      setEditOpen(false);
      toast.success('Profil güncellendi!');
    } catch { toast.error('Güncelleme hatası.'); }
    finally { setSaving(false); }
  };

  const deletePost = async (id: string) => {
    if (confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'forum', id));
        setPosts(prev => prev.filter(p => p.id !== id));
        toast.success('Silindi.');
      } catch (e: any) {
        toast.error('Silme hatası: ' + e.message);
      }
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!profileData) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>👤</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Hesap bulunamadı</h1>
      <Link href="/forum" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>← Foruma Dön</Link>
    </div>
  );

  const isOwn = user?.uid === profileData.uid;
  const joinDate = profileData.createdAt?.toDate ? profileData.createdAt.toDate().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : 'Nisan 2024';

  return (
    <>
      <title>{profileData.displayName || profileData.username} — Furkan Manav Forum</title>
      <meta name="description" content={`${profileData.displayName} kullanıcısının Furkan Manav psikoloji forumu profili.`} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div className="profile-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 0, paddingTop: 72 }}>

          {/* LEFT SIDEBAR - Kategoriler */}
          <aside style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 12px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ padding: '0 8px 16px' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Kategoriler</h3>
            </div>
            {CATEGORIES.map(c => (
              <Link key={c} href="/forum" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#64748b', fontWeight: 500, fontSize: '0.88rem', transition: 'all 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <Hash size={15} /> {c}
              </Link>
            ))}
          </aside>

          {/* CENTER - Profile */}
          <div style={{ background: 'white', minHeight: 'calc(100vh - 72px)', borderRight: '1px solid #e2e8f0' }}>

          {/* Header bar */}
          <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20, zIndex: 100, borderBottom: '1px solid #e2e8f0' }}>
            <Link href="/forum" style={{ color: '#0f172a', display: 'flex', alignItems: 'center', padding: 8, borderRadius: '50%', background: '#f1f5f9', transition: 'background 0.2s', textDecoration: 'none' }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>{profileData.displayName || profileData.username}</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>{posts.length} gönderi</p>
            </div>
          </div>

          {/* Cover photo */}
          <div style={{ height: 200, background: profileData.coverURL ? `url(${profileData.coverURL}) center/cover` : 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', position: 'relative' }}>
            {isOwn && (
              <>
                <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={handleCoverUpload} />
                <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'white', fontSize: '0.9rem', fontWeight: 600, opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '1')} onMouseOut={e => (e.currentTarget.style.opacity = '0')}>
                  <Camera size={20} /> {uploadingCover ? 'Yükleniyor...' : 'Kapak Fotoğrafı Değiştir'}
                </button>
              </>
            )}
          </div>

          {/* Profile section */}
          <div style={{ padding: '0 24px 24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              {/* Avatar */}
              <div style={{ position: 'relative', marginTop: -56 }}>
                <div style={{ width: 112, height: 112, borderRadius: '50%', border: '4px solid white', background: profileData.photoURL ? 'transparent' : 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  {profileData.photoURL ? (
                    <img src={profileData.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{(profileData.displayName || profileData.username || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                {isOwn && (
                  <>
                    <input type="file" accept="image/*" ref={photoInputRef} style={{ display: 'none' }} onChange={handlePhotoUpload} />
                    <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                      style={{ position: 'absolute', bottom: 4, right: 4, background: '#0f172a', border: '2px solid white', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                      <Camera size={13} />
                    </button>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                {isOwn ? (
                  <button onClick={() => setEditOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #e2e8f0', borderRadius: 999, padding: '8px 18px', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', transition: 'background 0.2s' }}>
                    <Edit3 size={15} /> Profili Düzenle
                  </button>
                ) : (
                  <button onClick={toggleFollow} style={{ display: 'flex', alignItems: 'center', gap: 6, border: isFollowing ? '1.5px solid #e2e8f0' : 'none', borderRadius: 999, padding: '10px 22px', background: isFollowing ? 'white' : '#0f172a', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: isFollowing ? '#0f172a' : 'white', transition: 'all 0.2s' }}>
                    {isFollowing ? <><UserCheck size={16} /> Takip Ediliyor</> : <><UserPlus size={16} /> Takip Et</>}
                  </button>
                )}
              </div>
            </div>

            {/* User info */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{profileData.displayName || profileData.username}</h2>
                {profileData.role === 'admin' && <BadgeCheck size={20} style={{ color: '#2563eb', fill: '#2563eb' }} />}
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: '0 0 12px' }}>@{profileData.username}</p>
              {(editData.bio || profileData.bio) && <p style={{ color: '#334155', fontSize: '0.97rem', lineHeight: 1.6, marginBottom: 12 }}>{profileData.bio}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', color: '#94a3b8', fontSize: '0.88rem' }}>
                {profileData.location && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={15} /> {profileData.location}</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={15} /> {joinDate} katıldı</span>
              </div>
            </div>

            {/* Follow stats */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
              <div style={{ cursor: 'pointer' }}>
                <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{followingCount}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.88rem', marginLeft: 4 }}>Takip edilen</span>
              </div>
              <div style={{ cursor: 'pointer' }}>
                <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{followerCount}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.88rem', marginLeft: 4 }}>Takipçi</span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 8, marginLeft: -24, marginRight: -24, paddingLeft: 24 }}>
              {[{ key: 'posts', label: 'Gönderiler' }, { key: 'likes', label: 'Beğeniler' }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)} style={{
                  padding: '14px 20px', border: 'none', cursor: 'pointer', background: 'transparent',
                  fontWeight: 700, fontSize: '0.95rem', color: tab === t.key ? '#0f172a' : '#94a3b8',
                  borderBottom: tab === t.key ? '3px solid #0f172a' : '3px solid transparent', transition: 'all 0.2s'
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Posts */}
          {tab === 'posts' && (
            posts.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📝</div>
                <h3 style={{ color: '#94a3b8', fontWeight: 700 }}>Henüz gönderi paylaşılmamış</h3>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, overflow: 'hidden' }}>
                    {profileData.photoURL ? <img src={profileData.photoURL} alt="pp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profileData.displayName || profileData.username || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{profileData.displayName || profileData.username}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{profileData.username}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>· {post.createdAt?.toLocaleDateString?.('tr-TR') || ''}</span>

                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{post.category}</div>
                    {post.title && <h4 style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: 6 }}>{post.title}</h4>}
                    <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{post.body}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#94a3b8', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MessageCircle size={15} /> {post.commentCount}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Heart size={15} /> {Object.keys(post.reactionsData || {}).length}</span>
                      {(isOwn || ADMIN_EMAILS.includes(user?.email || '')) && (
                        <button onClick={() => deletePost(post.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: 4, transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
                          onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          )}
          {tab === 'likes' && (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>❤️</div>
              <h3 style={{ color: '#94a3b8', fontWeight: 700 }}>Beğeniler gizli</h3>
            </div>
          )}
          </div>

          {/* RIGHT SIDEBAR - Gündem */}
          <aside style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
                <TrendingUp size={18} color="#64748b" />
                <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>Gündem</h3>
              </div>
              {CATEGORIES.slice(0, 6).map((cat, i) => (
                <Link key={cat} href="/forum" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '13px 18px', textDecoration: 'none', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>Psikoloji · Gündem</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>#{cat.replace(/\s+/g, '')}</div>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/forum" style={{ display: 'block', background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', textDecoration: 'none' }}>
              <h3 style={{ fontWeight: 800, color: 'white', fontSize: '1rem', marginBottom: 8 }}>Foruma Dön</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>Tartışmalara katılın.</p>
            </Link>
          </aside>

        </div>

        {/* Edit Modal */}
        {editOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditOpen(false)}>
            <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#0f172a', marginBottom: 24 }}>Profili Düzenle</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ad Soyad</label>
                  <input value={editData.displayName} onChange={e => setEditData({ ...editData, displayName: e.target.value })}
                    style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: '0.97rem', outline: 'none', color: '#0f172a', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Konum</label>
                  <input value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })}
                    placeholder="Şehir, Ülke" style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: '0.97rem', outline: 'none', color: '#0f172a', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hakkımda</label>
                  <textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })}
                    placeholder="Kendinizden bahsedin..." rows={3}
                    style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: '0.97rem', outline: 'none', color: '#0f172a', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setEditOpen(false)} style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 999, padding: '12px', fontWeight: 700, cursor: 'pointer', background: 'white', color: '#0f172a', fontSize: '0.95rem' }}>İptal</button>
                <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 1, background: '#0f172a', color: 'white', border: 'none', borderRadius: 999, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
