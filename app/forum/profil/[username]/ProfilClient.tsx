'use client';
import { uploadFetch } from '@/lib/notify';
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp, limit, addDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Camera, MapPin, Link as LinkIcon, Calendar, 
  MessageCircle, Heart, Trash2, Home, Users, Film, FileText, 
  Bell, Search, TrendingUp, Hash, X, Check, Share2, CheckCircle, UserX, Clock,
  Upload, ExternalLink, ShieldCheck, Loader, Bookmark, Repeat2, User,
  Settings, Lock, EyeOff, Shield, SlidersHorizontal, Plus, Award, Key, AlertTriangle, Snowflake, ArrowRight,
  MoreHorizontal, Flag, LogOut, Sun, Moon, Mail, Send, RefreshCw, ChevronRight, Ban, ScrollText
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatTimeAgo, renderTextWithMentions } from '@/components/forum/ThreadView';
import ForumLoadingScreen from '@/components/forum/ForumLoadingScreen';
import { sanitizeUsername, getUsernameValidationError } from '@/lib/usernameUtils';
import ForumShell from '@/components/forum/ForumShell';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { getPasswordError } from '@/lib/passwordUtils';
import ForumPost from '@/components/forum/ForumPost';
import Composer from '@/components/forum/Composer';
import FollowList, { FollowListMode } from '@/components/forum/FollowList';
import { Avatar, VerifiedMark, useForumTheme, LevelBadge } from '@/components/forum/ui';
import { LevelCard } from '@/components/forum/Scores';
import { usePostActions } from '@/components/forum/usePostActions';
import { useMyGraph, loadUsers, loadRecentPosts, setFollow, useBlocks, blockUser, unblockUser, useScores } from '@/components/forum/social';
import { confirmUnfollow, confirmBlock, confirmUnblock } from '@/components/forum/confirm';
import BlockedList from '@/components/forum/BlockedList';
import ProfileOverview from '@/components/forum/ProfileOverview';
import ProfileExtrasEditor, { cleanExtras, type Extras } from '@/components/forum/ProfileExtrasEditor';

interface Post { 
  id: string; body: string; authorName: string; authorUsername?: string; uid: string; 
  createdAt: any; commentCount: number; reactionsData?: Record<string, string>; 
  repostsData?: Record<string, any>; bookmarksData?: Record<string, any>;
  category?: string; imageUrl?: string; authorPhotoURL?: string;
  authorIsPsychologist?: boolean; isPsychologist?: boolean; authorHideBadge?: boolean;
  isRepost?: boolean; originalPostId?: string; originalAuthorName?: string;
  originalAuthorUsername?: string; originalAuthorPhotoURL?: string; originalAuthorIsPsychologist?: boolean;
}

const CATEGORIES = ['Tümü','Psikanaliz','Varoluş & Anlam','Kaygı & Depresyon','İlişkiler','Çocukluk & Travma','Rüyalar','Kimlik & Benlik','Kişisel Gelişim'];
const ADMIN = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

export default function ProfilClient({ username }: { username: string }) {
  const { user, userProfile, emailVerified, resendVerificationEmail, refreshEmailVerification, logout } = useAuth();
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
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'appearance' | 'privacy' | 'blocked' | 'policy' | 'badge' | 'danger'>('profile');
  const [profMenu, setProfMenu] = useState(false);
  const scores = useScores();
  // Mezun belgesi herkese açık profilde değil, gizli başvuru kaydında durur; yalnızca sahibine gösterilir
  const [myDiploma, setMyDiploma] = useState('');
  useEffect(() => {
    if (!user || !pd?.uid || user.uid !== pd.uid) return;
    getDoc(doc(db, 'psychologist_applications', user.uid)).then(s => setMyDiploma(s.data()?.diplomaUrl || '')).catch(() => {});
  }, [user, pd?.uid]);
  const blocks = useBlocks(user && !user.isAnonymous ? user.uid : null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [ed, setEd] = useState({ 
    displayName: '', 
    username: '', 
    bio: '', 
    location: '', 
    website: '',
    hideLikes: false,
    hideReplies: false,
    isPrivate: false,
  });
  // Özgeçmiş alanları (başlık, eğitim, sertifikalar, sosyal medya)
  const [extras, setExtras] = useState<Extras>({ headline: '', education: [], certificates: [], socials: {} });
  // Profil önce özgeçmiş görünümüyle açılır; tüm paylaşımlar istenince sekmeli görünüm
  const [showAll, setShowAll] = useState(false);
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
  const [togglingBadge, setTogglingBadge] = useState(false);
  const [listMode, setListMode] = useState<FollowListMode | null>(null);
  const [settingsDetail, setSettingsDetail] = useState(false);
  const myFollowers = useMyGraph(user && !user.isAnonymous ? user.uid : null).followers;

  // Profil listelerinde iyimser güncelleme
  const patchAll = (id: string, update: (p: any) => any) => {
    const f = (list: any[]) => list.map(x => (x.id === id ? update(x) : x));
    setPosts(f); setReposts(f); setLikes(f); setBookmarks(f);
  };
  const actions = usePostActions({
    onNeedAuth: () => window.dispatchEvent(new Event('forum:need-auth')),
    onPatch: patchAll,
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  // Account freeze and delete state with password verification
  const [freezing, setFreezing] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezePassword, setFreezePassword] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [isDark] = useForumTheme();

  const skipSplashAndGo = (href: string) => {
    try {
      sessionStorage.setItem('forum_skip_splash', 'true');
      sessionStorage.setItem('forum_splash_shown', '1');
    } catch (e) {}
    router.push(href);
  };

  const handleUploadDiploma = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingDiploma(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'manav-platform/diplomas');
      const res = await uploadFetch({ method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Yükleme başarısız');

      // Belge yalnızca gizli başvuru kaydına yazılır (herkese açık profile değil)
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
      toast.success('Mezun belgen yüklendi.');
    } catch (err: any) {
      toast.error('Belge yüklenirken hata oluştu: ' + (err.message || ''));
    } finally {
      setUploadingDiploma(false);
    }
  };

  const handleToggleBadge = async () => {
    if (!user || !pd) return;
    setTogglingBadge(true);
    try {
      const nextHideBadge = !Boolean(pd.hideBadge);
      await updateDoc(doc(db, 'users', user.uid), {
        hideBadge: nextHideBadge,
        updatedAt: serverTimestamp(),
      });
      setPd((prev: any) => ({ ...prev, hideBadge: nextHideBadge }));
      if (nextHideBadge) {
        toast.success('Psikolog rozetiniz profilinizden ve paylaşımlarınızdan gizlendi / kaldırıldı.');
      } else {
        toast.success('Psikolog rozetiniz tekrar görünür hale getirildi!');
      }
    } catch (err: any) {
      toast.error('Rozet ayarı güncellenirken hata oluştu: ' + (err.message || ''));
    } finally {
      setTogglingBadge(false);
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
            const dirUsers = Object.values(await loadUsers());
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

            for (const u of dirUsers as any[]) {
              const uNorm = norm(u.username);
              const dNorm = norm(u.displayName);
              if (uNorm === targetNorm || dNorm === targetNorm) {
                data = { ...u };
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
            hideReplies: Boolean(data.hideReplies),
            isPrivate: Boolean(data.isPrivate),
          });
          setExtras({
            headline: data.headline || '',
            education: Array.isArray(data.education) ? data.education : [],
            certificates: Array.isArray(data.certificates) ? data.certificates : [],
            socials: data.socials || {},
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

          // Diğer sekmeler arka planda, hedefli sorgularla (tüm forumu okumadan)
          try {
            const toPost = (d: any) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }) as Post;
            const isViewerOwn = Boolean(user && user.uid === data.uid);

            // 1. Yeniden paylaşımlar: kullanıcının yeniden paylaşım kayıtlarından orijinal gönderiler
            const rs = await getDocs(query(collection(db, 'forum'), where('uid', '==', data.uid), where('isRepost', '==', true), limit(40)));
            const originalIds = [...new Set(rs.docs.map(d => d.data().originalPostId).filter(Boolean))] as string[];
            const originals = (await Promise.all(originalIds.map(id => getDoc(doc(db, 'forum', id)).catch(() => null))))
              .filter((d): d is any => Boolean(d?.exists()))
              .map(toPost);
            if (!isCancelled) setReposts(originals.sort((a: any, b: any) => b.createdAt - a.createdAt));

            // 2. Beğeniler (sahibi ya da herkese açıksa)
            if (isViewerOwn || !data.hideLikes) {
              const ls = await getDocs(query(collection(db, 'forum'), where(`reactionsData.${data.uid}`, 'in', ['like', 'heart']), limit(40)));
              const likeList = ls.docs.map(toPost).filter((x: any) => !x.isRepost);
              if (!isCancelled) setLikes(likeList.sort((a: any, b: any) => b.createdAt - a.createdAt));
            }

            // 3. Yer işaretleri: yalnızca sahibi
            if (isViewerOwn) {
              const bSnap = await getDocs(query(collection(db, 'users', data.uid, 'bookmarks'), limit(40))).catch(() => null);
              const ids = (bSnap?.docs || []).map(d => d.id);
              const bPosts = (await Promise.all(ids.map(id => getDoc(doc(db, 'forum', id)).catch(() => null))))
                .filter((d): d is any => Boolean(d?.exists()))
                .map(toPost);
              if (!isCancelled) setBookmarks(bPosts.sort((a: any, b: any) => b.createdAt - a.createdAt));
            }

            // 4. Yanıtlar: yalnızca yanıtı olan son gönderiler taranır (önbellekteki dizinden)
            if (isViewerOwn || !data.hideReplies) {
              const recent = (await loadRecentPosts()).filter((x: any) => !x.isRepost && (x.commentCount || 0) > 0).slice(0, 30);
              const results = await Promise.all(recent.map((x: any) =>
                getDocs(query(collection(db, 'forum', x.id, 'comments'), where('uid', '==', data.uid)))
                  .then(cs => cs.docs.map(c => ({
                    ...c.data(),
                    id: c.id,
                    postId: x.id,
                    postBody: x.body?.slice(0, 60),
                    createdAt: c.data().createdAt?.toDate() || new Date()
                  })))
                  .catch(() => [])
              ));
              if (!isCancelled) setReplies(results.flat().sort((a: any, b: any) => b.createdAt - a.createdAt));
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
    const s = searchParams.get('settings');
    const t = searchParams.get('tab');
    if (t && t !== 'settings') setShowAll(true);
    if (s === 'open' || s === '1' || t === 'settings') {
      if (isViewerOwn) {
        setSettingsOpen(true);
        const sec = searchParams.get('section');
        if (sec && ['profile', 'security', 'appearance', 'privacy', 'blocked', 'badge', 'danger'].includes(sec)) {
          setSettingsTab(sec as any);
        }
      }
    }
    const l = searchParams.get('list');
    if (l === 'followers' || l === 'following') setListMode(l);
    if (searchParams.get('section')) setSettingsDetail(true);
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

  const uploadImg = async (file: File, path: string): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', `manav-platform/${path.split('/')[0]}`);
    const res = await uploadFetch({ method: 'POST', body: fd });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Yükleme başarısız oldu');
    }
    return data.url;
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !user) return;
    setUpPhoto(true);
    const toastId = toast.loading('Profil fotoğrafı yükleniyor…');
    try {
      const url = await uploadImg(f, `avatars/${user.uid}`);
      await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true });
      try { await updateProfile(user, { photoURL: url }); } catch {}
      setPd((p: any) => ({ ...p, photoURL: url }));
      toast.success('Profil fotoğrafı güncellendi', { id: toastId });
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
    const toastId = toast.loading('Kapak fotoğrafı yükleniyor…');
    try {
      const url = await uploadImg(f, `covers/${user.uid}`);
      await setDoc(doc(db, 'users', user.uid), { coverURL: url }, { merge: true });
      setPd((p: any) => ({ ...p, coverURL: url }));
      toast.success('Kapak fotoğrafı güncellendi', { id: toastId });
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
    if (following && !(await confirmUnfollow(pd.username || pd.displayName || 'kullanici'))) return;
    try {
      await setFollow(user, userProfile, pd.uid, !following);
      setFollowing(!following);
    } catch (err: any) {
      toast.error('İşlem yapılamadı: ' + (err.message || ''));
    }
  };

  const saveProfile = async () => {
    if (!user || !pd) return; 
    setSaving(true);
    try { 
      const targetUsername = (ed.username || pd.username || '').trim();
      const valError = getUsernameValidationError(targetUsername);
      if (valError) {
        toast.error(valError);
        setSaving(false);
        return;
      }
      const cleanUsername = sanitizeUsername(targetUsername);

      if (cleanUsername !== (pd.username || '').toLowerCase()) {
        const checkSnap = await getDocs(
          query(collection(db, 'users'), where('username', '==', cleanUsername), limit(1))
        );
        if (!checkSnap.empty && checkSnap.docs[0].id !== user.uid) {
          toast.error(`@${cleanUsername} kullanıcı adı başka biri tarafından kullanılıyor.`);
          setSaving(false);
          return;
        }
      }

      const payload = {
        displayName: ed.displayName.trim() || pd.displayName || 'Kullanıcı',
        username: cleanUsername,
        bio: ed.bio.trim(),
        location: ed.location.trim(),
        website: ed.website.trim(),
        hideLikes: Boolean(ed.hideLikes),
        hideReplies: Boolean(ed.hideReplies),
        isPrivate: Boolean(ed.isPrivate),
        ...cleanExtras(extras),
      };

      await updateDoc(doc(db, 'users', user.uid), payload);
      try { 
        await updateProfile(user, { displayName: payload.displayName }); 
      } catch {}

      setPd((p: any) => ({ ...p, ...payload })); 
      setEditOpen(false); 
      setSettingsOpen(false);
      toast.success('Profil ve ayarlar kaydedildi!'); 

      if (cleanUsername !== (pd.username || '').toLowerCase()) {
        router.replace(`/forum/profil/${encodeURIComponent(cleanUsername)}`);
      }
    }
    catch (err: any) { 
      console.error('saveProfile error:', err);
      toast.error('Hata: ' + (err.message || 'Kaydedilemedi')); 
    } finally { 
      setSaving(false); 
    }
  };

  // Password change handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    const pwError = getPasswordError(newPassword || '');
    if (pwError) return toast.error(pwError);
    if (newPassword !== newPasswordConfirm) {
      return toast.error('Yeni şifreleriniz birbiriyle uyuşmuyor.');
    }

    setChangingPassword(true);
    try {
      if (currentPassword) {
        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
        } catch (authErr: any) {
          if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
            toast.error('Mevcut şifrenizi hatalı girdiniz.');
            setChangingPassword(false);
            return;
          }
        }
      }
      await updatePassword(user, newPassword);
      toast.success('Şifreniz başarıyla değiştirildi!');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        toast.error('Güvenlik nedeniyle şifre değiştirmek için lütfen mevcut şifrenizi girin.');
      } else {
        toast.error('Şifre değiştirilemedi: ' + (err.message || ''));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user || !user.email) return;
    setSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`${user.email} adresine şifre sıfırlama bağlantısı gönderildi.`);
    } catch (err: any) {
      toast.error('E-posta gönderilemedi: ' + (err.message || ''));
    } finally {
      setSendingResetEmail(false);
    }
  };

  // Account Freeze handler with password verification
  const handleToggleFreeze = async () => {
    if (!user) return;
    const currentlyFrozen = Boolean(pd?.isFrozen);

    // If currently frozen, allow reactivating directly
    if (currentlyFrozen) {
      setFreezing(true);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          isFrozen: false,
          frozenAt: null,
        });
        setPd((p: any) => ({ ...p, isFrozen: false }));
        toast.success('Hesabınız başarıyla yeniden aktif edildi!');
        setSettingsOpen(false);
        setEditOpen(false);
      } catch (err: any) {
        toast.error('İşlem başarısız: ' + (err.message || ''));
      } finally {
        setFreezing(false);
      }
      return;
    }

    // Freezing requires existing password verification
    if (!freezePassword.trim()) {
      return toast.error('Hesabınızı dondurmak için mevcut şifrenizi girmelisiniz.');
    }

    setFreezing(true);
    try {
      if (user.email) {
        const credential = EmailAuthProvider.credential(user.email, freezePassword);
        await reauthenticateWithCredential(user, credential);
      }
      await updateDoc(doc(db, 'users', user.uid), {
        isFrozen: true,
        frozenAt: serverTimestamp(),
      });
      setPd((p: any) => ({ ...p, isFrozen: true }));
      toast.success('Hesabınız başarıyla donduruldu.');
      setFreezeModalOpen(false);
      setFreezePassword('');
      setSettingsOpen(false);
      setEditOpen(false);
    } catch (authErr: any) {
      if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        toast.error('Mevcut şifrenizi hatalı girdiniz. Hesap dondurulamadı.');
      } else {
        toast.error('Şifre doğrulanamadı: ' + (authErr.message || ''));
      }
    } finally {
      setFreezing(false);
    }
  };

  // Account Delete handler with password verification
  // Google ile kayıt olanların şifresi yoktur; kimlik Google penceresiyle doğrulanır
  const hasPassword = Boolean(user?.providerData?.some(pr => pr.providerId === 'password'));

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (hasPassword && !deletePassword.trim()) {
      return toast.error('Hesabınızı silmek için mevcut şifrenizi girmelisiniz.');
    }
    if (deleteConfirmText.trim().toLocaleUpperCase('tr-TR') !== 'SİL') {
      return toast.error('Lütfen onaylamak için kutuya büyük harflerle SİL yazın.');
    }
    setDeletingAccount(true);
    try {
      if (hasPassword && user.email) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, googleProvider);
      }
      await updateDoc(doc(db, 'users', user.uid), {
        isDeleted: true,
        isFrozen: true,
        displayName: 'Silinmiş Hesap',
        username: `silinmis_${user.uid.slice(0, 6)}`,
        bio: '',
        photoURL: '',
        coverURL: '',
        deletedAt: serverTimestamp(),
      });
      try {
        await deleteUser(user);
      } catch (authErr) {
        console.warn('deleteUser auth notice:', authErr);
      }
      await logout();
      toast.success('Hesabınız kalıcı olarak silindi.');
      router.replace('/forum');
    } catch (authErr: any) {
      if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        toast.error('Mevcut şifrenizi hatalı girdiniz. Hesap silinemedi.');
      } else {
        toast.error('Hesap silinirken hata: ' + (authErr.message || ''));
      }
    } finally {
      setDeletingAccount(false);
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
    return <ForumLoadingScreen text="Profil yükleniyor" isDark={isDark} />;
  }

  if (!pd) {
    return (
      <ForumShell active={null}>
        <div className="fx-thead">
          <button type="button" className="fx-icon-btn" onClick={() => skipSplashAndGo('/forum')} aria-label="Foruma dön" style={{ color: 'var(--fx-ink)' }}>
            <ArrowLeft size={20} />
          </button>
          <h2>Profil</h2>
        </div>
        <div className="fx-empty">
          <h2>Bu hesap bulunamadı</h2>
          <p>Kullanıcı adı değişmiş ya da hesap silinmiş olabilir. Başka bir arama dene.</p>
          <button type="button" className="fx-btn fx-btn-primary" onClick={() => skipSplashAndGo('/forum')}>Foruma dön</button>
        </div>
      </ForumShell>
    );
  }

  const isOwn = Boolean(user && pd && user.uid === pd.uid);
  const isAdmin = ADMIN.includes((user?.email || '').toLowerCase().trim()) || userProfile?.role === 'admin';
  const joined = pd.createdAt?.toDate?.().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) || '';
  const handle = (pd.username || pd.displayName || 'kullanici').toLowerCase().replace(/\s+/g, '').replace(/^@+/, '');
  const isPsych = Boolean(((pd.isPsychologist && pd.psychologistStatus === 'approved') || (pd.isPsychologist && !pd.psychologistStatus)) && !pd.hideBadge);
  const isApproved = Boolean((pd.isPsychologist && pd.psychologistStatus === 'approved') || (pd.isPsychologist && !pd.psychologistStatus));
  const blockedMe = !isOwn && blocks.blockedBy.has(pd.uid);
  const iBlocked = !isOwn && blocks.blocked.has(pd.uid);
  const locked = blockedMe || iBlocked || (!isOwn && !isAdmin && (pd.isFrozen || (pd.isPrivate && !following)));
  const toggleBlock = async (openAuth: () => void) => {
    if (!user || user.isAnonymous) return openAuth();
    if (iBlocked) {
      if (!(await confirmUnblock(handle))) return;
      try { await unblockUser(user.uid, pd.uid); toast.success(`@${handle} adlı kişinin engeli kaldırıldı`); } catch { toast.error('İşlem yapılamadı.'); }
      return;
    }
    if (!(await confirmBlock(handle))) return;
    try { await blockUser(user.uid, pd.uid); setFollowing(false); toast.success(`@${handle} engellendi`); } catch { toast.error('Engellenemedi. Lütfen tekrar dene.'); }
  };
  const followsMe = Boolean(user && followingMap && myFollowers.includes(pd.uid));

  const profileTabs = [
    { id: 'posts', label: 'Gönderiler' },
    ...((isOwn || !pd?.hideReplies) ? [{ id: 'replies', label: 'Yanıtlar' }] : []),
    { id: 'reposts', label: 'Yeniden paylaşımlar' },
    ...((isOwn || !pd?.hideLikes) ? [{ id: 'likes', label: 'Beğeniler' }] : []),
    ...(isOwn ? [{ id: 'bookmarks', label: 'Yer işaretleri' }] : []),
  ];

  const enrich = (p: Post) => ({
    ...p,
    authorPhotoURL: p.uid === pd.uid ? (pd.photoURL || p.authorPhotoURL) : p.authorPhotoURL,
    authorIsPsychologist: p.uid === pd.uid ? isPsych : p.authorIsPsychologist,
  });

  const renderPosts = (list: Post[], emptyTitle: string, emptyText: string, repostedBy?: boolean) =>
    list.length === 0 ? (
      <div className="fx-empty"><h2>{emptyTitle}</h2><p>{emptyText}</p></div>
    ) : (
      list.map(p => (
        <ForumPost
          key={p.id}
          post={repostedBy ? { ...enrich(p), isRepost: true, authorName: pd.displayName || handle, authorUsername: handle, uid: pd.uid, originalAuthorName: p.authorName, originalAuthorUsername: p.authorUsername, originalAuthorPhotoURL: p.authorPhotoURL, originalAuthorIsPsychologist: p.authorIsPsychologist, originalPostId: p.id } as any : enrich(p)}
          currentUserUid={user?.uid}
          currentUserEmail={user?.email || ''}
          adminEmails={ADMIN}
          isDark={isDark}
          onOpen={(x: any) => skipSplashAndGo(`/forum?thread=${x.originalPostId || x.id}`)}
          onLike={actions.onLike as any}
          onDislike={actions.onDislike as any}
          onRepost={actions.onRepost as any}
          onBookmark={actions.onBookmark as any}
          onDelete={delPost}
          onTopic={(c) => skipSplashAndGo(`/forum?cat=${encodeURIComponent(c)}`)}
        />
      ))
    );

  const settingsSections: { id: typeof settingsTab; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profil bilgileri', desc: 'Ad, kullanıcı adı, biyografi', icon: <User size={20} /> },
    { id: 'security', label: 'Şifre ve e-posta', desc: 'E-posta doğrulama, şifre değiştirme', icon: <Key size={20} /> },
    { id: 'privacy', label: 'Gizlilik', desc: 'Gizli profil, beğeni ve yanıt görünürlüğü', icon: <Shield size={20} /> },
    { id: 'blocked', label: 'Engellenen hesaplar', desc: blocks.blockedList.length ? `${blocks.blockedList.length} kişi` : 'Engellediğin kişileri yönet', icon: <Ban size={20} /> },
    { id: 'policy', label: 'Gizlilik politikası', desc: 'Verilerini nasıl koruduğumuz', icon: <ScrollText size={20} /> },
    { id: 'appearance', label: 'Görünüm', desc: 'Açık ya da koyu tema', icon: <Sun size={20} /> },
    { id: 'badge', label: 'Psikolog rozeti', desc: isApproved ? (pd.hideBadge ? 'Rozet gizli' : 'Rozet görünür') : pd.psychologistStatus === 'pending' ? 'Başvuru inceleniyor' : 'Başvuru yap', icon: <Award size={20} /> },
    { id: 'danger', label: 'Hesap', desc: 'Çıkış, dondurma, silme', icon: <AlertTriangle size={20} /> },
  ];
  const closeSettings = () => { setSettingsOpen(false); setSettingsDetail(false); };
  const currentSection = settingsSections.find(s => s.id === settingsTab)!;

  const Toggle = ({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) => (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`fx-switch ${on ? 'is-on' : ''}`} onClick={onChange}>
      <span />
    </button>
  );

  return (
    <ForumShell active={isOwn ? 'profile' : null}>
      {(shell) => (
        <>
          {listMode ? (
            <FollowList
              profile={pd}
              mode={listMode}
              onMode={setListMode}
              onBack={() => setListMode(null)}
              onNeedAuth={shell.openAuth}
            />
          ) : (
            <>
              <div className="fx-thead fx-thead-2">
                <button type="button" className="fx-icon-btn" onClick={() => (window.history.length > 1 ? router.back() : skipSplashAndGo('/forum'))} aria-label="Geri" style={{ color: 'var(--fx-ink)' }}>
                  <ArrowLeft size={20} />
                </button>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2>{pd.displayName || handle}</h2>
                  <div className="fx-thead-sub">{posts.length} gönderi</div>
                </div>
                <button type="button" className="fx-icon-btn fx-only-mobile" onClick={shell.toggleTheme} aria-label="Temayı değiştir" style={{ color: 'var(--fx-ink)' }}>
                  {shell.isDark ? <Sun size={19} /> : <Moon size={19} />}
                </button>
              </div>

              {/* Kapak */}
              <div className="fx-cover" style={pd.coverURL ? { backgroundImage: `url(${pd.coverURL})` } : undefined}>
                <input ref={coverRef} type="file" accept="image/*" hidden onChange={handleCover} />
              </div>

              <div className="fx-prof">
                <div className="fx-prof-top">
                  <div className="fx-prof-avatar">
                    <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
                    <Avatar src={pd.photoURL} name={pd.displayName || handle} size={134} />
                  </div>
                  <div className="fx-prof-actions">
                    {isOwn ? (
                      <>
                        <button type="button" className="fx-icon-btn fx-icon-outline" onClick={() => { setSettingsTab('profile'); setSettingsDetail(false); setSettingsOpen(true); }} aria-label="Ayarlar" title="Ayarlar">
                          <Settings size={18} />
                        </button>
                        <button type="button" className="fx-btn fx-btn-outline" onClick={() => setEditOpen(true)}>Profili düzenle</button>
                      </>
                    ) : (
                      <>
                        <div className="fx-menu-wrap">
                          <button type="button" className="fx-icon-btn fx-icon-outline" onClick={() => setProfMenu(v => !v)} aria-label="Diğer seçenekler" aria-expanded={profMenu}>
                            <MoreHorizontal size={18} />
                          </button>
                          {profMenu && (
                            <>
                              <div className="fx-menu-backdrop" onClick={() => setProfMenu(false)} />
                              <div className="fx-menu" role="menu">
                                <button type="button" role="menuitem" onClick={() => { setProfMenu(false); try { navigator.clipboard.writeText(window.location.href); toast.success('Profil bağlantısı panoya kopyalandı'); } catch {} }}>
                                  <Share2 size={17} /> Profil bağlantısını kopyala
                                </button>
                                {user && !user.isAnonymous && (
                                  <button type="button" role="menuitem" className={iBlocked ? '' : 'is-danger'} onClick={() => { setProfMenu(false); toggleBlock(shell.openAuth); }}>
                                    <Ban size={17} /> {iBlocked ? `@${handle} adlı kişinin engelini kaldır` : `@${handle} adlı kişiyi engelle`}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        {iBlocked ? (
                          <button type="button" className="fx-btn fx-follow is-blocked" data-label-hover="Engeli kaldır" onClick={() => toggleBlock(shell.openAuth)}>
                            <span>Engellendi</span>
                          </button>
                        ) : !blockedMe && (
                          <button
                            type="button"
                            className={`fx-btn fx-btn-primary fx-follow ${following ? 'is-following' : ''}`}
                            data-label-hover={following ? 'Takibi bırak' : undefined}
                            onClick={() => (user && !user.isAnonymous ? toggleFollow() : shell.openAuth())}
                          >
                            <span>{following ? 'Takiptesin' : followsMe ? 'Geri takip et' : 'Takip et'}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="fx-prof-name">
                  <h1>{pd.displayName || handle}</h1>
                  {isPsych && <VerifiedMark size={17} label={pd.title} />}
                  <LevelBadge level={scores.users[pd.uid]?.level || 1} points={scores.users[pd.uid]?.points || 0} />
                </div>
                <div className="fx-prof-handle">
                  @{handle}
                  {followsMe && !isOwn && !iBlocked && !blockedMe && <span className="fx-follows-you">Seni takip ediyor</span>}
                </div>

                {pd.headline && <p className="fx-prof-headline">{pd.headline}</p>}
                {pd.bio && showAll && <p className="fx-prof-bio">{renderTextWithMentions(pd.bio)}</p>}

                <div className="fx-prof-meta">
                  {pd.location && <span><MapPin size={16} />{pd.location}</span>}
                  {pd.website && (
                    <a href={pd.website.startsWith('http') ? pd.website : `https://${pd.website}`} target="_blank" rel="noreferrer noopener">
                      <LinkIcon size={16} />{pd.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {joined && <span><Calendar size={16} />{joined} tarihinde katıldı</span>}
                  {pd.isPrivate && <span><Lock size={15} />Gizli hesap</span>}
                </div>

                <div className="fx-prof-counts">
                  <button type="button" onClick={() => (locked ? null : setShowAll(true))} disabled={locked}>
                    <b>{posts.length}</b> Gönderi
                  </button>
                  <button type="button" onClick={() => (locked ? null : setListMode('following'))} disabled={locked}>
                    <b>{followings}</b> Takip edilen
                  </button>
                  <button type="button" onClick={() => (locked ? null : setListMode('followers'))} disabled={locked}>
                    <b>{followers}</b> Takipçi
                  </button>
                </div>
                {isOwn && <LevelCard score={scores.users[pd.uid]} />}

                {isOwn && !isAdmin && !emailVerified && !user?.emailVerified && (
                  <div className="fx-callout is-warn">
                    <div><b>E-posta adresin doğrulanmadı.</b> Paylaşım yapabilmek için {user?.email} adresine gelen bağlantıya tıkla.</div>
                    <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => { setSettingsTab('security'); setSettingsDetail(true); setSettingsOpen(true); }}>Doğrula</button>
                  </div>
                )}
                {isOwn && pd.psychologistStatus === 'pending' && (
                  <div className="fx-callout">
                    <div><b>Psikolog başvurun inceleniyor.</b> Belgelerin onaylandığında rozet profilinde ve gönderilerinde otomatik görünecek.</div>
                  </div>
                )}
                {isOwn && pd.isFrozen && (
                  <div className="fx-callout">
                    {pd.frozenByAdmin
                      ? <div><b>Hesabın yönetici tarafından donduruldu.</b> Profilin ve gönderilerin diğer kullanıcılardan gizli. Bir yanlışlık olduğunu düşünüyorsan bizimle iletişime geç.</div>
                      : <div><b>Hesabın dondurulmuş.</b> Profilin ve gönderilerin diğer kullanıcılardan gizli.</div>}
                    {!pd.frozenByAdmin && <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={handleToggleFreeze} disabled={freezing}>{freezing ? 'Etkinleştiriliyor…' : 'Hesabı etkinleştir'}</button>}
                  </div>
                )}
              </div>

              {locked ? (
                <div className="fx-empty">
                  {blockedMe ? (
                    <>
                      <h2>@{handle} seni engelledi</h2>
                      <p>Gönderilerini göremez, takip edemez ve yanıt yazamazsın.</p>
                    </>
                  ) : iBlocked ? (
                    <>
                      <h2>@{handle} adlı kişiyi engelledin</h2>
                      <p>Engelli olduğu sürece seni takip edemez ve gönderilerini göremez. Onun gönderileri de sana gösterilmez.</p>
                      <button type="button" className="fx-btn fx-btn-outline" onClick={() => toggleBlock(shell.openAuth)}>Engeli kaldır</button>
                    </>
                  ) : pd.isFrozen ? (
                    <>
                      <h2>Bu hesap dondurulmuş</h2>
                      <p>Hesap sahibi profilini geçici olarak gizledi.</p>
                    </>
                  ) : (
                    <>
                      <h2>Bu hesap gizli</h2>
                      <p>Gönderilerini ve takip listelerini görmek için @{handle} hesabını takip et.</p>
                      <button type="button" className="fx-btn fx-btn-primary" onClick={() => (user && !user.isAnonymous ? toggleFollow() : shell.openAuth())}>Takip et</button>
                    </>
                  )}
                </div>
              ) : !showAll ? (
                <ProfileOverview
                  pd={pd}
                  isOwn={isOwn}
                  postCount={posts.length}
                  preview={renderPosts(posts.slice(0, 3), isOwn ? 'Henüz gönderi paylaşmadın' : 'Henüz gönderi yok', isOwn ? 'İlk düşünceni ya da sorunu paylaştığında burada görünecek.' : `@${handle} henüz bir şey paylaşmadı.`)}
                  onShowAll={() => { setShowAll(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onEdit={() => setEditOpen(true)}
                />
              ) : (
                <>
                  <button type="button" className="fx-cv-back" onClick={() => setShowAll(false)}><ArrowLeft size={16} /> Profile dön</button>
                  <div className="fx-tabs fx-tabs-scroll" role="tablist">
                    {profileTabs.map(t => (
                      <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`fx-tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id as any)}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {tab === 'posts' && isOwn && !pd.isFrozen && <Composer onPosted={(np) => { if (!np.isAnonymous) setPosts(prev => [np, ...prev]); }} />}
                  {tab === 'posts' && renderPosts(posts, isOwn ? 'Henüz gönderi paylaşmadın' : 'Henüz gönderi yok', isOwn ? 'İlk düşünceni ya da sorunu paylaştığında burada görünecek.' : `@${handle} henüz bir şey paylaşmadı.`)}

                  {tab === 'replies' && (
                    replies.length === 0 ? (
                      <div className="fx-empty"><h2>Henüz yanıt yok</h2><p>Gönderilere yazılan yanıtlar burada listelenir.</p></div>
                    ) : replies.map(r => (
                      <div key={`${r.postId}-${r.id}`} className="fx-post" onClick={() => r.postId && skipSplashAndGo(`/forum?thread=${r.postId}`)}>
                        <div className="fx-post-social" style={{ marginLeft: 52 }}>
                          <MessageCircle size={14} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>“{r.postBody}…” gönderisine yanıt</span>
                        </div>
                        <div className="fx-post-grid">
                          <Avatar src={pd.photoURL} name={pd.displayName} size={40} />
                          <div className="fx-post-body">
                            <div className="fx-post-meta">
                              <div className="fx-post-meta-main">
                                <span className="fx-name">{pd.displayName}</span>
                                {isPsych && <VerifiedMark label={pd.title} />}
                                <span className="fx-handle">@{handle}</span>
                                <span className="fx-sep">·</span>
                                <span className="fx-time">{formatTimeAgo(r.createdAt)}</span>
                              </div>
                            </div>
                            <p className="fx-post-text">{renderTextWithMentions(r.text)}</p>
                            {r.imageUrl && <div className="fx-post-media"><img src={r.imageUrl} alt="" loading="lazy" /></div>}
                            <div style={{ height: 10 }} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {tab === 'reposts' && renderPosts(reposts, 'Henüz yeniden paylaşım yok', 'Yeniden paylaşılan gönderiler burada görünür.', true)}
                  {tab === 'likes' && renderPosts(likes, 'Henüz beğeni yok', isOwn ? 'Beğendiğin gönderiler burada toplanır.' : 'Beğenilen gönderiler burada görünür.')}
                  {tab === 'bookmarks' && isOwn && renderPosts(bookmarks, 'Kaydettiğin gönderi yok', 'Bir gönderiyi kaydettiğinde yalnızca sen burada görebilirsin.')}
                </>
              )}
            </>
          )}

          {/* ── Profili düzenle ── */}
          {editOpen && isOwn && (
            <div className="fx-modal-scrim" onClick={() => setEditOpen(false)}>
              <div className="fx-modal fx-modal-lg" role="dialog" aria-modal="true" aria-label="Profili düzenle" onClick={e => e.stopPropagation()}>
                <div className="fx-modal-head">
                  <button type="button" className="fx-icon-btn" onClick={() => setEditOpen(false)} aria-label="Kapat" style={{ color: 'var(--fx-ink)' }}><X size={20} /></button>
                  <div className="fx-modal-title">Profili düzenle</div>
                  <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={saveProfile} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
                </div>
                <div className="fx-modal-scroll">
                  <div className="fx-cover fx-cover-edit" style={pd.coverURL ? { backgroundImage: `url(${pd.coverURL})` } : undefined}>
                    <button type="button" className="fx-photo-btn" onClick={() => coverRef.current?.click()} disabled={upCover} aria-label="Kapak fotoğrafını değiştir">
                      {upCover ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={20} />}
                    </button>
                  </div>
                  <div className="fx-edit-avatar">
                    <Avatar src={pd.photoURL} name={pd.displayName} size={104} />
                    <button type="button" className="fx-photo-btn" onClick={() => photoRef.current?.click()} disabled={upPhoto} aria-label="Profil fotoğrafını değiştir">
                      {upPhoto ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={20} />}
                    </button>
                  </div>
                  <div className="fx-form">
                    <label className="fx-input">
                      <span>Ad</span>
                      <input value={ed.displayName} maxLength={50} onChange={e => setEd({ ...ed, displayName: e.target.value })} />
                    </label>
                    <label className="fx-input">
                      <span>Kullanıcı adı</span>
                      <div className="fx-input-prefix"><em>@</em><input value={ed.username} maxLength={30} onChange={e => setEd({ ...ed, username: sanitizeUsername(e.target.value) })} /></div>
                      <small>Küçük harf (a-z), rakam ve alt çizgi. Bahsetmelerde (@ad) kullanılır.</small>
                    </label>
                    <label className="fx-input">
                      <span>Hakkında</span>
                      <textarea rows={5} maxLength={600} value={ed.bio} onChange={e => setEd({ ...ed, bio: e.target.value })} />
                      <small>{ed.bio.length}/600</small>
                    </label>
                    <label className="fx-input">
                      <span>Konum</span>
                      <input value={ed.location} maxLength={40} onChange={e => setEd({ ...ed, location: e.target.value })} />
                    </label>
                    <label className="fx-input">
                      <span>Web sitesi</span>
                      <input value={ed.website} maxLength={100} inputMode="url" onChange={e => setEd({ ...ed, website: e.target.value })} />
                    </label>
                  </div>
                  <ProfileExtrasEditor value={extras} onChange={setExtras} />
                </div>
              </div>
            </div>
          )}

          {/* ── Ayarlar ── */}
          {settingsOpen && isOwn && (
            <div className="fx-modal-scrim" onClick={closeSettings}>
              <div className="fx-settings" data-detail={settingsDetail ? 'true' : 'false'} role="dialog" aria-modal="true" aria-label="Ayarlar" onClick={e => e.stopPropagation()}>
                <div className="fx-settings-nav">
                  <div className="fx-modal-head">
                    <button type="button" className="fx-icon-btn" onClick={closeSettings} aria-label="Kapat" style={{ color: 'var(--fx-ink)' }}><X size={20} /></button>
                    <div className="fx-modal-title">Ayarlar</div>
                  </div>
                  {settingsSections.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`fx-settings-item ${settingsTab === s.id ? 'is-active' : ''}`}
                      onClick={() => { if (s.id === 'profile') { closeSettings(); setEditOpen(true); return; } if (s.id === 'policy') { closeSettings(); router.push('/gizlilik'); return; } setSettingsTab(s.id); setSettingsDetail(true); }}
                    >
                      <span className="fx-settings-ic">{s.icon}</span>
                      <span className="fx-settings-text"><b>{s.label}</b><small>{s.desc}</small></span>
                      <ChevronRight size={18} className="fx-settings-chev" />
                    </button>
                  ))}
                </div>

                <div className="fx-settings-pane">
                  <div className="fx-modal-head">
                    <button type="button" className="fx-icon-btn fx-settings-back" onClick={() => setSettingsDetail(false)} aria-label="Ayarlara dön" style={{ color: 'var(--fx-ink)' }}><ArrowLeft size={20} /></button>
                    <div className="fx-modal-title">{settingsTab === 'profile' ? 'Ayarlar' : currentSection.label}</div>
                    <button type="button" className="fx-icon-btn fx-settings-x" onClick={closeSettings} aria-label="Kapat" style={{ color: 'var(--fx-ink)' }}><X size={20} /></button>
                  </div>

                  <div className="fx-settings-body">
                    {settingsTab === 'profile' && (
                      <div className="fx-set-intro">
                        <p>Soldan bir bölüm seç. Ad, kullanıcı adı, biyografi ve fotoğraflar için <button type="button" className="fx-text-btn" onClick={() => { closeSettings(); setEditOpen(true); }}>Profili düzenle</button> ekranını kullan.</p>
                      </div>
                    )}

                    {settingsTab === 'security' && (
                      <>
                        <section className="fx-set-group">
                          <h3>E-posta</h3>
                          <div className="fx-set-row">
                            <div className="fx-set-text">
                              <b>{user?.email}</b>
                              <small>{emailVerified ? 'Doğrulandı' : 'Doğrulanmadı. Paylaşım ve yanıt için doğrulama gerekir.'}</small>
                            </div>
                            <span className={`fx-pill ${emailVerified ? 'is-ok' : 'is-warn'}`}>{emailVerified ? 'Doğrulandı' : 'Bekliyor'}</span>
                          </div>
                          {!emailVerified && (
                            <div className="fx-set-actions">
                              <button
                                type="button"
                                className="fx-btn fx-btn-primary fx-btn-sm"
                                disabled={sendingVerification}
                                onClick={async () => {
                                  setSendingVerification(true);
                                  try { await resendVerificationEmail(); toast.success('Doğrulama bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et.'); }
                                  catch (err: any) { toast.error(err.message || 'Gönderilemedi'); }
                                  finally { setSendingVerification(false); }
                                }}
                              >
                                <Send size={14} /> {sendingVerification ? 'Gönderiliyor…' : 'Doğrulama bağlantısı gönder'}
                              </button>
                              <button
                                type="button"
                                className="fx-btn fx-btn-outline fx-btn-sm"
                                disabled={checkingVerification}
                                onClick={async () => {
                                  setCheckingVerification(true);
                                  try {
                                    const ok = await refreshEmailVerification();
                                    if (ok) toast.success('E-posta adresin doğrulandı.');
                                    else toast.error('Henüz doğrulanmamış. Bağlantıya tıkladıktan sonra tekrar dene.');
                                  } catch (err: any) { toast.error('Kontrol edilemedi: ' + err.message); }
                                  finally { setCheckingVerification(false); }
                                }}
                              >
                                <RefreshCw size={14} /> {checkingVerification ? 'Kontrol ediliyor…' : 'Doğruladım, kontrol et'}
                              </button>
                            </div>
                          )}
                        </section>

                        <form className="fx-set-group" onSubmit={handleChangePassword}>
                          <h3>Şifreyi değiştir</h3>
                          <div className="fx-form">
                            <label className="fx-input"><span>Mevcut şifre</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
                            <label className="fx-input"><span>Yeni şifre</span><input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /><PasswordStrengthMeter password={newPassword} mutedColor="var(--fx-ink-3)" />{!newPassword && <small>En az 6 karakter ve bir rakam; güç en az "Orta" olmalı.</small>}</label>
                            <label className="fx-input"><span>Yeni şifre (tekrar)</span><input type="password" autoComplete="new-password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} /></label>
                          </div>
                          <div className="fx-set-actions">
                            <button type="submit" className="fx-btn fx-btn-primary" disabled={changingPassword || !newPassword || Boolean(getPasswordError(newPassword))}>{changingPassword ? 'Güncelleniyor…' : 'Şifreyi değiştir'}</button>
                          </div>
                        </form>

                        <section className="fx-set-group">
                          <h3>Şifreni mi unuttun?</h3>
                          <p className="fx-set-note">{user?.email} adresine şifre sıfırlama bağlantısı gönderilir.</p>
                          <div className="fx-set-actions">
                            <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={handleSendResetEmail} disabled={sendingResetEmail}>{sendingResetEmail ? 'Gönderiliyor…' : 'Sıfırlama bağlantısı gönder'}</button>
                          </div>
                        </section>
                      </>
                    )}

                    {settingsTab === 'privacy' && (
                      <>
                        <section className="fx-set-group">
                          <div className="fx-set-row">
                            <div className="fx-set-text"><b>Gizli hesap</b><small>Gönderilerini ve takip listelerini yalnızca seni takip edenler görür. Gönderilerin genel akışta gösterilmez.</small></div>
                            <Toggle label="Gizli hesap" on={ed.isPrivate} onChange={() => setEd(p => ({ ...p, isPrivate: !p.isPrivate }))} />
                          </div>
                          <div className="fx-set-row">
                            <div className="fx-set-text"><b>Beğenilerimi gizle</b><small>Profilindeki Beğeniler sekmesini yalnızca sen görürsün.</small></div>
                            <Toggle label="Beğenilerimi gizle" on={ed.hideLikes} onChange={() => setEd(p => ({ ...p, hideLikes: !p.hideLikes }))} />
                          </div>
                          <div className="fx-set-row">
                            <div className="fx-set-text"><b>Yanıtlarımı gizle</b><small>Profilindeki Yanıtlar sekmesini yalnızca sen görürsün.</small></div>
                            <Toggle label="Yanıtlarımı gizle" on={ed.hideReplies} onChange={() => setEd(p => ({ ...p, hideReplies: !p.hideReplies }))} />
                          </div>
                        </section>
                        <div className="fx-set-actions fx-set-sticky">
                          <button type="button" className="fx-btn fx-btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Gizlilik ayarlarını kaydet'}</button>
                        </div>
                      </>
                    )}

                    {settingsTab === 'blocked' && user && <BlockedList uid={user.uid} />}

                    {settingsTab === 'appearance' && (
                      <section className="fx-set-group">
                        <p className="fx-set-note">Tercihin bu tarayıcıda hatırlanır.</p>
                        <div className="fx-theme-pick">
                          {[{ dark: false, label: 'Açık', icon: <Sun size={18} /> }, { dark: true, label: 'Koyu', icon: <Moon size={18} /> }].map(o => (
                            <button key={o.label} type="button" className={`fx-theme-opt ${shell.isDark === o.dark ? 'is-active' : ''} ${o.dark ? 'is-dark' : ''}`} onClick={() => shell.setTheme(o.dark)} aria-pressed={shell.isDark === o.dark}>
                              <span className="fx-theme-preview"><i /><i /><i /></span>
                              <span className="fx-theme-label">{o.icon}{o.label}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {settingsTab === 'badge' && (
                      <section className="fx-set-group">
                        {isApproved ? (
                          <>
                            <div className="fx-set-row">
                              <div className="fx-set-text">
                                <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}><VerifiedMark size={17} label={pd.title} /></b>
                                <small>{pd.hideBadge ? 'Rozetin şu an gizli. Psikolog statün devam ediyor; istediğin zaman tekrar görünür yapabilirsin.' : 'Rozetin profilinde, gönderilerinde ve yanıtlarında görünüyor.'}</small>
                              </div>
                              <Toggle label="Rozeti göster" on={!pd.hideBadge} onChange={() => !togglingBadge && handleToggleBadge()} />
                            </div>
                          </>
                        ) : pd.psychologistStatus === 'pending' ? (
                          <>
                            <div className="fx-set-row">
                              <div className="fx-set-text"><b>Başvurun inceleniyor</b><small>Yüklediğin mezun belgesi yöneticiler tarafından inceleniyor. Onaylandığında rozet otomatik olarak görünür. Kontrol edildikten sonra belgeniz otomatik olarak sistem tarafından silinir.</small></div>
                              <span className="fx-pill is-warn">İnceleniyor</span>
                            </div>
                            <div className="fx-set-actions">
                              <label className="fx-btn fx-btn-outline fx-btn-sm" style={{ cursor: 'pointer' }}>
                                <Upload size={14} /> {uploadingDiploma ? 'Yükleniyor…' : (pd.diplomaUrl || myDiploma) ? 'Belgeyi güncelle' : 'Mezun belgesi yükle'}
                                <input type="file" accept="image/*,application/pdf" hidden onChange={handleUploadDiploma} disabled={uploadingDiploma} />
                              </label>
                              {(pd.diplomaUrl || myDiploma) && <a className="fx-text-btn" href={pd.diplomaUrl || myDiploma} target="_blank" rel="noreferrer">Yüklenen belgeyi gör</a>}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="fx-set-note">Lisanslı bir psikologsan e-Devlet'ten aldığın mezun belgenle başvur. Onaylandığında adının yanında altın onay rozeti görünür. Kontrol edildikten sonra belgeniz otomatik olarak sistem tarafından silinir.</p>
                            <div className="fx-set-actions">
                              <button type="button" className="fx-btn fx-btn-primary" onClick={() => { closeSettings(); router.push('/kayit/psikolog'); }}>Başvuru yap</button>
                            </div>
                          </>
                        )}
                      </section>
                    )}

                    {settingsTab === 'danger' && (
                      <>
                        <section className="fx-set-group">
                          <div className="fx-set-row">
                            <div className="fx-set-text"><b>Çıkış yap</b><small>Bu cihazdaki oturumunu kapatır.</small></div>
                            <button
                              type="button"
                              className="fx-btn fx-btn-outline fx-btn-sm"
                              onClick={async () => { closeSettings(); try { await logout(); toast.success('Çıkış yapıldı'); router.push('/forum'); } catch (err: any) { toast.error('Çıkış yapılamadı: ' + err.message); } }}
                            >
                              Çıkış yap
                            </button>
                          </div>
                        </section>

                        <section className="fx-set-group">
                          <h3>{pd.isFrozen ? 'Hesabı etkinleştir' : 'Hesabı dondur'}</h3>
                          <p className="fx-set-note">Dondurulan hesabın profili, gönderileri ve etkileşimleri diğer kullanıcılardan gizlenir. İstediğin zaman geri açabilirsin.</p>
                          {pd.isFrozen ? (
                            pd.frozenByAdmin ? <p className="fx-set-note">Hesabın yönetici tarafından donduruldu; yeniden açmak için bizimle iletişime geç.</p> :
                            <div className="fx-set-actions"><button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={handleToggleFreeze} disabled={freezing}>{freezing ? 'Etkinleştiriliyor…' : 'Hesabı etkinleştir'}</button></div>
                          ) : !freezeModalOpen ? (
                            <div className="fx-set-actions"><button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => setFreezeModalOpen(true)}>Hesabı dondur</button></div>
                          ) : (
                            <div className="fx-confirm">
                              <label className="fx-input"><span>Onaylamak için şifreni gir</span><input type="password" autoComplete="current-password" value={freezePassword} onChange={e => setFreezePassword(e.target.value)} /></label>
                              <div className="fx-set-actions">
                                <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => { setFreezeModalOpen(false); setFreezePassword(''); }}>Vazgeç</button>
                                <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={handleToggleFreeze} disabled={freezing || !freezePassword.trim()}>{freezing ? 'Doğrulanıyor…' : 'Hesabı dondur'}</button>
                              </div>
                            </div>
                          )}
                        </section>

                        <section className="fx-set-group is-danger">
                          <h3>Hesabı sil</h3>
                          <p className="fx-set-note">Profil bilgilerin ve takip bağlantıların silinir, oturumun kapatılır. Bu işlem geri alınamaz.</p>
                          {!deleteModalOpen ? (
                            <div className="fx-set-actions"><button type="button" className="fx-btn fx-btn-danger fx-btn-sm" onClick={() => setDeleteModalOpen(true)}>Hesabı sil</button></div>
                          ) : (
                            <div className="fx-confirm">
                              {hasPassword ? (
                                <label className="fx-input"><span>Şifren</span><input type="password" autoComplete="current-password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} /></label>
                              ) : (
                                <p className="fx-set-note">Silmeden önce Google hesabınla kimliğini doğrulaman istenecek.</p>
                              )}
                              <label className="fx-input"><span>Onaylamak için SİL yaz</span><input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="SİL" /></label>
                              <div className="fx-set-actions">
                                <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => { setDeleteModalOpen(false); setDeletePassword(''); setDeleteConfirmText(''); }}>Vazgeç</button>
                                <button
                                  type="button"
                                  className="fx-btn fx-btn-danger fx-btn-sm"
                                  onClick={handleDeleteAccount}
                                  disabled={deletingAccount || (hasPassword && !deletePassword.trim()) || deleteConfirmText.trim().toLocaleUpperCase('tr-TR') !== 'SİL'}
                                >
                                  {deletingAccount ? 'Siliniyor…' : 'Hesabı kalıcı olarak sil'}
                                </button>
                              </div>
                            </div>
                          )}
                        </section>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </ForumShell>
  );
}
