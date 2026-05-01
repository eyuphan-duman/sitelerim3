'use client';
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MessageCircle, Heart, Calendar, MapPin, BadgeCheck, Camera, Edit3, UserPlus, UserCheck, Settings, Trash2, Hash, TrendingUp, LinkIcon, Cake } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import toast from 'react-hot-toast';

interface Post {
  id: string; title?: string; body: string; authorName: string; uid: string;
  createdAt: any; commentCount: number; reactionsData?: Record<string, string>; category?: string;
}

const CATEGORIES = ['Psikanaliz','Varoluş & Anlam','Kaygı & Depresyon','İlişkiler','Çocukluk & Travma','Rüyalar','Kimlik & Benlik','Kişisel Gelişim'];
const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

export default function ProfilClient({ username }: { username: string }) {
  const { user, userProfile } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [tab, setTab] = useState<'posts' | 'replies' | 'likes'>('posts');
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', location: '', bio: '', website: '', birthday: '' });
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
        if (pData) {
          setProfileData(pData);
          setEditData({ displayName: pData.displayName || '', location: pData.location || '', bio: pData.bio || '', website: pData.website || '', birthday: pData.birthday || '' });
          const postsSnap = await getDocs(query(collection(db, 'forum'), where('uid', '==', pData.uid)));
          const fetched = postsSnap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[];
          setPosts(fetched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

          const allPostsSnap = await getDocs(collection(db, 'forum'));
          const liked = allPostsSnap.docs.filter(d => d.data().reactionsData?.[pData.uid]).map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[];
          setLikedPosts(liked.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

          const repliesList: any[] = [];
          for (const p of allPostsSnap.docs) {
            const commSnap = await getDocs(query(collection(db, 'forum', p.id, 'comments'), where('uid', '==', pData.uid)));
            commSnap.docs.forEach(c => repliesList.push({ ...c.data(), id: c.id, postId: p.id, postBody: p.data().body?.slice(0, 80), createdAt: c.data().createdAt?.toDate() || new Date() }));
          }
          setReplies(repliesList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
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
      await updateDoc(doc(db, 'users', user.uid), { displayName: editData.displayName, location: editData.location, bio: editData.bio, website: editData.website, birthday: editData.birthday });
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
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="profile-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 0, paddingTop: 72 }}>
        {/* LEFT SIDEBAR */}
        <aside className="profile-sidebar-left" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 12px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ padding: '0 8px 16px' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Kategoriler</h3>
          </div>
          {CATEGORIES.map(c => (
            <Link key={c} href="/forum" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', color: '#64748b', fontWeight: 500, fontSize: '0.88rem' }}>
              <Hash size={15} /> {c}
            </Link>
          ))}
        </aside>

        {/* CENTER */}
        <div style={{ background: 'white', minHeight: 'calc(100vh - 72px)', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20, zIndex: 100, borderBottom: '1px solid #e2e8f0' }}>
            <Link href="/forum" style={{ color: '#0f172a', display: 'flex', alignItems: 'center', padding: 8, borderRadius: '50%', background: '#f1f5f9', textDecoration: 'none' }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>{profileData.displayName || profileData.username}</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>{posts.length} gönderi</p>
            </div>
          </div>

          <div style={{ height: 200, backgroundImage: profileData.coverURL ? `url(${profileData.coverURL})` : undefined, background: profileData.coverURL ? undefined : 'linear-gradient(135deg,#667eea,#764ba2)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
            {isOwn && (
              <>
                <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={handleCoverUpload} />
                <button onClick={() => coverInputRef.current?.click()} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, transition: 'background 0.2s' }} onMouseOver={e=>{e.currentTarget.style.background='rgba(0,0,0,0.35)'}} onMouseOut={e=>{e.currentTarget.style.background='rgba(0,0,0,0)'}}>
                  <Camera size={20}/> {uploadingCover ? 'Yükleniyor...' : 'Kapak Değiştir'}
                </button>
              </>
            )}
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div style={{ position: 'relative', marginTop: -56 }}>
                <input type="file" accept="image/*" ref={photoInputRef} style={{ display: 'none' }} onChange={handlePhotoUpload} />
                <div style={{ width: 112, height: 112, borderRadius: '50%', border: '4px solid white', background: profileData.photoURL ? 'transparent' : 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                  {profileData.photoURL
                    ? <img key={profileData.photoURL} src={profileData.photoURL} alt="pp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{(profileData.displayName || 'U')[0].toUpperCase()}</span>
                  }
                </div>
                {isOwn && (
                  <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} style={{ position: 'absolute', bottom: 4, right: 4, background: uploadingPhoto ? '#64748b' : '#0f172a', border: '2px solid white', borderRadius: '50%', width: 32, height: 32, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                    <Camera size={14}/>
                  </button>
                )}
              </div>
              <div>
                {isOwn ? <button onClick={() => setEditOpen(true)} className="btn-dark-outline">Profili Düzenle</button> : <button onClick={toggleFollow} className="btn-gold">{isFollowing ? 'Takip Ediliyor' : 'Takip Et'}</button>}
              </div>
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{profileData.displayName || profileData.username}</h2>
            <p style={{ color: '#94a3b8', margin: '0 0 12px' }}>@{profileData.username}</p>
            {profileData.bio && <p style={{ fontSize: '0.97rem', marginBottom: 12 }}>{profileData.bio}</p>}
            
            <div style={{ display: 'flex', gap: 24 }}>
              <span><strong>{followingCount}</strong> <span style={{ color: '#94a3b8' }}>Takip edilen</span></span>
              <span><strong>{followerCount}</strong> <span style={{ color: '#94a3b8' }}>Takipçi</span></span>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginTop: 24 }}>
              {['posts', 'replies', 'likes'].map(t => (
                <button key={t} onClick={() => setTab(t as any)} style={{ padding: '14px 20px', border: 'none', background: 'none', fontWeight: 700, color: tab === t ? '#0f172a' : '#94a3b8', borderBottom: tab === t ? '2px solid #0f172a' : 'none', cursor: 'pointer' }}>{t === 'posts' ? 'Gönderiler' : t === 'replies' ? 'Yanıtlar' : 'Beğeniler'}</button>
              ))}
            </div>
          </div>

          {/* TAB CONTENT */}
          <div>
            {tab === 'posts' && (
              posts.length === 0
                ? <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}><div style={{ fontSize: '2rem', marginBottom: 12 }}>📝</div><p style={{ fontWeight: 700 }}>Henüz gönderi yok</p></div>
                : posts.map(p => (
                  <div key={p.id} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: profileData.photoURL ? 'transparent' : 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
                      {profileData.photoURL ? <img src={profileData.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profileData.displayName||'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{profileData.displayName || profileData.username}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{profileData.username}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>· {p.createdAt?.toLocaleDateString?.('tr-TR')}</span>
                      </div>
                      {p.category && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{p.category}</div>}
                      <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{p.body}</p>
                      <div style={{ display: 'flex', gap: 20, marginTop: 10, color: '#94a3b8', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MessageCircle size={15}/> {p.commentCount}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Heart size={15}/> {Object.keys(p.reactionsData||{}).length}</span>
                        {(isOwn || ADMIN_EMAILS.includes(user?.email||'')) && (
                          <button onClick={() => deletePost(p.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', padding: '2px 6px', borderRadius: 4, transition: 'all 0.2s' }} onMouseOver={e=>{e.currentTarget.style.color='#ef4444';e.currentTarget.style.background='#fef2f2'}} onMouseOut={e=>{e.currentTarget.style.color='#94a3b8';e.currentTarget.style.background='none'}}>
                            <Trash2 size={14}/> Sil
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
            {tab === 'replies' && (
              replies.length === 0
                ? <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}><div style={{ fontSize: '2rem', marginBottom: 12 }}>💬</div><p style={{ fontWeight: 700 }}>Henüz yanıt yok</p></div>
                : replies.map((r, i) => (
                  <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MessageCircle size={13}/> <span>Yanıt verdi:</span> <em style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, display: 'inline-block' }}>"{r.postBody}..."</em>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0, overflow: 'hidden' }}>
                        {profileData.photoURL ? <img src={profileData.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profileData.displayName||'U')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{profileData.displayName}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>· {r.createdAt?.toLocaleDateString?.('tr-TR')}</span>
                        </div>
                        <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, wordBreak: 'break-word' }}>{r.text}</p>
                      </div>
                    </div>
                  </div>
                ))
            )}
            {tab === 'likes' && (
              likedPosts.length === 0
                ? <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}><div style={{ fontSize: '2rem', marginBottom: 12 }}>❤️</div><p style={{ fontWeight: 700 }}>Henüz beğeni yok</p></div>
                : likedPosts.map(post => (
                  <div key={post.id} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                      {(post.authorName||'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{post.authorName}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>· {post.createdAt?.toLocaleDateString?.('tr-TR')}</span>
                      </div>
                      <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.body}</p>
                      <div style={{ display: 'flex', gap: 20, marginTop: 10, color: '#94a3b8', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MessageCircle size={15}/> {post.commentCount}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444' }}><Heart size={15} fill="#ef4444"/> {Object.keys(post.reactionsData||{}).length}</span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="profile-sidebar-right" style={{ position: 'sticky', top: 72, height: 'calc(100vh - 72px)', overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 18px', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>Kategoriler</div>
            {CATEGORIES.slice(0, 6).map(c => (
              <Link key={c} href="/forum" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', textDecoration: 'none', color: '#334155', fontSize: '0.88rem', fontWeight: 500, borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} onMouseOver={e=>(e.currentTarget.style.background='#f1f5f9')} onMouseOut={e=>(e.currentTarget.style.background='transparent')}>
                <Hash size={14}/> {c}
              </Link>
            ))}
          </div>
          <Link href="/forum" style={{ display: 'block', background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: '20px', textAlign: 'center', textDecoration: 'none' }}>
            <p style={{ fontWeight: 800, color: 'white', marginBottom: 6 }}>Foruma Dön</p>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Tartışmalara katılın.</p>
          </Link>
        </aside>
      </div>

      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditOpen(false)}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#0f172a', marginBottom: 24 }}>Profili Düzenle</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {([{ label: 'Ad Soyad', key: 'displayName', type: 'text', placeholder: 'Adınız' }, { label: 'Konum', key: 'location', type: 'text', placeholder: 'Şehir, Ülke' }, { label: 'Web Sitesi', key: 'website', type: 'text', placeholder: 'ornek.com' }, { label: 'Doğum Tarihi', key: 'birthday', type: 'date', placeholder: '' }] as const).map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={editData[field.key]} onChange={e => setEditData({ ...editData, [field.key]: e.target.value })} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: '0.97rem', outline: 'none', color: '#0f172a', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hakkımda</label>
                <textarea rows={3} placeholder="Kendinizden bahsedin..." value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: '0.97rem', outline: 'none', color: '#0f172a', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setEditOpen(false)} style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 999, padding: '12px', fontWeight: 700, cursor: 'pointer', background: 'white', color: '#0f172a', fontSize: '0.95rem' }}>İptal</button>
              <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 1, background: '#0f172a', color: 'white', border: 'none', borderRadius: 999, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', opacity: saving ? 0.7 : 1 }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
