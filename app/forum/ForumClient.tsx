'use client';
import React, { useState, useEffect, useRef } from 'react';
import { addDoc, collection, serverTimestamp, orderBy, query, updateDoc, doc, increment, onSnapshot, deleteDoc, deleteField, where, getDocs, getDoc, limit, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import ForumPost from '@/components/forum/ForumPost';
import ThreadView from '@/components/forum/ThreadView';
import { Search, Bell, Users, Home, X, Loader2, User, Bookmark, Heart, Sun, Moon, Menu, LogOut, Settings, Feather, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Avatar, CharRing, LogosMark, useForumTheme } from '@/components/forum/ui';
import ForumShell from '@/components/forum/ForumShell';
import PersonRow from '@/components/forum/PersonRow';
import { WhoToFollowStrip } from '@/components/forum/WhoToFollow';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { notifyMentions } from '@/lib/mentionUtils';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

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
  authorHideBadge?: boolean;
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
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  // Logos açılış ekranı / Loading screen state (skipped on back navigation)
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

  const [isDark, toggleDarkMode] = useForumTheme();

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
        if (window.innerWidth < 700) setMobileSearchOpen(true);
        else setTimeout(() => (searchInputRef.current?.offsetParent ? searchInputRef.current : topSearchInputRef.current)?.focus(), 250);
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
        if (catCount > 0) tagCounts[key] = { tag: clean, count: catCount };
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
  const isEffectiveEmailVerified = Boolean(emailVerified);
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
    const isPsychologist = Boolean(isPsychologistUser && !userProfile?.hideBadge);
    const usesNewPhoto = Boolean(form.imageUrl) && !isPsychologist && !isAdminUser;
    try {
      const newPostRef = await addDoc(collection(db, 'forum'), {
        body: form.body,
        category: form.cat,
        imageUrl: form.imageUrl || '',
        authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || (user.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
        authorIsPsychologist: isPsychologist,
        authorHideBadge: Boolean(userProfile?.hideBadge),
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
    if (!isEffectiveEmailVerified) return toast.error('Bu işlem için e-posta adresinizi doğrulamanız gerekiyor.');
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
    if (!isEffectiveEmailVerified) return toast.error('Yeniden paylaşım yapabilmek için e-posta adresinizi doğrulamanız gerekiyor.');
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
        ((userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
        (userProfile?.isPsychologist && !userProfile?.psychologistStatus) ||
        userProfile?.role === 'psychologist') && !userProfile?.hideBadge
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
        authorHideBadge: Boolean(userProfile?.hideBadge),
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
    if (!isEffectiveEmailVerified) return toast.error('Yer işareti ekleyebilmek için e-posta adresinizi doğrulamanız gerekiyor.');
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
    if (!isEffectiveEmailVerified) return toast.error('Yorum yapabilmek için e-posta adresinizi doğrulamanız gerekiyor.');
    const isPsychologist = Boolean(
      ((userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
      (userProfile?.isPsychologist && !userProfile?.psychologistStatus)) &&
      !userProfile?.hideBadge
    );
    await addDoc(collection(db, 'forum', activeThread.id, 'comments'), {
      authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
      authorUsername: userProfile?.username || '',
      authorIsPsychologist: isPsychologist,
      authorHideBadge: Boolean(userProfile?.hideBadge),
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


  const isMember = Boolean(user && !user.isAnonymous);
  const myName = userProfile?.displayName || user?.displayName || '';
  const myPhoto = userProfile?.photoURL || user?.photoURL || '';
  const isHome = feedTab === 'all' && !searchQuery && !activeThread;
  const canPost = Boolean(form.body.trim() || form.imageUrl) && !posting;

  const goHome = () => {
    setFeedTab('all');
    setFilter('Tümü');
    setSearchQuery('');
    if (activeThread) closeThread();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchQuery('');
    router.replace('/forum', { scroll: false });
  };

  const openTag = (tag: string) => {
    setSearchQuery(`#${tag}`);
    setFilter('Tümü');
    setFeedTab('all');
    if (activeThread) closeThread();
    router.replace(`/forum?tag=${encodeURIComponent(tag)}`, { scroll: false });
    window.scrollTo({ top: 0 });
  };

  const openTopic = (c: string) => {
    setFilter(c);
    setFeedTab('all');
    if (activeThread) closeThread();
    window.scrollTo({ top: 0 });
  };

  const openCompose = () => { if (!isMember) setAuthOpen(true); else setComposeModalOpen(true); };

  const renderComposer = (opts: { autoFocus?: boolean; onPosted?: () => void } = {}) => (
    <div className="fx-compose">
      <Avatar src={myPhoto} name={myName} size={40} />
      <div className="fx-compose-body">
        <textarea
          autoFocus={opts.autoFocus}
          placeholder="Aklından ne geçiyor?"
          value={form.body}
          maxLength={POST_CHAR_LIMIT}
          rows={opts.autoFocus ? 5 : 2}
          onChange={e => setForm({ ...form, body: e.target.value.slice(0, POST_CHAR_LIMIT) })}
          aria-label="Gönderi metni"
        />

        {form.imageUrl && (
          <div className="fx-compose-preview">
            <img src={form.imageUrl} alt="Eklenen görsel" />
            <button type="button" onClick={() => setForm({ ...form, imageUrl: '' })} aria-label="Görseli kaldır"><X size={16} /></button>
          </div>
        )}

        <div className="fx-compose-bar">
          <div className="fx-compose-tools">
            <label
              className="fx-tool"
              aria-disabled={photoLimitReached || uploadingImage}
              title={photoLimitReached ? 'Görsel ekleme hakkını kullandın' : 'Görsel ekle'}
            >
              {uploadingImage ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={19} />}
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploadingImage || photoLimitReached} />
            </label>
            <select className="fx-select" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} aria-label="Konu">
              {CATEGORIES.filter(c => c !== 'Tümü').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="fx-compose-send">
            <CharRing length={form.body.length} limit={POST_CHAR_LIMIT} />
            <button
              type="button"
              className="fx-btn fx-btn-primary"
              disabled={!canPost}
              onClick={async () => { await handlePost(); opts.onPosted?.(); }}
            >
              {posting ? 'Paylaşılıyor…' : 'Paylaş'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const searchField = (ref?: React.RefObject<HTMLInputElement | null>, autoFocus?: boolean) => (
    <label className="fx-search">
      <Search size={18} />
      <input
        ref={ref}
        autoFocus={autoFocus}
        value={searchQuery}
        onChange={e => { setSearchQuery(e.target.value); if (activeThread) closeThread(); }}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        placeholder="Forumda ara"
        aria-label="Forumda ara"
      />
      {searchQuery && (
        <button type="button" className="fx-search-clear" onMouseDown={e => e.preventDefault()} onClick={clearSearch} aria-label="Aramayı temizle">
          <X size={13} strokeWidth={3} />
        </button>
      )}
    </label>
  );

  const openExplore = () => {
    if (activeThread) closeThread();
    if (typeof window !== 'undefined' && window.innerWidth < 700) { setMobileSearchOpen(true); return; }
    window.scrollTo({ top: 0 });
    setTimeout(() => (searchInputRef.current?.offsetParent ? searchInputRef.current : topSearchInputRef.current)?.focus(), 60);
  };

  const shellActive = activeThread ? null : searchQuery ? 'explore' : feedTab === 'following' ? 'following' : 'home';

  const feedPosts = filtered.map(t => {
    const isAuthorPsych = Boolean(
      !t.authorHideBadge && !usersMap[t.uid]?.hideBadge && (
        t.authorIsPsychologist ||
        (usersMap[t.uid]?.isPsychologist && usersMap[t.uid]?.psychologistStatus === 'approved') ||
        (usersMap[t.uid]?.isPsychologist && !usersMap[t.uid]?.psychologistStatus)
      )
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
        onTopic={openTopic}
      />
    );
  });
  // "Kimi takip etmeli" şeridi: sağ sütun görünmediğinde akışın içinde gösterilir
  if (!searchQuery && feedTab === 'all' && feedPosts.length) {
    feedPosts.splice(Math.min(3, feedPosts.length), 0, (
      <div key="__wtf" className="fx-strip-slot"><WhoToFollowStrip onNeedAuth={() => setAuthOpen(true)} /></div>
    ));
  }

  return (
    <>
      {showSplash && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: '#08111f',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.4s ease',
            opacity: splashFading ? 0 : 1,
            pointerEvents: splashFading ? 'none' : 'auto',
          }}
        >
          <LogosMark theme="dark" height={96} />
        </div>
      )}

      <ForumShell
        active={shellActive as any}
        onCompose={openCompose}
        onNav={{
          home: goHome,
          explore: openExplore,
          following: () => { setFeedTab('following'); if (activeThread) closeThread(); window.scrollTo({ top: 0 }); },
        }}
        asideTop={
          <>
            <div className="fx-aside-search">{searchField(searchInputRef)}</div>
            {trends.length > 0 && (
              <section className="fx-panel">
                <h2 className="fx-panel-title">Gündem</h2>
                {trends.map(({ tag, count }) => (
                  <button key={tag} type="button" className="fx-panel-row" onClick={() => openTag(tag)}>
                    <span className="fx-trend-tag">#{tag}</span>
                    <small>{count} gönderi</small>
                  </button>
                ))}
              </section>
            )}
          </>
        }
      >
        {(shell) => (
          <>
            {activeThread ? (
              <ThreadView
                post={{
                  ...activeThread,
                  authorPhotoURL: usersMap[activeThread.uid]?.photoURL || activeThread.authorPhotoURL,
                  authorIsPsychologist: !activeThread.authorHideBadge && !usersMap[activeThread.uid]?.hideBadge && Boolean(
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
                <header className="fx-head">
                  <div className="fx-mhead">
                    <button type="button" className="fx-icon-btn" onClick={shell.openDrawer} aria-label="Menüyü aç">
                      {isMember ? <Avatar src={myPhoto} name={myName} size={32} /> : <Menu size={22} />}
                    </button>
                    <button type="button" className="fx-mhead-logo" onClick={goHome} aria-label="Akışın başına dön" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }}>
                      <LogosMark height={34} />
                    </button>
                    <button type="button" className="fx-icon-btn" onClick={toggleDarkMode} aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}>
                      {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                  </div>

                  <div className="fx-head-search">{searchField(topSearchInputRef)}</div>

                  <div className="fx-tabs" role="tablist">
                    {[{ key: 'all', label: 'Sana özel' }, { key: 'following', label: 'Takip ettiklerin' }].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={feedTab === tab.key}
                        className={`fx-tab ${feedTab === tab.key ? 'is-active' : ''}`}
                        onClick={() => tab.key === 'following' && !isMember ? setAuthOpen(true) : setFeedTab(tab.key as any)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </header>

                {!searchQuery && (
                  <div className="fx-topics" role="toolbar" aria-label="Konular">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" className={`fx-topic ${filter === c ? 'is-active' : ''}`} onClick={() => openTopic(c)} aria-pressed={filter === c}>
                        {c === 'Tümü' ? 'Tüm konular' : c}
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery && (
                  <div className="fx-context">
                    <span><strong>{searchQuery}</strong> için {filtered.length} gönderi{matchedUsers.length > 0 ? `, ${matchedUsers.length} kişi` : ''}</span>
                    <button type="button" className="fx-text-btn" onClick={clearSearch}>Aramayı temizle</button>
                  </div>
                )}

                {searchQuery.trim() && matchedUsers.length > 0 && (
                  <section className="fx-users" aria-label="Kişiler">
                    <div className="fx-users-title">Kişiler</div>
                    {matchedUsers.map((u: any) => (
                      <PersonRow
                        key={u.uid}
                        user={u}
                        showBio
                        isFollowing={followingUids.includes(u.uid)}
                        onNeedAuth={() => setAuthOpen(true)}
                      />
                    ))}
                  </section>
                )}

                {userProfile?.isBanned && (
                  <div className="fx-alert" role="status">
                    Hesabın yönetici tarafından askıya alındı. Gönderi paylaşamaz, yanıt yazamaz ve etkileşimde bulunamazsın.
                  </div>
                )}

                {isMember && !userProfile?.isBanned && !searchQuery && (
                  <div className="fx-compose-desktop">{renderComposer()}</div>
                )}

                {filtered.length === 0 ? (
                  <>
                    <div className="fx-empty">
                      {searchQuery.trim() ? (
                        <>
                          <h2>“{searchQuery}” için sonuç yok</h2>
                          <p>Yazımı kontrol et ya da başka bir kelime, etiket veya kullanıcı adı dene.</p>
                          <button type="button" className="fx-btn fx-btn-primary" onClick={clearSearch}>Aramayı temizle</button>
                        </>
                      ) : feedTab === 'following' ? (
                        <>
                          <h2>Takip ettiklerin henüz paylaşım yapmadı</h2>
                          <p>Psikologları ve ilgini çeken kişileri takip et; paylaşımları burada görünür.</p>
                          <button type="button" className="fx-btn fx-btn-primary" onClick={() => setFeedTab('all')}>Akışa dön</button>
                        </>
                      ) : (
                        <>
                          <h2>{filter !== 'Tümü' ? `${filter} konusunda henüz gönderi yok` : 'Henüz gönderi yok'}</h2>
                          <p>İlk soruyu ya da düşünceyi sen paylaş, sohbet oradan başlasın.</p>
                          <button type="button" className="fx-btn fx-btn-primary" onClick={openCompose}>Gönderi paylaş</button>
                        </>
                      )}
                    </div>
                    {feedTab === 'following' && <WhoToFollowStrip onNeedAuth={() => setAuthOpen(true)} />}
                  </>
                ) : feedPosts}

                {filtered.length > 0 && <div className="fx-end">Hepsi bu kadar. Yeni gönderiler geldikçe burada görünecek.</div>}
              </>
            )}

            {/* ── Mobil arama ── */}
            {mobileSearchOpen && (
              <div className="fx-msearch" role="dialog" aria-modal="true" aria-label="Ara">
                <div className="fx-msearch-head">
                  <button type="button" className="fx-icon-btn" onClick={() => setMobileSearchOpen(false)} aria-label="Geri" style={{ color: 'var(--fx-ink)' }}>
                    <ArrowLeft size={22} />
                  </button>
                  {searchField(undefined, true)}
                </div>
                <div className="fx-msearch-list">
                  {!searchQuery && trends.length > 0 && (
                    <>
                      <div className="fx-msearch-label">Gündem</div>
                      {trends.map(({ tag, count }) => (
                        <button key={tag} type="button" className="fx-panel-row" onClick={() => { setMobileSearchOpen(false); openTag(tag); }}>
                          <span className="fx-trend-tag">#{tag}</span>
                          <small>{count} gönderi</small>
                        </button>
                      ))}
                    </>
                  )}
                  {searchQuery && matchedUsers.length > 0 && (
                    <>
                      <div className="fx-msearch-label">Kişiler</div>
                      {matchedUsers.slice(0, 5).map((u: any) => (
                        <PersonRow key={u.uid} user={u} isFollowing={followingUids.includes(u.uid)} onNeedAuth={() => setAuthOpen(true)} />
                      ))}
                    </>
                  )}
                  {searchQuery && (
                    <>
                      <div className="fx-msearch-label">Gönderiler</div>
                      {filtered.slice(0, 20).map(t => (
                        <div key={t.id} className="fx-msearch-post" onClick={() => { setMobileSearchOpen(false); openThread(t); }}>
                          <b>{t.authorName}</b>
                          <div>{t.body}</div>
                        </div>
                      ))}
                      {filtered.length === 0 && <div className="fx-end">“{searchQuery}” ile eşleşen gönderi yok.</div>}
                      {filtered.length > 0 && (
                        <button type="button" className="fx-panel-more" onClick={() => setMobileSearchOpen(false)}>Tüm sonuçları akışta göster</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Paylaşım penceresi ── */}
            {composeModalOpen && (
              <div className="fx-sheet-scrim" onClick={() => setComposeModalOpen(false)}>
                <div className="fx-sheet" role="dialog" aria-modal="true" aria-label="Yeni gönderi" onClick={e => e.stopPropagation()}>
                  <div className="fx-sheet-head">
                    <button type="button" className="fx-icon-btn" onClick={() => setComposeModalOpen(false)} aria-label="Kapat" style={{ color: 'var(--fx-ink)' }}>
                      <X size={22} />
                    </button>
                  </div>
                  {renderComposer({ autoFocus: true, onPosted: () => setComposeModalOpen(false) })}
                </div>
              </div>
            )}

            <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} isDark={isDark} />
          </>
        )}
      </ForumShell>
    </>
  );
}
