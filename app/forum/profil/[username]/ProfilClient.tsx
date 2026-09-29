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
  Upload, ExternalLink, ShieldCheck, Loader, Bookmark, Repeat2, User,
  Settings, Lock, EyeOff, Shield, SlidersHorizontal, Plus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatTimeAgo, renderTextWithMentions } from '@/components/forum/ThreadView';

interface Post { 
  id: string; body: string; authorName: string; authorUsername?: string; uid: string; 
  createdAt: any; commentCount: number; reactionsData?: Record<string, string>; 
  repostsData?: Record<string, any>; bookmarksData?: Record<string, any>;
  category?: string; imageUrl?: string; authorPhotoURL?: string;
  authorIsPsychologist?: boolean; isPsychologist?: boolean;
  isRepost?: boolean; originalPostId?: string; originalAuthorName?: string;
  originalAuthorUsername?: string; originalAuthorPhotoURL?: string; originalAuthorIsPsychologist?: boolean;
}

const CATEGORIES = ['Tümü','Psikanaliz','Varoluş & Anlam','Kaygı & Depresyon','İlişkiler','Çocukluk & Travma','Rüyalar','Kimlik & Benlik','Kişisel Gelişim'];
const ADMIN = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

function Empty({ icon, text, isDark }: { icon?: React.ReactNode; text: string; isDark?: boolean }) {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: isDark ? '#71767b' : '#94a3b8' }}>
      {icon && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>{icon}</div>}
      <p style={{ fontWeight: 700, fontSize: '1rem', color: isDark ? '#94a3b8' : '#64748b' }}>{text}</p>
    </div>
  );
}

function PostCard({ 
  p, 
  pd, 
  isOwn, 
  userEmail, 
  onDelete,
  repostedBy,
  isDark = false
}: { 
  p: Post; 
  pd: any; 
  isOwn: boolean; 
  userEmail: string; 
  onDelete: (id: string) => void;
  repostedBy?: string;
  isDark?: boolean;
}) {
  const router = useRouter();
  const isRepost = Boolean(p.isRepost);
  const authorName = (isRepost && p.originalAuthorName) ? p.originalAuthorName : (p.authorName || 'Kullanıcı');
  const authorUsername = (isRepost && p.originalAuthorUsername) ? p.originalAuthorUsername : (p.authorUsername || authorName.toLowerCase().replace(/\s+/g, '') || 'kullanici');
  const isPsych = Boolean(isRepost && p.originalAuthorIsPsychologist !== undefined ? p.originalAuthorIsPsychologist : p.authorIsPsychologist);

  const initialPhoto = (isRepost && p.originalAuthorPhotoURL) 
    ? p.originalAuthorPhotoURL 
    : (p.authorPhotoURL || (p.uid === pd?.uid ? pd?.photoURL : undefined) || (p.authorUsername && pd?.username && p.authorUsername.toLowerCase() === pd.username.toLowerCase() ? pd?.photoURL : undefined));
  const [authorPic, setAuthorPic] = useState<string | undefined>(initialPhoto);

  useEffect(() => {
    const candidate = (isRepost && p.originalAuthorPhotoURL)
      ? p.originalAuthorPhotoURL
      : (p.authorPhotoURL || (p.uid === pd?.uid ? pd?.photoURL : undefined) || (p.authorUsername && pd?.username && p.authorUsername.toLowerCase() === pd.username.toLowerCase() ? pd?.photoURL : undefined));
    if (candidate) {
      setAuthorPic(candidate);
      return;
    }
    const targetUid = p.uid;
    if (!targetUid) return;
    const unsub = onSnapshot(doc(db, 'users', targetUid), snap => {
      if (snap.exists() && snap.data()?.photoURL) {
        setAuthorPic(snap.data().photoURL);
      }
    });
    return () => unsub();
  }, [p.uid, p.authorPhotoURL, p.isRepost, p.originalAuthorPhotoURL, pd?.uid, pd?.photoURL, pd?.username, p.authorUsername]);

  return (
    <div 
      className="profile-card-item"
      style={{ padding: '20px 24px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, transition: 'background 0.15s', background: isDark ? '#000000' : 'white', cursor: 'pointer', minWidth: 0, width: '100%', boxSizing: 'border-box' }}
      onClick={() => router.push(`/forum?thread=${p.id}`)}
      onMouseOver={e => (e.currentTarget.style.background = isDark ? '#080808' : '#fafbfc')}
      onMouseOut={e => (e.currentTarget.style.background = isDark ? '#000000' : 'white')}
    >
      {/* Repost banner */}
      {repostedBy && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8, paddingLeft: 46 }}>
          <Repeat2 size={13} strokeWidth={2.4} />
          <span>{repostedBy} yeniden gönderdi</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>
          {authorPic ? <img key={authorPic} src={authorPic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorName[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.96rem' }}>{authorName}</span>
              {isPsych && (
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
                  <span>Psikolog</span>
                </span>
              )}
              <span style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.85rem' }}>@{authorUsername}</span>
              <span style={{ color: isDark ? '#333639' : '#cbd5e1', fontSize: '0.85rem' }}>·</span>
              <span style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.82rem' }}>{formatTimeAgo(p.createdAt)}</span>
              {p.category && <span style={{ background: isDark ? '#16181c' : '#f1f5f9', color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em', border: isDark ? '1px solid #2f3336' : 'none' }}>{p.category}</span>}
            </div>
            {(isOwn && !repostedBy) && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#71767b' : '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 6, transition: 'all 0.15s' }} onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = isDark ? '#1f1315' : '#fef2f2'; }} onMouseOut={e => { e.currentTarget.style.color = isDark ? '#71767b' : '#94a3b8'; e.currentTarget.style.background = 'none'; }} title="Gönderiyi Sil">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p style={{ color: isDark ? '#d1d5db' : '#334155', fontSize: '0.97rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {renderTextWithMentions(p.body)}
          </p>
          
          {p.imageUrl && (
            <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', maxHeight: 380, border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, background: isDark ? '#05070a' : '#f8fafc' }}>
              <img src={p.imageUrl} alt="" style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, marginTop: 12, color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}><MessageCircle size={15} />{p.commentCount || 0}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}><Heart size={15} />{Object.keys(p.reactionsData || {}).length}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}><Repeat2 size={15} />{Object.keys(p.repostsData || {}).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilClient({ username }: { username: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pd, setPd] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [reposts, setReposts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [tab, setTab] = useState<'posts'|'replies'|'reposts'|'likes'|'bookmarks'>('posts');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followings, setFollowings] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ed, setEd] = useState({ 
    displayName: '', 
    username: '', 
    bio: '', 
    location: '', 
    website: '',
    hideLikes: false,
    hideReplies: false
  });
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

  // Dark Mode State
  const [isDark, setIsDark] = useState<boolean>(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('forum_theme');
      if (saved) setIsDark(saved === 'dark');
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDark(true);
    } catch {}
  }, []);

  const skipSplashAndGo = (href: string) => {
    try {
      sessionStorage.setItem('forum_skip_splash', 'true');
      sessionStorage.setItem('forum_splash_shown', '1');
    } catch (e) {}
    router.push(href);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('forum-dark-body');
    } else {
      document.documentElement.classList.remove('forum-dark-body');
    }
    return () => {
      document.documentElement.classList.remove('forum-dark-body');
    };
  }, [isDark]);

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
    let isCancelled = false;

    (async () => {
      setLoading(true);
      try {
        let data: any = null;
        const decoded = decodeURIComponent(username).trim();

        // 1. Fast-path: Check if viewing self
        const isSelfMatch = Boolean(
          user && (
            decoded === user.uid ||
            (userProfile?.username && decoded.toLowerCase() === userProfile.username.toLowerCase()) ||
            (user.displayName && decoded.toLowerCase() === user.displayName.toLowerCase().replace(/\s+/g, '')) ||
            (user.email && decoded.toLowerCase() === user.email.split('@')[0].toLowerCase().replace(/\s+/g, '')) ||
            decoded === 'me'
          )
        );

        if (isSelfMatch && userProfile && user) {
          data = { ...userProfile, uid: user.uid };
        }

        // 2. Direct UID check (doc id or uid field)
        if (!data) {
          try {
            const directDoc = await getDoc(doc(db, 'users', decoded));
            if (directDoc.exists()) {
              const dData = directDoc.data();
              data = { ...dData, uid: dData.uid || directDoc.id };
            }
          } catch {}
        }

        if (!data) {
          try {
            const uidSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', decoded)));
            if (!uidSnap.empty) {
              const docSnap = uidSnap.docs[0];
              data = { ...docSnap.data(), uid: docSnap.data().uid || docSnap.id };
            }
          } catch {}
        }

        // 3. Exact match strategies on username and displayName
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
                const docSnap = snap.docs[0];
                data = { ...docSnap.data(), uid: docSnap.data().uid || docSnap.id };
                break;
              }
            } catch {}
          }
        }

        // 4. Resilient fuzzy scan (handles spaces, casing, Turkish characters, email prefixes)
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

        if (isCancelled) return;

        if (data) {
          setPd(data);
          setEd({ 
            displayName: data.displayName || '', 
            username: data.username || '', 
            bio: data.bio || '', 
            location: data.location || '', 
            website: data.website || '',
            hideLikes: Boolean(data.hideLikes),
            hideReplies: Boolean(data.hideReplies)
          });

          // Fetch primary user posts first
          try {
            const ps = await getDocs(query(collection(db, 'forum'), where('uid', '==', data.uid)));
            const pList = (ps.docs
              .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[])
              .filter(p => !p.isRepost);
            if (!isCancelled) {
              setPosts(pList.sort((a, b) => b.createdAt - a.createdAt));
            }
          } catch (e) { 
            console.error('Posts fetch error:', e); 
          }

          // Unblock loading immediately so user sees profile without waiting
          if (!isCancelled) {
            setLoading(false);
          }

          // Asynchronously fetch remaining tabs in background
          try {
            const all = await getDocs(collection(db, 'forum'));
            if (isCancelled) return;
            
            // 1. Reposts
            const repostList = all.docs
              .filter(d => !d.data().isRepost && d.data().repostsData?.[data.uid])
              .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[];
            if (!isCancelled) setReposts(repostList.sort((a, b) => b.createdAt - a.createdAt));

            // 2. Likes (only if viewer is owner or owner allows public likes)
            const isViewerOwn = Boolean(user && user.uid === data.uid);
            if (isViewerOwn || !data.hideLikes) {
              const likeList = all.docs
                .filter(d => !d.data().isRepost && d.data().reactionsData?.[data.uid])
                .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[];
              if (!isCancelled) setLikes(likeList.sort((a, b) => b.createdAt - a.createdAt));
            }

            // 3. Bookmarks (STRICTLY OWNER ONLY: never queried or displayed to other users)
            if (isViewerOwn) {
              let bookmarkedIds: string[] = [];
              try {
                const bSnap = await getDocs(collection(db, 'users', data.uid, 'bookmarks'));
                bookmarkedIds = bSnap.docs.map(d => d.id);
              } catch {}

              const bPosts = all.docs
                .filter(d => !d.data().isRepost && (d.data().bookmarksData?.[data.uid] || bookmarkedIds.includes(d.id)))
                .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[];
              if (!isCancelled) setBookmarks(bPosts.sort((a, b) => b.createdAt - a.createdAt));
            }

            // 4. Replies (run concurrently with Promise.all over recent posts)
            if (isViewerOwn || !data.hideReplies) {
              const candidatePosts = all.docs.filter(d => !d.data().isRepost).slice(0, 30);
              const replyPromises = candidatePosts.map(p =>
                getDocs(query(collection(db, 'forum', p.id, 'comments'), where('uid', '==', data.uid)))
                  .then(cs => cs.docs.map(c => ({
                    ...c.data(),
                    id: c.id,
                    postId: p.id,
                    postBody: p.data().body?.slice(0, 60),
                    createdAt: c.data().createdAt?.toDate() || new Date()
                  })))
                  .catch(() => [])
              );
              const results = await Promise.all(replyPromises);
              const rList = results.flat();
              if (!isCancelled) {
                setReplies(rList.sort((a, b) => b.createdAt - a.createdAt));
              }
            }
          } catch (e) { 
            console.error('Secondary profile data fetch error:', e); 
          }
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [username, user, userProfile]);

  useEffect(() => {
    const isViewerOwn = Boolean(user && pd && user.uid === pd.uid);
    const t = searchParams.get('tab');
    if (t === 'bookmarks') {
      if (isViewerOwn) {
        setTab('bookmarks');
      } else {
        setTab('posts');
      }
    } else if (t === 'likes') {
      if (isViewerOwn || !pd?.hideLikes) {
        setTab('likes');
      } else {
        setTab('posts');
      }
    } else if (t === 'replies') {
      if (isViewerOwn || !pd?.hideReplies) {
        setTab('replies');
      } else {
        setTab('posts');
      }
    } else if (t === 'reposts' || t === 'posts') {
      setTab(t as any);
    }
  }, [searchParams, user, pd]);

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
    if (!user || !pd) return; 
    setSaving(true);
    try { 
      const cleanUsername = (ed.username || pd.username || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_\.]/g, '');

      const payload = {
        displayName: ed.displayName.trim() || pd.displayName || 'Kullanıcı',
        username: cleanUsername,
        bio: ed.bio.trim(),
        location: ed.location.trim(),
        website: ed.website.trim(),
        hideLikes: Boolean(ed.hideLikes),
        hideReplies: Boolean(ed.hideReplies)
      };

      await updateDoc(doc(db, 'users', user.uid), payload);
      try { 
        await updateProfile(user, { displayName: payload.displayName }); 
      } catch {}

      setPd((p: any) => ({ ...p, ...payload })); 
      setEditOpen(false); 
      setSettingsOpen(false);
      toast.success('Profil ve ayarlar kaydedildi!'); 
    }
    catch (err: any) { 
      console.error('saveProfile error:', err);
      toast.error('Hata: ' + (err.message || 'Kaydedilemedi')); 
    } finally { 
      setSaving(false); 
    }
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
      <div data-forum-page="true" data-forum-dark={isDark ? 'true' : 'false'} className={isDark ? 'forum-dark' : ''} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#000000' : '#f8fafc' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, borderTopColor: isDark ? '#1d9bf0' : '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!pd) {
    return (
      <div data-forum-page="true" data-forum-dark={isDark ? 'true' : 'false'} className={isDark ? 'forum-dark' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDark ? '#000000' : '#f8fafc', padding: 20 }}>
        <UserX size={44} color="#94a3b8" style={{ marginBottom: 14 }} />
        <p style={{ fontSize: '1.3rem', fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', marginBottom: 16 }}>Hesap bulunamadı</p>
        <Link href="/forum" style={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, textDecoration: 'none' }}>← Topluluğa Dön</Link>
      </div>
    );
  }

  const isOwn = Boolean(user && pd && user.uid === pd.uid);
  const myUsername = userProfile?.username || (user?.displayName || '').toLowerCase().replace(/\s+/g, '') || (user?.email ? user.email.split('@')[0].toLowerCase().replace(/\s+/g, '') : '') || user?.uid || '';
  const joined = pd.createdAt?.toDate?.().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) || '';

  const profileTabs = [
    { id: 'posts', label: 'Gönderiler' },
    ...((isOwn || !pd?.hideReplies) ? [{ id: 'replies', label: 'Yanıtlar' }] : []),
    { id: 'reposts', label: 'Yeniden gönderiler' },
    ...((isOwn || !pd?.hideLikes) ? [{ id: 'likes', label: 'Beğeniler' }] : []),
    ...(isOwn ? [{ id: 'bookmarks', label: 'Yer İşaretleri' }] : []),
  ];

  return (
    <div data-forum-page="true" data-forum-dark={isDark ? 'true' : 'false'} className={isDark ? 'forum-dark' : ''} style={{ minHeight: '100vh', background: isDark ? '#000000' : '#f8fafc', overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 1024px) {
          .profile-sidebar-right { display: none !important; }
          .profile-grid-3col { grid-template-columns: 240px 1fr !important; }
        }
        @media (max-width: 768px) {
          .profile-sidebar-left { display: none !important; }
          .profile-sidebar-right { display: none !important; }
          .profile-grid-3col { 
            grid-template-columns: 100% !important; 
            padding-top: 56px !important; 
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
          .profile-main-col {
            width: 100% !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            overflow-x: hidden !important;
            border-right: none !important;
            padding-bottom: 76px !important;
          }
          .profile-cover {
            height: 140px !important;
          }
          .profile-avatar-wrap {
            margin-top: -42px !important;
            padding: 0 16px !important;
            margin-bottom: 12px !important;
          }
          .profile-avatar {
            width: 82px !important;
            height: 82px !important;
            font-size: 1.8rem !important;
            border-width: 3px !important;
          }
          .profile-btn-action {
            padding: 7px 16px !important;
            font-size: 0.84rem !important;
          }
          .profile-bio-wrap {
            padding: 0 16px 16px !important;
          }
          .profile-bio-name {
            font-size: 1.25rem !important;
          }
          .profile-card-item {
            padding: 14px 16px !important;
          }
          .profil-tabs {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          .profil-tabs::-webkit-scrollbar {
            display: none !important;
          }
          .profil-tab-btn {
            flex: none !important;
            padding: 14px 16px !important;
            font-size: 0.88rem !important;
            white-space: nowrap !important;
          }
        }
        .profil-tab-btn:hover { background: #f8fafc; }
      `}</style>

      {/* 3-COLUMN X (TWITTER) LAYOUT */}
      <div className="profile-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: 0, paddingTop: 0, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="profile-sidebar-left" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderRight: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, background: isDark ? '#000000' : 'transparent' }}>
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
            { label: 'Ana Akış', href: '/forum', active: false, icon: <Home size={20} /> },
            { label: 'Takip Ettiklerim', href: '/forum?feed=following', active: false, icon: <Users size={20} /> },
            { label: 'Yer İşaretleri', href: `/forum/profil/${myUsername || username}?tab=bookmarks`, active: tab === 'bookmarks', icon: <Bookmark size={20} /> },
            { label: 'Arama', href: '/forum?search=open', active: false, icon: <Search size={20} /> },
            { label: 'Beğenilenler', href: `/forum/profil/${myUsername || username}?tab=likes`, active: tab === 'likes', icon: <Heart size={20} /> },
            { label: 'Bildirimler', href: '/bildirimler', active: false, icon: <Bell size={20} />, badge: unreadCount },
            { label: 'Profilim', href: `/forum/profil/${myUsername || username}`, active: isOwn && tab !== 'bookmarks' && tab !== 'likes', icon: <div style={{ width: 22, height: 22, borderRadius: '50%', background: isOwn && tab !== 'bookmarks' && tab !== 'likes' ? (isDark ? '#38bdf8' : '#334155') : (isDark ? '#1d9bf0' : '#0f172a'), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{(userProfile?.displayName || user?.displayName || 'U')[0]}</div> },
          ].map(item => (
            <Link 
              key={item.label} 
              href={item.href} 
              onClick={() => {
                if (item.href.startsWith('/forum')) {
                  try {
                    sessionStorage.setItem('forum_skip_splash', 'true');
                    sessionStorage.setItem('forum_splash_shown', '1');
                  } catch (e) {}
                }
              }}
              style={{ textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 12, background: item.active ? (isDark ? '#e7e9ea' : '#0f172a') : 'transparent', color: item.active ? (isDark ? '#000000' : 'white') : (isDark ? '#e7e9ea' : '#475569'), fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', cursor: 'pointer' }}>
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

          <div style={{ margin: '16px 0 8px', padding: '0 8px', fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#71767b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kategoriler</div>
          {CATEGORIES.filter(c => c !== 'Tümü').slice(0, 6).map(c => (
            <Link key={c} href={`/forum?cat=${encodeURIComponent(c)}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, color: isDark ? '#71767b' : '#64748b', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s' }}>
                <Hash size={14} /> {c}
              </div>
            </Link>
          ))}

          {user && !user.isAnonymous && (
            <Link href={`/forum/profil/${myUsername}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, textDecoration: 'none', marginTop: 'auto', background: isDark ? '#16181c' : '#f8fafc', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
                {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile?.displayName || user.displayName}</div>
                <div style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.8rem' }}>@{myUsername}</div>
              </div>
            </Link>
          )}
        </aside>

        {/* ── CENTER COLUMN (PROFILE) ── */}
        <main className="profile-main-col" style={{ borderRight: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, minHeight: '100vh', background: isDark ? '#000000' : 'white', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          
          {/* Header (normal scroll, non-sticky) */}
          <div style={{ background: isDark ? '#000000' : 'white', borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('forum_skip_splash', 'true');
                  sessionStorage.setItem('forum_splash_shown', '1');
                } catch (e) {}
                router.push('/forum');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isDark ? '#16181c' : '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#e7e9ea' : '#0f172a',
                transition: 'background 0.15s ease'
              }}
              title="Geri Dön"
              aria-label="Foruma Geri Dön"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="profile-bio-name" style={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#e7e9ea' : '#0f172a' }}>{pd.displayName || pd.username}</div>
              <div style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.78rem' }}>{posts.length} gönderi</div>
            </div>
          </div>

          {/* Cover Photo */}
          <div className="profile-cover" style={{ height: 220, position: 'relative', background: pd.coverURL ? 'transparent' : 'linear-gradient(135deg,#667eea,#764ba2)', backgroundImage: pd.coverURL ? `url(${pd.coverURL})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%' }}>
            <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCover} />
            {isOwn && (
              <button onClick={() => coverRef.current?.click()} disabled={upCover} style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(0,0,0,0)', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 700, transition: 'background 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }} onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}>
                <Camera size={20} /> {upCover ? 'Yükleniyor...' : 'Kapak Değiştir'}
              </button>
            )}
          </div>

          {/* Avatar + Action Row */}
          <div className="profile-avatar-wrap" style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -60, marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <div className="profile-avatar" style={{ width: 110, height: 110, borderRadius: '50%', border: `4px solid ${isDark ? '#000000' : 'white'}`, background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '2.4rem', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}>
                {pd.photoURL ? <img key={pd.photoURL} src={pd.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (pd.displayName || 'U')[0].toUpperCase()}
              </div>
              {isOwn && (
                <button onClick={() => photoRef.current?.click()} disabled={upPhoto} style={{ position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: '50%', border: `2px solid ${isDark ? '#000000' : 'white'}`, background: upPhoto ? '#64748b' : (isDark ? '#1d9bf0' : '#0f172a'), color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} title="Profil Resmini Değiştir">
                  <Camera size={15} />
                </button>
              )}
            </div>
            <div>
              {isOwn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button 
                    className="profile-btn-action" 
                    onClick={() => setSettingsOpen(true)} 
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      border: `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, 
                      background: isDark ? '#16181c' : 'white', 
                      color: isDark ? '#e7e9ea' : '#0f172a', 
                      borderRadius: 999, 
                      padding: '8px 18px', 
                      fontWeight: 800, 
                      cursor: 'pointer', 
                      fontSize: '0.88rem', 
                      transition: 'all 0.15s' 
                    }}
                  >
                    <Settings size={15} />
                    <span>Ayarlar</span>
                  </button>
                  <button 
                    className="profile-btn-action" 
                    onClick={() => setEditOpen(true)} 
                    style={{ 
                      border: `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, 
                      background: isDark ? '#16181c' : 'white', 
                      color: isDark ? '#e7e9ea' : '#0f172a', 
                      borderRadius: 999, 
                      padding: '8px 18px', 
                      fontWeight: 800, 
                      cursor: 'pointer', 
                      fontSize: '0.88rem', 
                      transition: 'all 0.15s' 
                    }}
                  >
                    Profili Düzenle
                  </button>
                </div>
              ) : (
                <button className="profile-btn-action" onClick={toggleFollow} style={{ background: following ? (isDark ? '#16181c' : 'white') : (isDark ? '#e7e9ea' : '#0f172a'), color: following ? (isDark ? '#e7e9ea' : '#0f172a') : (isDark ? '#000000' : 'white'), border: following ? `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}` : 'none', borderRadius: 999, padding: '9px 24px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.15s' }}>
                  {following ? 'Takip Ediliyor' : 'Takip Et'}
                </button>
              )}
            </div>
          </div>

          {/* Profile Bio Details */}
          <div className="profile-bio-wrap" style={{ padding: '0 24px 24px', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: isDark ? '#e7e9ea' : '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{pd.displayName || pd.username}</h1>
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
              <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: pd.diplomaUrl ? (isDark ? '#064e3b' : '#f0fdf4') : (isDark ? '#422006' : '#fefce8'), border: `1px solid ${pd.diplomaUrl ? (isDark ? '#047857' : '#bbf7d0') : (isDark ? '#854d0e' : '#fef08a')}`, color: pd.diplomaUrl ? (isDark ? '#a7f3d0' : '#166534') : (isDark ? '#fde047' : '#854d0e'), fontSize: '0.86rem' }}>
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
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: isDark ? '#fde047' : '#a16207' }}>
                    Belgeniz yönetici incelemesindedir. Onayın ardından profilinizde onaylı psikolog rozeti aktifleşecektir.
                  </p>
                )}
              </div>
            )}
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 14px', fontWeight: 500 }}>@{((pd.username || pd.displayName || 'kullanici').toLowerCase().replace(/\s+/g, ''))}</p>
            {pd.bio && <p style={{ fontSize: '1rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.6, marginBottom: 14 }}>{pd.bio}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, color: '#64748b', fontSize: '0.88rem', marginBottom: 16 }}>
              {pd.location && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={15} />{pd.location}</span>}
              {pd.website && (
                <a href={pd.website.startsWith('http') ? pd.website : `https://${pd.website}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                  <LinkIcon size={15} />{pd.website}
                </a>
              )}
              {joined && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={15} />Katıldı: {joined}</span>}
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: '0.92rem' }}>
              <span><strong style={{ color: isDark ? '#e7e9ea' : '#0f172a' }}>{followings}</strong> <span style={{ color: '#94a3b8' }}>Takip edilen</span></span>
              <span><strong style={{ color: isDark ? '#e7e9ea' : '#0f172a' }}>{followers}</strong> <span style={{ color: '#94a3b8' }}>Takipçi</span></span>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="profil-tabs" style={{ display: 'flex', borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, borderTop: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, background: isDark ? '#000000' : 'white' }}>
            {profileTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className="profil-tab-btn"
                style={{
                  flex: 1,
                  padding: '16px 12px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: tab === t.id ? 800 : 600,
                  fontSize: '0.92rem',
                  color: tab === t.id ? (isDark ? '#e7e9ea' : '#0f172a') : (isDark ? '#71767b' : '#64748b'),
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{t.label}</span>
                {tab === t.id && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '25%',
                      right: '25%',
                      height: 3.5,
                      background: '#1d9bf0',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'posts' && (posts.length === 0 ? <Empty icon={<FileText size={36} color="#cbd5e1" />} text="Henüz gönderi yok" isDark={isDark} /> : posts.map(p => <PostCard key={p.id} p={p} pd={pd} isOwn={isOwn} userEmail={user?.email || ''} onDelete={delPost} isDark={isDark} />))}

          {tab === 'replies' && (
            !isOwn && pd?.hideReplies ? (
              <Empty icon={<Lock size={36} color="#cbd5e1" />} text="Bu kullanıcı yanıtlarını gizlemiştir." isDark={isDark} />
            ) : replies.length === 0 ? (
              <Empty icon={<MessageCircle size={36} color="#cbd5e1" />} text="Henüz yanıt yok" isDark={isDark} />
            ) : (
              replies.map((r, i) => (
                <div 
                  key={i} 
                  className="profile-card-item"
                  onClick={() => r.postId && router.push(`/forum?thread=${r.postId}`)}
                  onMouseOver={e => (e.currentTarget.style.background = isDark ? '#080808' : '#fafbfc')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  style={{ padding: '16px 24px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, cursor: r.postId ? 'pointer' : 'default', minWidth: 0, width: '100%', boxSizing: 'border-box' }}
                >
                  <p style={{ fontSize: '0.8rem', color: isDark ? '#71767b' : '#94a3b8', marginBottom: 8 }}>Yanıtladı: <em>"{r.postBody}..."</em></p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                      {pd.photoURL ? <img key={pd.photoURL} src={pd.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (pd.displayName || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isDark ? '#e7e9ea' : '#0f172a' }}>{pd.displayName}</span>
                      <span style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.82rem', marginLeft: 8 }}>· {formatTimeAgo(r.createdAt)}</span>
                      <p style={{ margin: '6px 0 0', fontSize: '0.95rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.6, wordBreak: 'break-word' }}>{r.text}</p>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {tab === 'reposts' && (reposts.length === 0 ? <Empty icon={<Repeat2 size={36} color="#cbd5e1" />} text="Henüz yeniden gönderi yok" isDark={isDark} /> : reposts.map(p => (
            <PostCard 
              key={p.id} 
              p={p} 
              pd={pd} 
              isOwn={isOwn} 
              userEmail={user?.email || ''} 
              onDelete={delPost} 
              repostedBy={pd.displayName || pd.username}
              isDark={isDark}
            />
          )))}

          {tab === 'likes' && (
            !isOwn && pd?.hideLikes ? (
              <Empty icon={<Lock size={36} color="#cbd5e1" />} text="Bu kullanıcı beğenilerini gizlemiştir." isDark={isDark} />
            ) : likes.length === 0 ? (
              <Empty icon={<Heart size={36} color="#cbd5e1" />} text="Henüz beğeni yok" isDark={isDark} />
            ) : (
              likes.map(p => (
                <div 
                  key={p.id} 
                  className="profile-card-item"
                  onClick={() => router.push(`/forum?thread=${p.originalPostId || p.id}`)}
                  onMouseOver={e => (e.currentTarget.style.background = isDark ? '#080808' : '#fafbfc')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  style={{ display: 'flex', gap: 14, padding: '16px 24px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, cursor: 'pointer', minWidth: 0, width: '100%', boxSizing: 'border-box' }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, overflow: 'hidden' }}>
                    {(p.authorPhotoURL || (p.uid === pd?.uid ? pd?.photoURL : undefined)) ? (
                      <img src={p.authorPhotoURL || pd?.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (p.authorName || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.92rem' }}>{p.authorName}</span>
                      <span style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.82rem' }}>· {formatTimeAgo(p.createdAt)}</span>
                    </div>
                    <p style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>
                      {renderTextWithMentions(p.body)}
                    </p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14} />{p.commentCount}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}><Heart size={14} fill="#ef4444" />{Object.keys(p.reactionsData || {}).length}</span>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {tab === 'bookmarks' && (
            !isOwn ? (
              <Empty icon={<Lock size={36} color="#cbd5e1" />} text="Yer işaretleri yalnızca hesap sahibi tarafından görüntülenebilir." isDark={isDark} />
            ) : bookmarks.length === 0 ? (
              <Empty icon={<Bookmark size={36} color="#cbd5e1" />} text="Henüz kaydedilen yer işareti yok" isDark={isDark} />
            ) : (
              bookmarks.map(p => (
                <PostCard 
                  key={p.id} 
                  p={p} 
                  pd={pd} 
                  isOwn={isOwn} 
                  userEmail={user?.email || ''} 
                  onDelete={delPost} 
                  isDark={isDark}
                />
              ))
            )
          )}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="profile-sidebar-right" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, background: isDark ? '#000000' : 'transparent' }}>
          {/* Search box - strictly searches forum */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDark ? '#16181c' : '#f1f5f9', borderRadius: 12, padding: '10px 14px', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
            <Search size={17} color={isDark ? '#71767b' : '#94a3b8'} />
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Forumda ara..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: isDark ? '#e7e9ea' : '#0f172a', width: '100%' }} 
            />
            <button 
              type="submit" 
              style={{ background: isDark ? '#1d9bf0' : '#0f172a', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >
              Ara
            </button>
          </form>

          {/* Trending Topics Widget - Real tags & categories from forum posts */}
          <div style={{ background: isDark ? '#16181c' : '#f8fafc', borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
              <TrendingUp size={18} color={isDark ? '#71767b' : '#64748b'} />
              <h3 style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '1rem', margin: 0 }}>Gündemdekiler</h3>
            </div>
            {trends.length > 0 ? (
              trends.map(t => (
                <Link key={t.tag} href={`/forum?tag=${encodeURIComponent(t.tag.replace(/^#/, ''))}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 18px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, transition: 'background 0.15s' }} onMouseOver={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: isDark ? '#71767b' : '#94a3b8', marginBottom: 2 }}>Gündemdekiler · Türkiye</div>
                      <div style={{ fontWeight: 700, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.92rem' }}>#{t.tag.replace(/^#/, '').replace(/\s+/g, '')}</div>
                      <div style={{ fontSize: '0.74rem', color: isDark ? '#71767b' : '#64748b', marginTop: 2 }}>{t.count} gönderi</div>
                    </div>
                    <span style={{ background: isDark ? 'rgba(56, 189, 248, 0.15)' : '#eff6ff', color: isDark ? '#38bdf8' : '#1d4ed8', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>#{t.tag.replace(/^#/, '')}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ padding: '20px 18px', color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.84rem', textAlign: 'center' }}>
                Henüz etiket veya konu yok
              </div>
            )}
          </div>

          {/* Suggested Users (Kimi Takip Etmeli) - Real active members with follow action */}
          <div style={{ background: isDark ? '#16181c' : '#f8fafc', borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
              <Users size={18} color={isDark ? '#71767b' : '#64748b'} />
              <h3 style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '1rem', margin: 0 }}>Kimi Takip Etmeli</h3>
            </div>
            {suggestedUsers.length > 0 ? (
              suggestedUsers.map((su: any) => {
                const suUsername = (su.username || su.displayName || 'kullanici').toLowerCase().replace(/\s+/g, '');
                return (
                  <div key={su.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}` }}>
                    <Link href={`/forum/profil/${encodeURIComponent(suUsername)}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0, flex: 1 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>
                        {su.photoURL ? <img src={su.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (su.displayName || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{su.displayName || su.username}</div>
                        <div style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{suUsername}</div>
                      </div>
                    </Link>
                    <button 
                      onClick={(e) => handleFollowSuggested(e, su.uid)}
                      style={{ padding: '6px 14px', borderRadius: 999, background: isDark ? '#e7e9ea' : '#0f172a', color: isDark ? '#000000' : 'white', fontSize: '0.78rem', fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: 8, transition: 'all 0.15s' }}
                    >
                      Takip Et
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px 18px', color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.84rem', textAlign: 'center' }}>
                Şu an için yeni öneri yok
              </div>
            )}
          </div>

          {/* Footer & Copyright */}
          <div style={{ padding: '0 8px', fontSize: '0.78rem', color: isDark ? '#71767b' : '#94a3b8', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginBottom: 8 }}>
              <Link href="/gizlilik" style={{ color: isDark ? '#71767b' : '#94a3b8', textDecoration: 'none' }}>Gizlilik Politikası</Link>
              <Link href="/iletisim" style={{ color: isDark ? '#71767b' : '#94a3b8', textDecoration: 'none' }}>İletişim</Link>
              <Link href="/ben-kimim" style={{ color: isDark ? '#71767b' : '#94a3b8', textDecoration: 'none' }}>Hakkında</Link>
            </div>
            <div>© 2026 Furkan Manav · Psikoloji Platformu</div>
          </div>
        </aside>

      </div>

      {/* Edit Profile & Settings Modal */}
      {(editOpen || settingsOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setEditOpen(false); setSettingsOpen(false); }}>
          <div style={{ background: isDark ? '#16181c' : 'white', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, borderRadius: 20, width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {settingsOpen && !editOpen ? <Settings size={22} color={isDark ? '#e7e9ea' : '#0f172a'} /> : <SlidersHorizontal size={22} color={isDark ? '#e7e9ea' : '#0f172a'} />}
                <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: isDark ? '#e7e9ea' : '#0f172a', margin: 0 }}>
                  {settingsOpen && !editOpen ? 'Ayarlar ve Gizlilik' : 'Profili Düzenle & Ayarlar'}
                </h2>
              </div>
              <button 
                onClick={() => { setEditOpen(false); setSettingsOpen(false); }} 
                style={{ background: isDark ? '#2f3336' : '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isDark ? '#e7e9ea' : '#64748b' }}
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Section 1: Profil Bilgileri */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isDark ? '#71767b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Profil Bilgileri
              </div>
              
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Ad Soyad</label>
                <input 
                  type="text" 
                  placeholder="Adınız ve soyadınız" 
                  value={ed.displayName} 
                  onChange={e => setEd({ ...ed, displayName: e.target.value })} 
                  style={{ width: '100%', background: isDark ? '#000000' : 'white', border: `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, color: isDark ? '#e7e9ea' : '#0f172a', borderRadius: 10, padding: '11px 14px', fontSize: '0.93rem', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Kullanıcı Adı</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, borderRadius: 10, padding: '0 14px', background: isDark ? '#000000' : '#f8fafc' }}>
                  <span style={{ color: isDark ? '#71767b' : '#94a3b8', fontWeight: 700, fontSize: '0.93rem' }}>@</span>
                  <input 
                    type="text" 
                    placeholder="kullaniciadi" 
                    value={ed.username} 
                    onChange={e => setEd({ ...ed, username: e.target.value.toLowerCase().replace(/[^a-z0-9_\.]/g, '') })} 
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '11px 6px', fontSize: '0.93rem', outline: 'none', color: isDark ? '#e7e9ea' : '#0f172a', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Hakkımda</label>
                <textarea 
                  rows={3} 
                  placeholder="Kendinizden bahsedin..." 
                  value={ed.bio} 
                  onChange={e => setEd({ ...ed, bio: e.target.value })} 
                  style={{ width: '100%', background: isDark ? '#000000' : 'white', border: `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, color: isDark ? '#e7e9ea' : '#0f172a', borderRadius: 10, padding: '11px 14px', fontSize: '0.93rem', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Konum</label>
                  <input 
                    type="text" 
                    placeholder="Şehir, Ülke" 
                    value={ed.location} 
                    onChange={e => setEd({ ...ed, location: e.target.value })} 
                    style={{ width: '100%', background: isDark ? '#000000' : 'white', border: `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, color: isDark ? '#e7e9ea' : '#0f172a', borderRadius: 10, padding: '11px 14px', fontSize: '0.93rem', outline: 'none', boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Web Sitesi</label>
                  <input 
                    type="text" 
                    placeholder="ornek.com" 
                    value={ed.website} 
                    onChange={e => setEd({ ...ed, website: e.target.value })} 
                    style={{ width: '100%', background: isDark ? '#000000' : 'white', border: `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, color: isDark ? '#e7e9ea' : '#0f172a', borderRadius: 10, padding: '11px 14px', fontSize: '0.93rem', outline: 'none', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Gizlilik ve Görünürlük Ayarları */}
            <div style={{ marginBottom: 24, paddingTop: 18, borderTop: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: isDark ? '#71767b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                <Shield size={14} color={isDark ? '#71767b' : '#64748b'} />
                <span>Gizlilik Ayarları</span>
              </div>

              {/* Toggle: Beğenileri Gizle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: isDark ? '#080808' : '#f8fafc', borderRadius: 12, border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, marginBottom: 12 }}>
                <div style={{ paddingRight: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isDark ? '#e7e9ea' : '#0f172a' }}>Beğenilerimi herkese gizle</div>
                  <div style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#64748b', marginTop: 2 }}>Diğer kullanıcılar profilinizde beğendiğiniz gönderileri göremez.</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ed.hideLikes}
                  onClick={() => setEd(prev => ({ ...prev, hideLikes: !prev.hideLikes }))}
                  style={{
                    width: 46,
                    height: 26,
                    borderRadius: 999,
                    background: ed.hideLikes ? (isDark ? '#1d9bf0' : '#0f172a') : (isDark ? '#2f3336' : '#cbd5e1'),
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: ed.hideLikes ? 23 : 3,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s'
                    }}
                  />
                </button>
              </div>

              {/* Toggle: Yanıtları Gizle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: isDark ? '#080808' : '#f8fafc', borderRadius: 12, border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
                <div style={{ paddingRight: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isDark ? '#e7e9ea' : '#0f172a' }}>Yanıtlarımı herkese gizle</div>
                  <div style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#64748b', marginTop: 2 }}>Diğer kullanıcılar profilinizde yaptığınız yorum ve yanıtları göremez.</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ed.hideReplies}
                  onClick={() => setEd(prev => ({ ...prev, hideReplies: !prev.hideReplies }))}
                  style={{
                    width: 46,
                    height: 26,
                    borderRadius: 999,
                    background: ed.hideReplies ? (isDark ? '#1d9bf0' : '#0f172a') : (isDark ? '#2f3336' : '#cbd5e1'),
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: ed.hideReplies ? 23 : 3,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button 
                onClick={() => { setEditOpen(false); setSettingsOpen(false); }} 
                style={{ flex: 1, border: `1.5px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, borderRadius: 999, padding: '12px', fontWeight: 700, cursor: 'pointer', background: isDark ? '#16181c' : 'white', color: isDark ? '#e7e9ea' : '#0f172a' }}
              >
                İptal
              </button>
              <button 
                onClick={saveProfile} 
                disabled={saving} 
                style={{ flex: 1, background: isDark ? '#1d9bf0' : '#0f172a', color: 'white', border: 'none', borderRadius: 999, padding: '12px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* 4. Heart / Activity button */}
        <button
          type="button"
          onClick={() => router.push('/bildirimler')}
          className="dock-btn"
          aria-label="Bildirimler"
          style={{ position: 'relative' }}
        >
          <Heart size={24} strokeWidth={1.9} />
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

        {/* 5. User Profile button (ACTIVE on Profile) */}
        <button
          type="button"
          onClick={() => {
            if (!user || user.isAnonymous) {
              skipSplashAndGo('/forum');
            } else if (isOwn) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              router.push(`/forum/profil/${encodeURIComponent(myUsername || user.uid)}`);
            }
          }}
          className={`dock-btn ${isOwn ? 'active' : ''}`}
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
            border: isOwn 
              ? `2px solid ${isDark ? '#38bdf8' : '#0f172a'}` 
              : `1.5px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.3)'}`,
            boxShadow: isOwn ? (isDark ? '0 0 10px rgba(56, 189, 248, 0.4)' : '0 0 8px rgba(15,23,42,0.3)') : 'none'
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
