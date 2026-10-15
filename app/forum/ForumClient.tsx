'use client';
import React, { useState, useEffect, useRef } from 'react';
import { addDoc, collection, serverTimestamp, orderBy, query, updateDoc, doc, increment, onSnapshot, deleteDoc, deleteField, where, getDocs, getDoc, limit, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import ForumPost from '@/components/forum/ForumPost';
import ThreadView from '@/components/forum/ThreadView';
import { Search, TrendingUp, Hash, Bell, Users, Home, X, PenSquare, FileText, MessageCircle, ArrowRight, Film, Camera, Loader2, Sparkles, MessageSquare, User, Bookmark, Heart, Sun, Moon, Plus, Menu, LogOut, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { notifyMentions } from '@/lib/mentionUtils';

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



const POST_CHAR_LIMIT = 140;

export default function ForumClient() {
  const { user, userProfile, logout, emailVerified, resendVerificationEmail } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const topSearchInputRef = useRef<HTMLInputElement>(null);
  const [threads, setThreads] = useState<Post[]>([]);
  const [filter, setFilter] = useState('Tümü');
  const [feedTab, setFeedTab] = useState<'all' | 'following' | 'bookmarks' | 'likes'>('all');
  const [followingUids, setFollowingUids] = useState<string[]>([]);
  const [form, setForm] = useState({ body: '', cat: 'Psikanaliz', imageUrl: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [posting, setPosting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  // Animated "MANAV FORUM" Splash / Loading screen state (skipped on back navigation)
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('forum_skip_splash') === 'true' || sessionStorage.getItem('forum_splash_shown') === '1') {
          return false;
        }
      } catch (e) {
        // ignore
      }
    }
    return true;
  });
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('forum_skip_splash');
      } catch (e) {}
    }
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => {
        setShowSplash(false);
        try {
          sessionStorage.setItem('forum_splash_shown', '1');
        } catch (e) {}
      }, 450);
    }, 1300);
    return () => clearTimeout(timer);
  }, [showSplash]);

  // Dark Mode State with localStorage persistence
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('forum_theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDark(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem('forum_theme', next ? 'dark' : 'light');
      } catch (e) {}
      return next;
    });
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

  useEffect(() => { return onSnapshot(collection(db, 'users'), snap => { const m: Record<string, any> = {}; snap.docs.forEach(d => m[d.id] = d.data()); setUsersMap(m); }); }, []);
  useEffect(() => { const q = query(collection(db, 'forum'), orderBy('createdAt', 'desc')); return onSnapshot(q, snap => { setThreads(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[]); }); }, []);
  useEffect(() => { if (!user || user.isAnonymous) return; const q = query(collection(db, 'notifications'), where('toUid', '==', user.uid), where('read', '==', false)); return onSnapshot(q, snap => setUnreadCount(snap.size)); }, [user]);
  useEffect(() => { if (!user || user.isAnonymous) return; const q = query(collection(db, 'follows'), where('followerId', '==', user.uid)); return onSnapshot(q, snap => setFollowingUids(snap.docs.map(d => d.data().followingId))); }, [user]);

  // Sync search query, tag, category, and feed from URL
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    const qParam = searchParams.get('search') || searchParams.get('q');
    if (tagParam) {
      setSearchQuery(tagParam.startsWith('#') ? tagParam : `#${tagParam}`);
      setFilter('Tümü');
      setActiveThread(null);
    } else if (qParam !== null && qParam !== undefined) {
      if (qParam === 'open' || qParam === '1') {
        setMobileSearchOpen(true);
        setTimeout(() => {
          topSearchInputRef.current?.focus();
        }, 200);
      } else {
        setSearchQuery(qParam);
      }
    }
    const catParam = searchParams.get('cat');
    if (catParam) {
      setFilter(catParam);
    }
    const feedParam = searchParams.get('feed');
    if (feedParam === 'following' || feedParam === 'bookmarks' || feedParam === 'likes') {
      setFeedTab(feedParam as any);
    }
    const composeParam = searchParams.get('compose');
    if (composeParam === 'open' || composeParam === '1') {
      setTimeout(() => {
        if (!user || user.isAnonymous) setAuthOpen(true);
        else setComposeModalOpen(true);
      }, 200);
    }
  }, [searchParams, user]);

  const filtered = (() => {
    let list = threads.filter(t => !t.isRepost);
    // Hide posts by banned or frozen users, and hide private accounts completely from public feed/search
    list = list.filter(t => {
      const author = usersMap[t.uid];
      if (author?.isBanned) return false;
      if (author?.isFrozen || author?.isDeleted) return false;
      // Private profiles: share cannot be seen anywhere including main feed; only on their own profile
      if (author?.isPrivate && t.uid !== user?.uid) return false;
      return true;
    });
    if (filter !== 'Tümü') list = list.filter(t => t.category === filter);
    if (feedTab === 'following') list = list.filter(t => followingUids.includes(t.uid));
    if (feedTab === 'bookmarks') list = list.filter(t => Boolean(t.bookmarksData?.[user?.uid || '']));
    if (feedTab === 'likes') list = list.filter(t => t.reactionsData?.[user?.uid || ''] === 'like' || t.reactionsData?.[user?.uid || ''] === 'heart');
    if (searchQuery.trim()) { 
      const rawQ = searchQuery.trim().toLocaleLowerCase('tr-TR');
      const cleanQ = rawQ.startsWith('#') ? rawQ.slice(1) : rawQ;
      list = list.filter(t => {
        const body = (t.body || '').toLocaleLowerCase('tr-TR');
        const title = (t.title || '').toLocaleLowerCase('tr-TR');
        const author = (t.authorName || '').toLocaleLowerCase('tr-TR');
        const username = (t.authorUsername || '').toLocaleLowerCase('tr-TR');
        const category = (t.category || '').toLocaleLowerCase('tr-TR');
        const cleanCat = category.replace(/[\s&]+/g, '');

        if (rawQ.startsWith('#')) {
          return body.includes(`#${cleanQ}`) || cleanCat === cleanQ || category.includes(cleanQ);
        }
        return (
          body.includes(rawQ) ||
          title.includes(rawQ) ||
          body.includes(`#${cleanQ}`) ||
          author.includes(rawQ) ||
          username.includes(rawQ) ||
          category.includes(rawQ)
        );
      });
    }
    return list;
  })();

  // Matching users based on search query
  const matchedUsers = React.useMemo(() => {
    const rawQ = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!rawQ) return [];
    const cleanQ = rawQ.startsWith('@') ? rawQ.slice(1) : rawQ.startsWith('#') ? '' : rawQ;
    if (!cleanQ) return [];
    return Object.values(usersMap).filter((u: any) => {
      if (!u || u.isFrozen || u.isDeleted) return false;
      const uname = (u.username || '').toLocaleLowerCase('tr-TR');
      const dname = (u.displayName || '').toLocaleLowerCase('tr-TR');
      const bio = (u.bio || '').toLocaleLowerCase('tr-TR');
      return uname.includes(cleanQ) || dname.includes(cleanQ) || bio.includes(cleanQ);
    }).slice(0, 8);
  }, [searchQuery, usersMap]);

  const toggleFollowUser = async (targetUid: string) => {
    if (!user || user.isAnonymous) {
      setAuthOpen(true);
      return;
    }
    const fid = `${user.uid}_${targetUid}`;
    const isFollowing = followingUids.includes(targetUid);
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, 'follows', fid));
        toast.success('Takipten çıkıldı.');
      } else {
        await setDoc(doc(db, 'follows', fid), {
          followerId: user.uid,
          followingId: targetUid,
          createdAt: serverTimestamp(),
        });
        toast.success('Takip edildi!');
      }
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + (err.message || ''));
    }
  };

  // Dynamic trending hashtags from all post bodies
  const trends = (() => {
    const tagCounts: Record<string, { tag: string; count: number }> = {};
    threads.forEach(t => {
      if (!t.body) return;
      const matches = t.body.match(/#([a-zA-Z0-9ğıüşöçİĞÜŞÖÇ_]+)/g);
      if (matches) {
        const uniqueInPost = Array.from(new Set(matches.map(m => m.trim())));
        uniqueInPost.forEach(rawTag => {
          const clean = rawTag.startsWith('#') ? rawTag.slice(1) : rawTag;
          if (!clean) return;
          const key = clean.toLocaleLowerCase('tr-TR');
          if (!tagCounts[key]) {
            tagCounts[key] = { tag: clean, count: 0 };
          }
          tagCounts[key].count += 1;
        });
      }
    });

    // Also include categories as fallback hashtags
    CATEGORIES.filter(c => c !== 'Tümü').forEach(c => {
      const clean = c.replace(/[\s&]+/g, '');
      const key = clean.toLocaleLowerCase('tr-TR');
      const catCount = threads.filter(t => t.category === c).length;
      if (!tagCounts[key]) {
        tagCounts[key] = { tag: clean, count: catCount || 1 };
      } else {
        tagCounts[key].count += catCount;
      }
    });

    return Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();

  const isPsychologistUser = Boolean(
    (userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
    (userProfile?.isPsychologist && !userProfile?.psychologistStatus) ||
    userProfile?.role === 'psychologist'
  );
  const isAdminUser = ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '');
  const isEffectiveEmailVerified = emailVerified || isAdminUser;
  const photoLimitReached = !isPsychologistUser && !isAdminUser && (userProfile?.photoUploadsUsed || 0) >= 1;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoLimitReached) {
      toast.error('Fotoğraf yükleme hakkınızı kullandınız. Rozetli (psikolog) kullanıcılar hariç her üye yalnızca 1 fotoğraf yükleyebilir.');
      if (e.target) e.target.value = '';
      return;
    }
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
    if (userProfile?.isBanned) return toast.error('Hesabınız askıya alınmıştır (banlandı). Paylaşım yapamazsınız.');
    if (!isEffectiveEmailVerified) return toast.error('Paylaşım yapabilmek için e-posta adresinizi doğrulamanız gerekiyor.');
    if (form.body.length > POST_CHAR_LIMIT) return toast.error(`Gönderi en fazla ${POST_CHAR_LIMIT} karakter olabilir.`);
    setPosting(true);
    const isPsychologist = isPsychologistUser;
    const usesNewPhoto = Boolean(form.imageUrl) && !isPsychologist && !isAdminUser;
    try {
      const newPostRef = await addDoc(collection(db, 'forum'), {
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

      if (usesNewPhoto) {
        try { await updateDoc(doc(db, 'users', user.uid), { photoUploadsUsed: increment(1) }); } catch {}
      }

      // Notify mentioned users
      try {
        await notifyMentions({
          text: form.body,
          postId: newPostRef.id,
          currentUser: user,
          userProfile
        });
      } catch {}

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
    if (userProfile?.isBanned) return toast.error('Hesabınız askıya alınmıştır.');
    if (!isEffectiveEmailVerified) return toast.error('Bu işlem için e-posta adresinizi doğrulamanız gerekiyor.');
    const postRef = doc(db, 'forum', thread.id);
    const userReaction = thread.reactionsData?.[user.uid];
    if (userReaction === 'like' || userReaction === 'heart') {
      await updateDoc(postRef, { [`reactionsData.${user.uid}`]: deleteField() });
    } else {
      await updateDoc(postRef, { [`reactionsData.${user.uid}`]: 'like' });
      if (thread.uid && thread.uid !== user.uid) {
        try {
          await addDoc(collection(db, 'notifications'), {
            toUid: thread.uid,
            fromUid: user.uid,
            fromUser: userProfile?.displayName || user.displayName || 'Kullanıcı',
            fromUsername: userProfile?.username || (user.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
            fromPhotoURL: userProfile?.photoURL || user.photoURL || '',
            type: 'reaction',
            message: 'gönderini beğendi.',
            postId: thread.originalPostId || thread.id,
            postTitle: thread.body?.slice(0, 50) || '',
            read: false,
            createdAt: serverTimestamp()
          });
        } catch {}
      }
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

      if (thread.uid && thread.uid !== user.uid) {
        try {
          await addDoc(collection(db, 'notifications'), {
            toUid: thread.uid,
            fromUid: user.uid,
            fromUser: userProfile?.displayName || user.displayName || 'Kullanıcı',
            fromUsername: userProfile?.username || (user.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
            fromPhotoURL: userProfile?.photoURL || user.photoURL || '',
            type: 'repost',
            message: 'gönderini yeniden paylaştı.',
            postId: targetPostId,
            postTitle: thread.body?.slice(0, 50) || '',
            read: false,
            createdAt: serverTimestamp()
          });
        } catch {}
      }

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
      const target = found.originalPostId ? (threads.find(x => x.id === found.originalPostId) || found) : found;
      setActiveThread(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Direct fetch fallback for direct links or shared post URLs
    getDoc(doc(db, 'forum', threadId)).then(async snap => {
      if (snap.exists()) {
        const data = snap.data();
        let postData: Post = {
          id: snap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        } as Post;
        if (postData.originalPostId) {
          try {
            const origSnap = await getDoc(doc(db, 'forum', postData.originalPostId));
            if (origSnap.exists()) {
              postData = {
                id: origSnap.id,
                ...origSnap.data(),
                createdAt: origSnap.data().createdAt?.toDate ? origSnap.data().createdAt.toDate() : new Date()
              } as Post;
            }
          } catch (e) {}
        }
        setActiveThread(postData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (activeThread.uid && activeThread.uid !== user.uid) {
      try {
        await addDoc(collection(db, 'notifications'), {
          toUid: activeThread.uid,
          fromUid: user.uid,
          fromUser: userProfile?.displayName || user.displayName || 'Kullanıcı',
          fromUsername: userProfile?.username || (user.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
          fromPhotoURL: userProfile?.photoURL || user.photoURL || '',
          type: 'comment',
          message: 'gönderine yanıt verdi.',
          postId: activeThread.id,
          postTitle: text.slice(0, 50),
          read: false,
          createdAt: serverTimestamp()
        });
      } catch {}
    }

    // Notify mentioned users in comment
    try {
      await notifyMentions({
        text,
        postId: activeThread.id,
        currentUser: user,
        userProfile
      });
    } catch {}

    toast.success('Yorum eklendi.');
  };

  const deletePost = async (id: string) => { if (confirm('Emin misin?')) { await deleteDoc(doc(db, 'forum', id)); toast.success('Kaldırıldı.'); } };
  const deleteComment = async (id: string) => { if (!activeThread) return; if (confirm('Emin misin?')) { await deleteDoc(doc(db, 'forum', activeThread.id, 'comments', id)); await updateDoc(doc(db, 'forum', activeThread.id), { commentCount: increment(-1) }); toast.success('Kaldırıldı.'); } };

  const myUsername = userProfile?.username || (user?.displayName || '').toLowerCase().replace(/\s+/g, '') || (user?.email ? user.email.split('@')[0].toLowerCase().replace(/\s+/g, '') : '') || user?.uid || '';

  return (
    <div data-forum-page="true" data-forum-dark={isDark ? 'true' : 'false'} className={isDark ? 'forum-dark' : ''} style={{ minHeight: '100vh', background: isDark ? '#000000' : '#f8fafc', transition: 'background-color 0.2s ease' }}>

      {/* ─── ANIMATED "MANAV FORUM" SPLASH / LOADING SCREEN ─── */}
      {showSplash && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: isDark ? '#000000' : '#050810',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s ease',
            opacity: splashFading ? 0 : 1,
            transform: splashFading ? 'scale(1.05)' : 'scale(1)',
            pointerEvents: splashFading ? 'none' : 'auto',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px', textAlign: 'center', width: '100%', maxWidth: 540 }}>
            {/* Glowing outer aura */}
            <div className="manav-splash-glow" />

            {/* Official Forum Logo */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="/forum-logo.png" 
                alt="Manav Forum" 
                style={{ 
                  height: 72, 
                  width: 'auto', 
                  maxWidth: '85vw',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 32px rgba(29, 155, 240, 0.75)) brightness(1.05)' 
                }} 
              />
            </div>

            {/* Subtitle */}
            <div className="manav-splash-subtitle">
              Psikoloji &amp; Farkındalık Topluluğu
            </div>

            {/* Glowing animated dots */}
            <div style={{ display: 'flex', gap: 8, marginTop: 24, alignItems: 'center' }}>
              <span className="manav-splash-dot dot-1" />
              <span className="manav-splash-dot dot-2" />
              <span className="manav-splash-dot dot-3" />
            </div>
          </div>
        </div>
      )}

      {/* ─── THREADS-STYLE MOBILE TOP HEADER ─── */}
      <header className="forum-mobile-header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: isDark ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
      }}>
        {/* Left: Menu Drawer button (two horizontal lines like Threads) */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Menüyü Aç"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 4px',
            color: isDark ? '#e7e9ea' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 20 }}>
            <span style={{ height: 2.2, background: 'currentColor', borderRadius: 2, width: 20 }} />
            <span style={{ height: 2.2, background: 'currentColor', borderRadius: 2, width: 13 }} />
          </div>
        </button>

        {/* Center: Brand / Logo (@threads style) */}
        <div 
          onClick={() => { setFeedTab('all'); setFilter('Tümü'); setSearchQuery(''); closeThread(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          <img 
            src="/forum-logo.png" 
            alt="Manav Forum" 
            style={{ 
              height: 28, 
              width: 'auto', 
              objectFit: 'contain',
              filter: isDark ? 'drop-shadow(0 0 10px rgba(29, 155, 240, 0.45)) brightness(1.05)' : 'none'
            }} 
          />
          <span style={{ fontSize: '0.62rem', background: isDark ? '#1d9bf0' : '#0f172a', color: 'white', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>v2.0</span>
        </div>

        {/* Right: Search button */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Arama"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            color: isDark ? '#e7e9ea' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Search size={22} strokeWidth={2.2} />
        </button>
      </header>

      {/* ─── THREADS-STYLE QUICK COMPOSE ROW (MOBILE ONLY) ─── */}
      <div 
        className="forum-mobile-compose-bar"
        onClick={() => {
          if (!user?.uid) setAuthOpen(true);
          else setComposeModalOpen(true);
        }}
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`,
          background: isDark ? '#000000' : 'white',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#0f172a,#1e293b)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '0.9rem',
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (userProfile?.displayName || user?.displayName || 'U')[0].toUpperCase()
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isDark ? '#e7e9ea' : '#0f172a', marginBottom: 2 }}>
            {userProfile?.displayName || user?.displayName || 'Misafir'}
          </div>
          <div style={{ fontSize: '0.84rem', color: isDark ? '#71767b' : '#94a3b8' }}>
            Ne yenilikler var?
          </div>
        </div>
      </div>

      {/* Mobile category pills */}
      <div className="forum-mobile-cats" style={{ display: 'none', overflowX: 'auto', padding: '8px 12px', gap: 8, background: isDark ? '#000000' : 'white', borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, position: 'relative', zIndex: 10, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => { setFilter(c); setFeedTab('all'); }} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 999, border: isDark ? '1px solid #2f3336' : 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, background: filter === c ? (isDark ? '#e7e9ea' : '#0f172a') : (isDark ? '#16181c' : '#f1f5f9'), color: filter === c ? (isDark ? '#000000' : 'white') : (isDark ? '#71767b' : '#64748b'), whiteSpace: 'nowrap' }}>
            {c}
          </button>
        ))}
      </div>

      <div className="forum-grid-3col" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 0, paddingTop: 0 }}>

        {/* LEFT SIDEBAR */}
        <aside className="forum-sidebar-left" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderRight: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, background: isDark ? '#000000' : 'transparent' }}>
          <div style={{ padding: '0 8px 16px', marginBottom: 8 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }} title="Ana Sayfaya Dön">
              <img 
                src="/forum-logo.png" 
                alt="Manav Forum" 
                style={{ 
                  height: 38, 
                  width: 'auto', 
                  objectFit: 'contain',
                  filter: isDark ? 'drop-shadow(0 0 12px rgba(29, 155, 240, 0.45)) brightness(1.05)' : 'none'
                }} 
              />
              <span style={{ fontSize: '0.58rem', background: isDark ? '#1d9bf0' : '#0f172a', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>v2.0</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingLeft: 2 }}>
              <p style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#94a3b8', margin: 0 }}>Psikoloji Topluluğu</p>
              <Link href="/" style={{ fontSize: '0.74rem', color: isDark ? '#38bdf8' : '#2563eb', textDecoration: 'none', fontWeight: 700 }}>
                ← Ana Site
              </Link>
            </div>
          </div>
          {[
            { label: 'Ana Akış', action: () => { setFeedTab('all'); setFilter('Tümü'); setSearchQuery(''); closeThread(); }, active: feedTab === 'all' && !searchQuery && !activeThread, icon: <Home size={20} /> },
            { label: 'Takip Ettiklerim', action: () => !user?.uid ? setAuthOpen(true) : setFeedTab('following'), active: feedTab === 'following' && !activeThread, icon: <Users size={20} /> },
            { label: 'Yer İşaretleri', action: () => !user?.uid ? setAuthOpen(true) : router.push(myUsername ? `/forum/profil/${encodeURIComponent(myUsername)}?tab=bookmarks` : '/forum'), active: false, icon: <Bookmark size={20} /> },
            { 
              label: 'Arama', 
              action: () => {
                if (activeThread) closeThread();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => {
                  topSearchInputRef.current?.focus();
                  topSearchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 80);
              }, 
              active: isSearchFocused || Boolean(searchQuery), 
              icon: <Search size={20} /> 
            },
            { label: 'Beğenilenler', action: () => !user?.uid ? setAuthOpen(true) : router.push(myUsername ? `/forum/profil/${encodeURIComponent(myUsername)}?tab=likes` : '/forum'), active: false, icon: <Heart size={20} /> },
            { label: 'Bildirimler', action: () => !user?.uid ? setAuthOpen(true) : router.push('/bildirimler'), active: false, icon: <Bell size={20} />, badge: unreadCount },
            { 
              label: isDark ? 'Açık Mod' : 'Karanlık Mod', 
              action: toggleDarkMode, 
              active: false, 
              icon: isDark ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} /> 
            },
            { 
              label: 'Profilim', 
              action: () => !user?.uid ? setAuthOpen(true) : router.push(myUsername ? `/forum/profil/${encodeURIComponent(myUsername)}` : '/forum'), 
              active: false, 
              icon: <div style={{ width: 22, height: 22, borderRadius: '50%', background: isDark ? '#1d9bf0' : '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{(userProfile?.displayName || user?.displayName || 'U')[0]}</div> 
            },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%', background: item.active ? (isDark ? '#e7e9ea' : '#0f172a') : 'transparent', color: item.active ? (isDark ? '#000000' : 'white') : (isDark ? '#e7e9ea' : '#475569'), fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {item.icon} <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span style={{ background: '#ef4444', color: 'white', fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{item.badge}</span>
              ) : null}
            </button>
          ))}
          <div style={{ margin: '16px 0 8px', padding: '0 8px', fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#71767b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kategoriler</div>
          {CATEGORIES.filter(c => c !== 'Tümü').map(c => (
            <button key={c} onClick={() => { setFilter(c); setFeedTab('all'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', background: filter === c ? (isDark ? 'rgba(56, 189, 248, 0.12)' : '#eff6ff') : 'transparent', color: filter === c ? (isDark ? '#38bdf8' : '#1d4ed8') : (isDark ? '#71767b' : '#64748b'), fontWeight: filter === c ? 700 : 500, fontSize: '0.88rem', transition: 'all 0.15s' }}>
              <Hash size={15} /> {c}
            </button>
          ))}
          {user && !user.isAnonymous && (
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href={myUsername ? `/forum/profil/${encodeURIComponent(myUsername)}` : '/forum'} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, textDecoration: 'none', background: isDark ? '#16181c' : '#f8fafc', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                  {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile?.displayName || user.displayName}</div>
                  <div style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{myUsername}</div>
                </div>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout();
                    toast.success('Çıkış yapıldı');
                  } catch (e: any) {
                    toast.error('Çıkış yapılamadı: ' + e.message);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fee2e2',
                  background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                  color: isDark ? '#f87171' : '#dc2626',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={e => (e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')}
                onMouseOut={e => (e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2')}
              >
                <LogOut size={16} />
                <span>Çıkış Yap</span>
              </button>
            </div>
          )}
        </aside>

        {/* MAIN FEED / THREAD VIEW */}
        <main style={{ borderRight: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, minHeight: '100vh', background: isDark ? '#000000' : 'white', paddingBottom: 80 }}>
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
              emailVerified={isEffectiveEmailVerified}
              photoLimitReached={photoLimitReached}
              adminEmails={ADMIN_EMAILS}
              isDark={isDark}
              onBack={closeThread}
              onOpenAuth={() => setAuthOpen(true)}
              onPostDeleted={(deletedId) => {
                setThreads(prev => prev.filter(t => t.id !== deletedId));
                closeThread();
              }}
            />
          ) : (
            <>
              {/* ─── X-STYLE STICKY TOP SEARCH & THEME BAR ─── */}
              <div className="forum-top-bar" style={{
                background: isDark ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                {/* Search Pill Input (X-style) */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: isDark ? '#16181c' : '#f1f5f9',
                  borderRadius: 999,
                  padding: '8px 16px',
                  border: `1.5px solid ${isSearchFocused ? '#1d9bf0' : isDark ? '#2f3336' : '#e2e8f0'}`,
                  boxShadow: isSearchFocused ? '0 0 0 3px rgba(29, 155, 240, 0.15)' : 'none',
                  transition: 'all 0.18s ease',
                }}>
                  <Search size={18} color={isSearchFocused ? '#1d9bf0' : isDark ? '#71767b' : '#94a3b8'} />
                  <input
                    ref={topSearchInputRef}
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      if (activeThread) closeThread();
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Forumda ara (gönderi, etiket, yazar)..."
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.92rem',
                      color: isDark ? '#e7e9ea' : '#0f172a',
                      width: '100%',
                      fontWeight: 500,
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        topSearchInputRef.current?.focus();
                      }}
                      style={{
                        background: isDark ? '#2f3336' : '#cbd5e1',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isDark ? '#e7e9ea' : '#475569',
                        padding: 0,
                        flexShrink: 0,
                      }}
                      title="Temizle"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                {/* X-Style Dark Mode Toggle Button */}
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  style={{
                    background: isDark ? '#16181c' : '#f1f5f9',
                    border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
                    borderRadius: 999,
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isDark ? '#fbbf24' : '#475569',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  title={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç (X Tarzı)'}
                  aria-label="Karanlık Mod Değiştir"
                >
                  {isDark ? <Sun size={19} strokeWidth={2} /> : <Moon size={19} strokeWidth={2} />}
                </button>
              </div>

              {/* Tabs */}
              <div style={{ position: 'relative', background: isDark ? '#000000' : '#ffffff', borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, zIndex: 10 }}>
                <div style={{ display: 'flex' }}>
                  {[{ key: 'all', label: 'Ana Akış' }, { key: 'following', label: 'Takip Ettiklerim' }].map(tab => (
                    <button key={tab.key} onClick={() => tab.key === 'following' && !user?.uid ? setAuthOpen(true) : setFeedTab(tab.key as any)}
                      style={{ flex: 1, padding: '16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', background: 'transparent', color: feedTab === tab.key ? (isDark ? '#e7e9ea' : '#0f172a') : (isDark ? '#71767b' : '#94a3b8'), borderBottom: feedTab === tab.key ? `3px solid ${isDark ? '#e7e9ea' : '#0f172a'}` : '3px solid transparent', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {tab.label}
                      {tab.key === 'all' && <span style={{ fontSize: '0.55rem', background: isDark ? '#16181c' : '#f1f5f9', color: isDark ? '#71767b' : '#64748b', padding: '1px 5px', borderRadius: 4, fontWeight: 800, border: isDark ? '1px solid #2f3336' : 'none' }}>v2.0</span>}
                    </button>
                  ))}
                </div>
                {filter !== 'Tümü' && (
                  <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, background: isDark ? '#16181c' : '#eff6ff', borderTop: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
                    <span style={{ background: isDark ? 'rgba(56,189,248,0.15)' : '#eff6ff', color: isDark ? '#38bdf8' : '#1d4ed8', fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: 999, border: isDark ? '1px solid rgba(56,189,248,0.3)' : 'none' }}>#{filter}</span>
                    <button onClick={() => setFilter('Tümü')} style={{ background: 'none', border: 'none', color: isDark ? '#71767b' : '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
                  </div>
                )}
                {searchQuery && (
                  <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? '#16181c' : (searchQuery.startsWith('#') ? '#f0f9ff' : '#f8fafc'), borderTop: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#64748b', fontWeight: 600 }}>{searchQuery.startsWith('#') ? 'Etiket:' : 'Arama:'}</span>
                      <span style={{ background: isDark ? '#1d9bf0' : (searchQuery.startsWith('#') ? '#0284c7' : '#0f172a'), color: 'white', fontSize: '0.82rem', fontWeight: 700, padding: '3px 12px', borderRadius: 999 }}>
                        {searchQuery}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#94a3b8' }}>
                        ({filtered.length} gönderi{matchedUsers.length > 0 ? `, ${matchedUsers.length} kullanıcı` : ''})
                      </span>
                    </div>
                    <button 
                      onClick={() => { 
                        setSearchQuery(''); 
                        router.replace('/forum', { scroll: false }); 
                      }} 
                      style={{ background: 'none', border: 'none', color: isDark ? '#71767b' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      <X size={14} /> Temizle
                    </button>
                  </div>
                )}

                {/* Matched Users Section when searching */}
                {searchQuery.trim() && matchedUsers.length > 0 && (
                  <div style={{ padding: '14px 20px', borderTop: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, background: isDark ? '#0b0e14' : '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Users size={16} color={isDark ? '#38bdf8' : '#0284c7'} />
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', letterSpacing: '-0.01em' }}>
                        Eşleşen Kullanıcılar ({matchedUsers.length})
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {matchedUsers.map((u: any) => {
                        const isFollowingThisUser = followingUids.includes(u.uid);
                        const isMe = user?.uid === u.uid;
                        return (
                          <div
                            key={u.uid}
                            onClick={() => router.push(`/forum/profil/${encodeURIComponent(u.username || u.uid)}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: 12,
                              background: isDark ? '#16181c' : '#ffffff',
                              border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1d9bf0, #0284c7)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}>
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  (u.displayName || u.username || 'U')[0].toUpperCase()
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isDark ? '#e7e9ea' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {u.displayName || u.username}
                                  </span>
                                  {Boolean((u.isPsychologist && u.psychologistStatus === 'approved') || (u.isPsychologist && !u.psychologistStatus)) && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(201,169,110,0.18)', color: '#d4aa70', border: '1px solid rgba(201,169,110,0.4)', borderRadius: 999, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 800 }}>
                                      <Award size={10} />
                                      Psikolog
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#1d9bf0', fontWeight: 600 }}>
                                  @{u.username || 'kullanici'}
                                </div>
                                {u.bio && (
                                  <div style={{ fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1, maxWidth: 360 }}>
                                    {u.bio}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              {!isMe && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFollowUser(u.uid);
                                  }}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 999,
                                    border: isFollowingThisUser ? `1px solid ${isDark ? '#2f3336' : '#cbd5e1'}` : 'none',
                                    background: isFollowingThisUser ? (isDark ? '#16181c' : '#ffffff') : (isDark ? '#ffffff' : '#0f172a'),
                                    color: isFollowingThisUser ? (isDark ? '#e7e9ea' : '#0f172a') : (isDark ? '#000000' : '#ffffff'),
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {isFollowingThisUser ? 'Takip Ediliyor' : 'Takip Et'}
                                </button>
                              )}
                              <div style={{ color: isDark ? '#71767b' : '#94a3b8' }}>
                                <ArrowRight size={15} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Compose */}
              {userProfile?.isBanned && (
                <div style={{
                  padding: '16px 20px',
                  background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                  borderBottom: '1px solid #ef4444',
                  color: isDark ? '#fca5a5' : '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontWeight: 700,
                  fontSize: '0.92rem'
                }}>
                  <div style={{ flex: 1 }}>
                    Hesabınız yönetici tarafından askıya alınmıştır (banlandı). Forumda gönderi paylaşamaz, yorum yapamaz veya etkileşimde bulunamazsınız.
                  </div>
                </div>
              )}

              {user && !user.isAnonymous && !userProfile?.isBanned && !isEffectiveEmailVerified && (
                <div style={{
                  padding: '16px 20px',
                  background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                  borderBottom: '1px solid #f59e0b',
                  color: isDark ? '#fcd34d' : '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  fontWeight: 700,
                  fontSize: '0.92rem'
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    Forumda paylaşım yapabilmek için e-posta adresinizi doğrulamanız gerekiyor. Gelen kutunuzu (ve spam klasörünü) kontrol edin.
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try { await resendVerificationEmail(); toast.success('Doğrulama e-postası tekrar gönderildi.'); }
                      catch (err: any) { toast.error(err.message || 'Gönderilemedi.'); }
                    }}
                    style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem', whiteSpace: 'nowrap' }}
                  >
                    Tekrar Gönder
                  </button>
                </div>
              )}

              {user && !user.isAnonymous && !userProfile?.isBanned && isEffectiveEmailVerified && (
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, display: 'flex', gap: 14, background: isDark ? '#000000' : 'white' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, overflow: 'hidden' }}>
                    {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <textarea placeholder="Ne düşünüyorsunuz? Psikoloji topluluğuyla paylaşın..." value={form.body} maxLength={POST_CHAR_LIMIT} onChange={e => setForm({ ...form, body: e.target.value.slice(0, POST_CHAR_LIMIT) })} style={{ width: '100%', border: 'none', fontSize: '1.05rem', color: isDark ? '#e7e9ea' : '#0f172a', minHeight: 72, resize: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', lineHeight: 1.5 }} />
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: form.body.length >= POST_CHAR_LIMIT ? '#ef4444' : (isDark ? '#71767b' : '#94a3b8') }}>
                      {form.body.length}/{POST_CHAR_LIMIT}
                    </div>

                    {form.imageUrl && (
                      <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, marginBottom: 12 }}>
                        <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => setForm({ ...form, imageUrl: '' })} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ border: isDark ? '1px solid #2f3336' : 'none', background: isDark ? '#16181c' : '#f1f5f9', padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', color: isDark ? '#e7e9ea' : '#475569', cursor: 'pointer', outline: 'none', fontWeight: 600 }}>
                          {CATEGORIES.filter(c => c !== 'Tümü').map(c => <option key={c} value={c} style={{ background: isDark ? '#16181c' : '#ffffff', color: isDark ? '#e7e9ea' : '#0f172a' }}>{c}</option>)}
                        </select>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDark ? '#16181c' : '#f1f5f9', border: isDark ? '1px solid #2f3336' : 'none', padding: '6px 12px', borderRadius: 999, fontSize: '0.85rem', color: photoLimitReached ? (isDark ? '#4b5563' : '#cbd5e1') : (isDark ? '#e7e9ea' : '#475569'), cursor: photoLimitReached ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: photoLimitReached ? 0.6 : 1 }} title={photoLimitReached ? 'Fotoğraf yükleme hakkınızı kullandınız' : 'Görsel ekle'}>
                          {uploadingImage ? (
                            <>
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Yükleniyor…</span>
                            </>
                          ) : (
                            <>
                              <Camera size={14} />
                              <span>{photoLimitReached ? 'Hak Kullanıldı' : 'Görsel Ekle'}</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage || photoLimitReached} />
                        </label>
                      </div>

                      <button onClick={handlePost} disabled={posting || (!form.body.trim() && !form.imageUrl)} style={{ background: (form.body.trim() || form.imageUrl) ? (isDark ? '#e7e9ea' : '#0f172a') : (isDark ? '#262a30' : '#e2e8f0'), color: (form.body.trim() || form.imageUrl) ? (isDark ? '#000000' : 'white') : (isDark ? '#71767b' : '#94a3b8'), border: 'none', padding: '10px 22px', borderRadius: 999, fontWeight: 700, cursor: (form.body.trim() || form.imageUrl) ? 'pointer' : 'default', fontSize: '0.9rem', transition: 'all 0.2s' }}>Paylaş</button>
                    </div>
                  </div>
                </div>
              )}

              {!user && (
                <div style={{ padding: '32px 24px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, textAlign: 'center', background: isDark ? '#16181c' : 'linear-gradient(135deg,#f8fafc,#eff6ff)' }}>
                  <Users size={32} color={isDark ? '#e7e9ea' : '#0f172a'} style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', marginBottom: 8 }}>Psikoloji topluluğuna katılın</h3>
                  <p style={{ color: isDark ? '#71767b' : '#64748b', marginBottom: 20, fontSize: '0.95rem' }}>Düşüncelerinizi paylaşın, tartışmalara katılın.</p>
                  <button onClick={() => setAuthOpen(true)} style={{ background: isDark ? '#e7e9ea' : '#0f172a', color: isDark ? '#000000' : 'white', border: 'none', padding: '12px 28px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>Katıl</button>
                </div>
              )}

              {/* Posts or Empty State */}
              {filtered.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: isDark ? '#16181c' : '#f1f5f9',
                    border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: isDark ? '#71767b' : '#94a3b8',
                  }}>
                    {searchQuery.trim() ? <Search size={28} /> : <MessageSquare size={28} />}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', marginBottom: 8 }}>
                    {searchQuery.trim() ? 'Sonuç bulunamadı' : (feedTab === 'following' ? 'Henüz paylaşım yok' : 'Gönderi bulunamadı')}
                  </h3>
                  <p style={{ color: isDark ? '#71767b' : '#64748b', fontSize: '0.9rem', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.5 }}>
                    {searchQuery.trim() 
                      ? `"${searchQuery}" terimi ile eşleşen bir forum gönderisi bulunamadı. Farklı kelimeler veya etiketler deneyebilirsiniz.` 
                      : (feedTab === 'following' ? 'Takip ettiğiniz kişiler henüz bir şey paylaşmamış.' : 'Bu kategoride henüz gönderi yok.')}
                  </p>
                  {searchQuery.trim() && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        router.replace('/forum', { scroll: false });
                      }}
                      style={{
                        background: isDark ? '#e7e9ea' : '#0f172a',
                        color: isDark ? '#000000' : '#ffffff',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                      }}
                    >
                      Aramayı Temizle
                    </button>
                  )}
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
                        authorPhotoURL: usersMap[t.uid]?.photoURL || t.authorPhotoURL || (user?.uid === t.uid ? (userProfile?.photoURL || user?.photoURL) : undefined),
                        authorIsPsychologist: isAuthorPsych
                      }}
                      currentUserUid={user?.uid}
                      currentUserEmail={user?.email || ''}
                      adminEmails={ADMIN_EMAILS}
                      isDark={isDark}
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
              {filtered.length > 0 && (
                <div style={{ padding: '36px 16px 48px', textAlign: 'center', color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.84rem' }}>
                  ✓ Akışın sonundasınız
                </div>
              )}
            </>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="forum-sidebar-right" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, background: isDark ? '#000000' : 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: isDark ? '#16181c' : '#f1f5f9', borderRadius: 999, padding: '11px 16px', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
            <Search size={17} color={isDark ? '#71767b' : '#94a3b8'} />
            <input 
              ref={searchInputRef}
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Forumda ara..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: isDark ? '#e7e9ea' : '#0f172a', width: '100%' }} 
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  router.replace('/forum', { scroll: false });
                }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#71767b' : '#94a3b8', display: 'flex', padding: 2 }}
                title="Aramayı temizle"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {user && !user.isAnonymous && (
            <Link href="/bildirimler" style={{ textDecoration: 'none' }}>
              <div style={{ background: unreadCount > 0 ? (isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff') : (isDark ? '#16181c' : '#f8fafc'), border: `1px solid ${unreadCount > 0 ? (isDark ? '#1d4ed8' : '#bfdbfe') : (isDark ? '#2f3336' : '#e2e8f0')}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ position: 'relative' }}>
                  <Bell size={22} color={unreadCount > 0 ? '#38bdf8' : (isDark ? '#71767b' : '#94a3b8')} />
                  {unreadCount > 0 && <div style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</div>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.9rem' }}>Bildirimler</div>
                  <div style={{ color: isDark ? '#71767b' : '#64748b', fontSize: '0.8rem' }}>{unreadCount > 0 ? `${unreadCount} okunmamış` : 'Hepsi okundu'}</div>
                </div>
              </div>
            </Link>
          )}
          <div style={{ background: isDark ? '#16181c' : '#f8fafc', borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
              <TrendingUp size={18} color={isDark ? '#71767b' : '#64748b'} />
              <h3 style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '1rem', margin: 0 }}>Gündemdekiler</h3>
            </div>
            {trends.map(({ tag, count }) => (
              <button 
                key={tag} 
                type="button"
                onClick={() => { 
                  setSearchQuery(`#${tag}`); 
                  setFilter('Tümü'); 
                  setFeedTab('all'); 
                  if (activeThread) closeThread();
                  router.replace(`/forum?tag=${encodeURIComponent(tag)}`, { scroll: false });
                }} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '13px 18px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, textAlign: 'left' }} 
                onMouseOver={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9')} 
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: isDark ? '#71767b' : '#94a3b8', marginBottom: 2 }}>Gündemdekiler · Türkiye</div>
                  <div style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.92rem' }}>#{tag}</div>
                  <div style={{ fontSize: '0.74rem', color: isDark ? '#71767b' : '#64748b', marginTop: 2 }}>{count} gönderi</div>
                </div>
                <span style={{ background: isDark ? 'rgba(56,189,248,0.15)' : '#eff6ff', color: isDark ? '#38bdf8' : '#1d4ed8', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: isDark ? '1px solid rgba(56,189,248,0.3)' : 'none' }}>#{tag}</span>
              </button>
            ))}
          </div>
          {!user && (
            <div style={{ background: isDark ? '#16181c' : 'linear-gradient(135deg,#0f172a,#1e293b)', border: isDark ? '1px solid #2f3336' : 'none', borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
              <Sparkles size={28} color="#d97706" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontWeight: 800, color: 'white', fontSize: '1rem', marginBottom: 8 }}>Topluluğa Katılın</h3>
              <p style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.82rem', marginBottom: 16, lineHeight: 1.5 }}>Paylaşın, tartışın, büyüyün.</p>
              <button onClick={() => setAuthOpen(true)} style={{ background: 'white', color: '#0f172a', border: 'none', padding: '10px 22px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', width: '100%' }}>Katıl</button>
            </div>
          )}
        </aside>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} isDark={isDark} />

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', padding: '20px 16px' }} onClick={() => setMobileSearchOpen(false)}>
          <div style={{ background: isDark ? '#16181c' : 'white', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: isDark ? '1px solid #2f3336' : 'none' }} onClick={e => e.stopPropagation()}>
            <Search size={18} color={isDark ? '#71767b' : '#94a3b8'} />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Forumda ara..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', color: isDark ? '#e7e9ea' : '#0f172a', background: 'transparent' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#71767b' : '#94a3b8', display: 'flex' }}>
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div style={{ marginTop: 12, background: isDark ? '#16181c' : 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: isDark ? '1px solid #2f3336' : 'none', maxHeight: '75vh', overflowY: 'auto' }}>
              {matchedUsers.length > 0 && (
                <div style={{ padding: '10px 14px', background: isDark ? '#0b0e14' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Kullanıcılar
                  </div>
                  {matchedUsers.slice(0, 4).map((u: any) => (
                    <div
                      key={u.uid}
                      onClick={() => {
                        setMobileSearchOpen(false);
                        setSearchQuery('');
                        router.push(`/forum/profil/${encodeURIComponent(u.username || u.uid)}`);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, cursor: 'pointer' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1d9bf0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                        {u.photoURL ? <img src={u.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (u.displayName || u.username || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: isDark ? '#e7e9ea' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.displayName || u.username}</div>
                        <div style={{ fontSize: '0.76rem', color: '#1d9bf0' }}>@{u.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {threads.filter(t => (t.body || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.authorName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(t => (
                <div key={t.id} onClick={() => { openThread(t); setMobileSearchOpen(false); setSearchQuery(''); }} style={{ padding: '14px 16px', borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#e7e9ea' : '#0f172a', marginBottom: 2 }}>{t.authorName}</div>
                  <div style={{ fontSize: '0.85rem', color: isDark ? '#71767b' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── THREADS-STYLE FLOATING BOTTOM DOCK (MOBILE ONLY) ─── */}
      <nav className="forum-floating-dock" aria-label="Mobil Forum Navigasyonu">
        {/* 1. Home button */}
        <button
          type="button"
          onClick={() => {
            if (activeThread) closeThread();
            setFeedTab('all');
            setFilter('Tümü');
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`dock-btn ${feedTab === 'all' && !searchQuery && !activeThread ? 'active' : ''}`}
          aria-label="Ana Akış"
        >
          <Home size={24} strokeWidth={feedTab === 'all' && !searchQuery && !activeThread ? 2.5 : 1.9} />
        </button>

        {/* 2. Search button */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className={`dock-btn ${isSearchFocused || Boolean(searchQuery) || mobileSearchOpen ? 'active' : ''}`}
          aria-label="Arama"
        >
          <Search size={24} strokeWidth={isSearchFocused || Boolean(searchQuery) || mobileSearchOpen ? 2.5 : 1.9} />
        </button>

        {/* 3. Center Create (+) button (Threads style prominent pill) */}
        <button
          type="button"
          onClick={() => {
            if (!user || user.isAnonymous) setAuthOpen(true);
            else setComposeModalOpen(true);
          }}
          className="dock-create-btn"
          aria-label="Yeni Gönderi Paylaş"
        >
          <Plus size={22} strokeWidth={2.6} />
        </button>

        {/* 4. Heart / Activity button */}
        <Link
          href={user && !user.isAnonymous ? '/bildirimler' : '#'}
          onClick={!user || user.isAnonymous ? (e) => { e.preventDefault(); setAuthOpen(true); } : undefined}
          className="dock-btn"
          aria-label="Bildirimler"
          style={{ position: 'relative', textDecoration: 'none' }}
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
        </Link>

        {/* 5. User Profile button */}
        <Link
          href={user && !user.isAnonymous ? `/forum/profil/${encodeURIComponent(myUsername || user.uid)}` : '#'}
          onClick={(e) => {
            if (!user || user.isAnonymous) {
              e.preventDefault();
              setAuthOpen(true);
            }
          }}
          className="dock-btn"
          aria-label="Profilim"
          style={{ textDecoration: 'none' }}
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
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.3)'}`,
          }}>
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : user && !user.isAnonymous ? (
              (userProfile?.displayName || user.displayName || 'U')[0].toUpperCase()
            ) : (
              <User size={15} color="white" />
            )}
          </div>
        </Link>
      </nav>

      {/* ─── THREADS-STYLE QUICK COMPOSE MODAL ─── */}
      {composeModalOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 3000, 
            background: 'rgba(0,0,0,0.72)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-end',
          }} 
          onClick={() => setComposeModalOpen(false)}
        >
          <div 
            style={{ 
              background: isDark ? '#121212' : '#ffffff', 
              borderTopLeftRadius: 24, 
              borderTopRightRadius: 24, 
              padding: '20px 20px 36px', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button 
                type="button" 
                onClick={() => setComposeModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: isDark ? '#71767b' : '#64748b', fontSize: '0.95rem', cursor: 'pointer', padding: 4 }}
              >
                Vazgeç
              </button>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: isDark ? '#e7e9ea' : '#0f172a' }}>
                Yeni Gönderi
              </div>
              <button 
                type="button"
                onClick={async () => {
                  await handlePost();
                  setComposeModalOpen(false);
                }}
                disabled={posting || (!form.body.trim() && !form.imageUrl)}
                style={{
                  background: (form.body.trim() || form.imageUrl) ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#262a30' : '#e2e8f0'),
                  color: (form.body.trim() || form.imageUrl) ? (isDark ? '#000000' : '#ffffff') : (isDark ? '#71767b' : '#94a3b8'),
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: (form.body.trim() || form.imageUrl) ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                {posting ? 'Paylaşılıyor...' : 'Paylaş'}
              </button>
            </div>

            {/* Author info & Textarea */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0, overflow: 'hidden' }}>
                {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user?.displayName || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isDark ? '#e7e9ea' : '#0f172a' }}>
                  {userProfile?.displayName || user?.displayName || 'Kullanıcı'}
                </div>
                <textarea
                  autoFocus
                  placeholder="Ne yenilikler var? Düşüncelerini paylaş..."
                  value={form.body}
                  maxLength={POST_CHAR_LIMIT}
                  onChange={e => setForm({ ...form, body: e.target.value.slice(0, POST_CHAR_LIMIT) })}
                  style={{ width: '100%', border: 'none', fontSize: '1rem', color: isDark ? '#e7e9ea' : '#0f172a', minHeight: 120, resize: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', lineHeight: 1.5, marginTop: 8 }}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: form.body.length >= POST_CHAR_LIMIT ? '#ef4444' : (isDark ? '#71767b' : '#94a3b8') }}>
                  {form.body.length}/{POST_CHAR_LIMIT}
                </div>

                {form.imageUrl && (
                  <div style={{ position: 'relative', width: 140, height: 140, borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, marginBottom: 14 }}>
                    <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => setForm({ ...form, imageUrl: '' })} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`, flexWrap: 'wrap' }}>
                  <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ border: isDark ? '1px solid #2f3336' : 'none', background: isDark ? '#16181c' : '#f1f5f9', padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', color: isDark ? '#e7e9ea' : '#475569', cursor: 'pointer', outline: 'none', fontWeight: 600 }}>
                    {CATEGORIES.filter(c => c !== 'Tümü').map(c => <option key={c} value={c} style={{ background: isDark ? '#16181c' : '#ffffff', color: isDark ? '#e7e9ea' : '#0f172a' }}>{c}</option>)}
                  </select>

                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDark ? '#16181c' : '#f1f5f9', border: isDark ? '1px solid #2f3336' : 'none', padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', color: photoLimitReached ? (isDark ? '#4b5563' : '#cbd5e1') : (isDark ? '#e7e9ea' : '#475569'), cursor: photoLimitReached ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: photoLimitReached ? 0.6 : 1 }} title={photoLimitReached ? 'Fotoğraf yükleme hakkınızı kullandınız' : 'Görsel ekle'}>
                    {uploadingImage ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Yükleniyor…</span>
                      </>
                    ) : (
                      <>
                        <Camera size={14} />
                        <span>{photoLimitReached ? 'Hak Kullanıldı' : 'Görsel Ekle'}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage || photoLimitReached} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── THREADS-STYLE MOBILE DRAWER MENU ─── */}
      {mobileDrawerOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 3001, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, 
              bottom: 0, 
              left: 0, 
              width: '82%', 
              maxWidth: 320, 
              background: isDark ? '#0f1012' : '#ffffff', 
              borderRight: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
              display: 'flex', 
              flexDirection: 'column', 
              padding: '24px 20px', 
              boxShadow: '10px 0 40px rgba(0,0,0,0.4)',
              overflowY: 'auto'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer top */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: isDark ? '#1d9bf0' : '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', overflow: 'hidden' }}>
                  {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || user?.displayName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isDark ? '#e7e9ea' : '#0f172a' }}>
                    {userProfile?.displayName || user?.displayName || 'Misafir'}
                  </div>
                  {user && (
                    <div style={{ fontSize: '0.78rem', color: isDark ? '#71767b' : '#94a3b8' }}>
                      @{myUsername}
                    </div>
                  )}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setMobileDrawerOpen(false)} 
                style={{ background: 'none', border: 'none', color: isDark ? '#71767b' : '#64748b', cursor: 'pointer', padding: 6 }}
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick theme switch */}
            <div style={{ marginBottom: 20 }}>
              <button 
                type="button" 
                onClick={toggleDarkMode}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: isDark ? '#16181c' : '#f8fafc',
                  border: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`,
                  color: isDark ? '#e7e9ea' : '#0f172a',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isDark ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#64748b" />}
                  <span>{isDark ? 'Açık Mod' : 'Karanlık Mod'}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: isDark ? '#71767b' : '#94a3b8' }}>Değiştir</span>
              </button>
            </div>

            {/* Navigation List matching user screenshot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
              {[
                { 
                  label: 'Ana Akış', 
                  icon: <Home size={22} strokeWidth={2.2} />, 
                  action: () => { 
                    setFeedTab('all'); 
                    setFilter('Tümü'); 
                    setSearchQuery(''); 
                    if (activeThread) closeThread(); 
                    setMobileDrawerOpen(false); 
                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                  },
                  active: feedTab === 'all' && !searchQuery && !activeThread
                },
                { 
                  label: 'Takip Ettiklerim', 
                  icon: <Users size={22} strokeWidth={2.2} />, 
                  action: () => { 
                    setMobileDrawerOpen(false);
                    if (!user?.uid) setAuthOpen(true); 
                    else {
                      setFeedTab('following'); 
                      if (activeThread) closeThread(); 
                    }
                  },
                  active: feedTab === 'following' && !activeThread
                },
                { 
                  label: 'Yer İşaretleri', 
                  icon: <Bookmark size={22} strokeWidth={2.2} />, 
                  action: () => { 
                    setMobileDrawerOpen(false);
                    if (!user?.uid) setAuthOpen(true); 
                    else router.push(myUsername ? `/forum/profil/${encodeURIComponent(myUsername)}?tab=bookmarks` : '/forum'); 
                  },
                  active: false
                },
                { 
                  label: 'Arama', 
                  icon: <Search size={22} strokeWidth={2.2} />, 
                  action: () => { 
                    setMobileDrawerOpen(false);
                    setMobileSearchOpen(true);
                  },
                  active: Boolean(searchQuery)
                },
                { 
                  label: 'Beğenilenler', 
                  icon: <Heart size={22} strokeWidth={2.2} />, 
                  action: () => { 
                    setMobileDrawerOpen(false);
                    if (!user?.uid) setAuthOpen(true); 
                    else router.push(myUsername ? `/forum/profil/${encodeURIComponent(myUsername)}?tab=likes` : '/forum'); 
                  },
                  active: false
                },
                { 
                  label: 'Bildirimler', 
                  icon: <Bell size={22} strokeWidth={2.2} />, 
                  badge: unreadCount,
                  action: () => { 
                    setMobileDrawerOpen(false);
                    if (!user?.uid) setAuthOpen(true); 
                    else router.push('/bildirimler'); 
                  },
                  active: false
                },
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 14px',
                    borderRadius: 12,
                    background: item.active 
                      ? (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)') 
                      : 'transparent',
                    border: 'none',
                    color: item.active 
                      ? (isDark ? '#e7e9ea' : '#0f172a') 
                      : (isDark ? '#8e9aa8' : '#64748b'),
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = isDark ? '#ffffff' : '#0f172a';
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = item.active ? (isDark ? '#e7e9ea' : '#0f172a') : (isDark ? '#8e9aa8' : '#64748b');
                    e.currentTarget.style.background = item.active ? (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)') : 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}

              {/* 7. Profilim (Stylized dark rounded pill matching user screenshot) */}
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  if (!user?.uid) setAuthOpen(true);
                  else router.push(myUsername ? `/forum/profil/${encodeURIComponent(myUsername)}` : '/forum');
                }}
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 18px',
                  borderRadius: 16,
                  background: isDark ? '#111c2e' : '#0f172a',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #1e293b',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={e => (e.currentTarget.style.background = isDark ? '#17253d' : '#1e293b')}
                onMouseOut={e => (e.currentTarget.style.background = isDark ? '#111c2e' : '#0f172a')}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: isDark ? '#27384e' : '#334155',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (userProfile?.displayName || user?.displayName || 'f')[0].toLowerCase()
                  )}
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  Profilim
                </span>
              </button>
            </div>

            {/* Link to main website */}
            <div style={{ padding: '14px 6px', borderTop: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}`, marginBottom: 16 }}>
              <Link
                href="/"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.86rem',
                  color: isDark ? '#71767b' : '#64748b',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <ArrowRight size={15} color="var(--gold)" />
                <span>Web Sitesine Dön</span>
              </Link>
            </div>

            {/* Auth button at bottom */}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${isDark ? '#2f3336' : '#e2e8f0'}` }}>
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 12,
                    background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#ef4444',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={16} />
                  <span>Çıkış Yap</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setAuthOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 999,
                    background: isDark ? '#ffffff' : '#0f172a',
                    color: isDark ? '#000000' : '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                  }}
                >
                  Giriş Yap / Kayıt Ol
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
