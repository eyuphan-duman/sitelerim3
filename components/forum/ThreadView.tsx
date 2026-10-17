'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from './Composer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, MessageCircle, Heart, ThumbsDown, Repeat2, Bookmark,
  Share, Trash2, Loader, Image as ImageIcon, X, MoreHorizontal, Link as LinkIcon, Flag, Camera
} from 'lucide-react';
import { Avatar, VerifiedMark, CharRing, ReportDialog, compactCount } from './ui';
import { useUsers, useBlocks, unblockUser, useMyAnonPosts } from './social';
import { ANON_AVATAR, ANON_NAME, ANON_UID } from '@/lib/notify';
import { confirmUnblock } from './confirm';
import {
  doc, updateDoc, deleteField, increment, collection,
  addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc,
  getDocs, where, setDoc, getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendNotification } from '@/lib/notify';
import toast from 'react-hot-toast';
import { notifyMentions } from '@/lib/mentionUtils';

const COMMENT_CHAR_LIMIT = 140;

export function renderTextWithMentions(text: string) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9ğıüşöçİĞÜŞÖÇ_\.]+|#[a-zA-Z0-9ğıüşöçİĞÜŞÖÇ_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const cleanUsername = part.slice(1);
      return (
        <Link
          key={i}
          href={`/forum/profil/${encodeURIComponent(cleanUsername)}`}
          onClick={(e) => e.stopPropagation()}
          className="fx-mention"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith('#')) {
      const cleanTag = part.slice(1);
      return (
        <Link
          key={i}
          href={`/forum?tag=${encodeURIComponent(cleanTag)}`}
          onClick={(e) => e.stopPropagation()}
          className="fx-mention"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function formatPostDate(val: any): string {
  if (!val) return 'Az önce';
  try {
    let d: Date;
    if (val instanceof Date) d = val;
    else if (typeof val?.toDate === 'function') d = val.toDate();
    else if (typeof val === 'number' || typeof val === 'string') d = new Date(val);
    else if (val?.seconds) d = new Date(val.seconds * 1000);
    else return 'Az önce';
    if (isNaN(d.getTime())) return 'Az önce';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return 'Az önce';
  }
}

export function formatPostTime(val: any): string {
  if (!val) return '';
  try {
    let d: Date;
    if (val instanceof Date) d = val;
    else if (typeof val?.toDate === 'function') d = val.toDate();
    else if (typeof val === 'number' || typeof val === 'string') d = new Date(val);
    else if (val?.seconds) d = new Date(val.seconds * 1000);
    else return '';
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function formatTimeAgo(val: any): string {
  if (!val) return 'şimdi';
  try {
    let d: Date;
    if (val instanceof Date) d = val;
    else if (typeof val?.toDate === 'function') d = val.toDate();
    else if (typeof val === 'number' || typeof val === 'string') d = new Date(val);
    else if (val?.seconds) d = new Date(val.seconds * 1000);
    else return 'şimdi';
    if (isNaN(d.getTime())) return 'şimdi';

    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} g`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return 'şimdi';
  }
}

interface ThreadViewProps {
  post: any;
  currentUser: any;
  userProfile?: any;
  emailVerified?: boolean;
  photoLimitReached?: boolean;
  adminEmails: string[];
  isDark?: boolean;
  onBack: () => void;
  onOpenAuth: () => void;
  onPostDeleted?: (postId: string) => void;
}

export default function ThreadView({
  post,
  currentUser,
  userProfile,
  emailVerified,
  photoLimitReached,
  adminEmails,
  isDark,
  onBack,
  onOpenAuth,
  onPostDeleted,
}: ThreadViewProps) {
  const [currentPost, setCurrentPost] = useState<any>(post);
  const users = useUsers();
  const [comments, setComments] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [followsAuthor, setFollowsAuthor] = useState(false);
  const blocks = useBlocks(currentUser && !currentUser.isAnonymous ? currentUser.uid : null);
  const myAnon = useMyAnonPosts(currentUser && !currentUser.isAnonymous ? currentUser.uid : null);
  const pAnon = Boolean(currentPost?.isAnonymous);
  // İsimsiz gönderinin sahibi yanıtlarını da isimsiz verir
  const ownsAnon = pAnon && myAnon.has(currentPost?.id || '');
  const replyPolicy: string = currentPost?.replyPolicy || 'everyone';
  useEffect(() => {
    if (replyPolicy !== 'followers' || !currentUser || currentUser.isAnonymous || !currentPost?.uid || currentPost.uid === currentUser.uid) return;
    getDoc(doc(db, 'follows', `${currentUser.uid}_${currentPost.uid}`)).then(d => setFollowsAuthor(d.exists())).catch(() => {});
  }, [replyPolicy, currentUser, currentPost?.uid]);
  const [replyImageUrl, setReplyImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyToUser, setReplyToUser] = useState<string>('');
  // Bir yoruma yanıt verilirken: yanıtlanan yorum ve bağlı olduğu kök yorum
  const [replyTo, setReplyTo] = useState<{ id: string; rootId: string; uid: string; name: string; text: string; photo?: string } | null>(null);
  // Mobilde yanıt tam ekran yazılır
  const isMobile = useIsMobile();
  const [replyFull, setReplyFull] = useState(false);
  // Yoruma yanıt verirken başa eklenen "@kullanıcı " etiketi
  const replyTag = useRef('');
  const caretToEnd = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.focus();
    const n = el.value.length;
    el.setSelectionRange(n, n);
  };
  const [vv, setVv] = useState<{ h: number; top: number } | null>(null);
  const fullReplyRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!replyFull) return;
    const v = window.visualViewport;
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    // iOS yalnızca body'yi kilitlemekle yetinmez; html de kilitlenir
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const on = () => v && setVv({ h: v.height, top: v.offsetTop });
    on();
    v?.addEventListener('resize', on);
    v?.addEventListener('scroll', on);
    const t = setTimeout(() => caretToEnd(fullReplyRef.current), 60);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevHtml;
      v?.removeEventListener('resize', on);
      v?.removeEventListener('scroll', on);
    };
  }, [replyFull]);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();
  const notifFromUser = searchParams?.get('fromUser');
  const notifType = searchParams?.get('notifType');
  const [dismissNotif, setDismissNotif] = useState(false);
  const [authorProfilePhoto, setAuthorProfilePhoto] = useState<string>(
    post?.authorPhotoURL || (currentUser?.uid === post?.uid ? (userProfile?.photoURL || currentUser?.photoURL) : '')
  );

  // 3-dots menu & Report modal states
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      return toast.error('Lütfen şikayet sebebinizi belirtin.');
    }
    setSubmittingReport(true);
    try {
      await addDoc(collection(db, 'reports'), {
        postId: p.id,
        postBody: p.body || '',
        postAuthorUid: p.uid,
        postAuthorName: p.authorName || 'Kullanıcı',
        postAuthorUsername: username,
        reportedByUid: currentUser?.uid || 'misafir',
        reportedByEmail: currentUser?.email || '',
        reason: reportReason.trim(),
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      toast.success('Şikayetiniz yöneticilere iletildi.');
      setReportModalOpen(false);
      setReportReason('');
    } catch (err: any) {
      toast.error('Şikayet iletilemedi: ' + (err.message || ''));
    } finally {
      setSubmittingReport(false);
    }
  };

  useEffect(() => {
    const authorUid = post?.uid || currentPost?.uid;
    if (!authorUid) return;
    if (currentUser?.uid === authorUid && (userProfile?.photoURL || currentUser?.photoURL)) {
      setAuthorProfilePhoto(userProfile?.photoURL || currentUser?.photoURL);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', authorUid), snap => {
      if (snap.exists() && snap.data()?.photoURL) {
        setAuthorProfilePhoto(snap.data().photoURL);
      }
    });
    return () => unsub();
  }, [post?.uid, currentPost?.uid, currentUser?.uid, userProfile?.photoURL, currentUser?.photoURL]);

  useEffect(() => {
    const u = post?.authorUsername || (post?.authorName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici';
    setReplyToUser(u);
  }, [post?.id, post?.authorUsername, post?.authorName]);

  // Listen to post updates in real-time
  useEffect(() => {
    if (!post?.id) return;
    const unsub = onSnapshot(doc(db, 'forum', post.id), docSnap => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setCurrentPost((prev: any) => ({
          ...prev,
          ...d,
          id: docSnap.id,
          authorPhotoURL: d.authorPhotoURL || prev?.authorPhotoURL || post?.authorPhotoURL
        }));
      }
    });
    return () => unsub();
  }, [post?.id, post?.authorPhotoURL]);

  // Listen to comments in real-time
  useEffect(() => {
    if (!post?.id) return;
    const q = query(collection(db, 'forum', post.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [post?.id]);

  // Increment view count strictly ONCE per device (does not re-increment on page refresh)
  useEffect(() => {
    if (!post?.id) return;
    try {
      const storageKey = `forum_view_${post.id}`;
      if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) {
        return; // Already counted on this device
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, '1');
      }
      updateDoc(doc(db, 'forum', post.id), {
        viewsCount: increment(1)
      }).catch(() => {});
    } catch {
      // LocalStorage fallback
    }
  }, [post?.id]);

  const p = currentPost || post;
  const username = pAnon ? '' : p.authorUsername || (p.authorName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici';
  const isAdmin = adminEmails.includes(currentUser?.email || '');
  const canDeletePost = (currentUser?.uid && currentUser.uid === p.uid) || ownsAnon || isAdmin;

  // Reaction states
  const userReaction = p.reactionsData?.[currentUser?.uid || ''];
  const hasLiked = userReaction === 'like' || userReaction === 'heart';
  const hasDisliked = userReaction === 'dislike';
  const hasReposted = Boolean(p.repostsData?.[currentUser?.uid || '']);
  const hasBookmarked = Boolean(p.bookmarksData?.[currentUser?.uid || '']);

  // Counts
  const likesCount = Object.values(p.reactionsData || {}).filter(v => v === 'like' || v === 'heart').length;
  const dislikesCount = Object.values(p.reactionsData || {}).filter(v => v === 'dislike').length;
  const repostsCount = Object.values(p.repostsData || {}).filter(Boolean).length;
  const bookmarksCount = Object.values(p.bookmarksData || {}).filter(Boolean).length;
  const commentsCount = comments.length || p.commentCount || 0;
  const viewsCount = p.viewsCount || 1;

  // Handlers
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    if (!emailVerified) return toast.error('Bu işlem için e-posta adresinizi doğrulamanız gerekiyor.');
    const postRef = doc(db, 'forum', p.id);
    if (hasLiked) {
      await updateDoc(postRef, { [`reactionsData.${currentUser.uid}`]: deleteField() });
    } else {
      await updateDoc(postRef, { [`reactionsData.${currentUser.uid}`]: 'like' });
      if (p.uid && p.uid !== currentUser.uid) {
        try {
          await sendNotification({
            toUid: p.uid,
            fromUid: currentUser.uid,
            fromUser: userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
            fromUsername: userProfile?.username || (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
            fromPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
            type: 'reaction',
            message: 'gönderini beğendi.',
            postId: p.originalPostId || p.id,
            postTitle: p.body?.slice(0, 50) || '',
            read: false,
            createdAt: serverTimestamp()
          });
        } catch {}
      }
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    if (!emailVerified) return toast.error('Bu işlem için e-posta adresinizi doğrulamanız gerekiyor.');
    const postRef = doc(db, 'forum', p.id);
    if (hasDisliked) {
      await updateDoc(postRef, { [`reactionsData.${currentUser.uid}`]: deleteField() });
    } else {
      await updateDoc(postRef, { [`reactionsData.${currentUser.uid}`]: 'dislike' });
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    const isAdmin = adminEmails.map(em => em.toLowerCase()).includes(currentUser?.email?.toLowerCase() || '');
    if (!emailVerified) return toast.error('Yeniden paylaşım yapabilmek için e-posta adresinizi doğrulamanız gerekiyor.');
    const targetPostId = p.originalPostId || p.id;
    const postRef = doc(db, 'forum', targetPostId);
    const existingRepostDocId = typeof p.repostsData?.[currentUser.uid] === 'string'
      ? p.repostsData[currentUser.uid]
      : null;

    if (hasReposted) {
      await updateDoc(postRef, { [`repostsData.${currentUser.uid}`]: deleteField() });
      if (existingRepostDocId) {
        try { await deleteDoc(doc(db, 'forum', existingRepostDocId)); } catch {}
      } else {
        try {
          const qSnap = await getDocs(query(
            collection(db, 'forum'),
            where('originalPostId', '==', targetPostId),
            where('uid', '==', currentUser.uid),
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
        body: p.body,
        category: p.category || 'Genel',
        imageUrl: p.imageUrl || '',
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        authorName: userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
        authorPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
        isPsychologist: isPsychologist,
        authorHideBadge: Boolean(userProfile?.hideBadge),
        commentCount: 0,
        reactionsData: {},
        repostsData: {},
        bookmarksData: {},
        isRepost: true,
        originalPostId: targetPostId,
        originalAuthorName: p.originalAuthorName || p.authorName,
        originalAuthorUsername: p.originalAuthorUsername || username,
        originalAuthorPhotoURL: p.originalAuthorPhotoURL || p.authorPhotoURL || '',
        originalAuthorIsPsychologist: p.originalAuthorIsPsychologist ?? p.authorIsPsychologist ?? false,
        originalIsAnonymous: Boolean(p.originalIsAnonymous ?? p.isAnonymous),
        originalCreatedAt: p.createdAt instanceof Date ? p.createdAt : new Date(),
      });

      await updateDoc(postRef, { [`repostsData.${currentUser.uid}`]: repostDoc.id });

      if (p.uid && p.uid !== currentUser.uid) {
        try {
          await sendNotification({
            toUid: p.uid,
            fromUid: currentUser.uid,
            fromUser: userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
            fromUsername: userProfile?.username || (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
            fromPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
            type: 'repost',
            message: 'gönderini yeniden paylaştı.',
            postId: targetPostId,
            postTitle: p.body?.slice(0, 50) || '',
            read: false,
            createdAt: serverTimestamp()
          });
        } catch {}
      }

      toast.success('Yeniden paylaşıldı');
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    if (!emailVerified) return toast.error('Yer işareti ekleyebilmek için e-posta adresinizi doğrulamanız gerekiyor.');
    const targetPostId = p.originalPostId || p.id;
    const postRef = doc(db, 'forum', targetPostId);
    const userBookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', targetPostId);

    if (hasBookmarked) {
      await updateDoc(postRef, { [`bookmarksData.${currentUser.uid}`]: deleteField() });
      try { await deleteDoc(userBookmarkRef); } catch {}
      toast.success('Yer işaretlerinden kaldırıldı');
    } else {
      await updateDoc(postRef, { [`bookmarksData.${currentUser.uid}`]: true });
      try {
        await setDoc(userBookmarkRef, {
          postId: targetPostId,
          createdAt: serverTimestamp(),
          postBody: p.body?.slice(0, 100) || '',
          authorName: p.authorName || ''
        });
      } catch {}
      toast.success('Yer işaretlerine kaydedildi');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/forum?thread=${p.id}`;
      await navigator.clipboard.writeText(url);
      toast.success('Gönderi bağlantısı kopyalandı');
    } catch {
      toast.error('Bağlantı kopyalanamadı');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'forum', p.id));
      toast.success('Gönderi silindi');
      if (onPostDeleted) onPostDeleted(p.id);
      onBack();
    } catch (err: any) {
      toast.error('Gönderi silinirken hata: ' + (err.message || ''));
    }
  };

  const handleReplyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoLimitReached) {
      toast.error('Fotoğraf yükleme hakkınızı kullandınız. Rozetli (psikolog) kullanıcılar hariç her üye yalnızca 1 fotoğraf yükleyebilir.');
      if (e.target) e.target.value = '';
      return;
    }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'manav-platform/forum');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Yükleme başarısız');
      setReplyImageUrl(data.url);
    } catch (err: any) {
      toast.error('Görsel yüklenirken hata: ' + (err.message || ''));
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmitReply = async () => {
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    if (userProfile?.isBanned) return toast.error('Hesabınız askıya alınmıştır (banlandı). Yorum yapamazsınız.');
    if (!emailVerified) return toast.error('Yorum yapabilmek için e-posta adresinizi doğrulamanız gerekiyor.');
    if (!canReply) return toast.error(replyNote);
    if (!replyText.trim() && !replyImageUrl) return;
    if (replyText.length > COMMENT_CHAR_LIMIT) return toast.error(`Yorum en fazla ${COMMENT_CHAR_LIMIT} karakter olabilir.`);

    setSubmittingReply(true);
    try {
      const isPsychologist = Boolean(
        ((userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
        (userProfile?.isPsychologist && !userProfile?.psychologistStatus) ||
        userProfile?.role === 'psychologist') && !userProfile?.hideBadge
      );
      const usesNewPhoto = Boolean(replyImageUrl) && !isPsychologist;

      const anonFields = ownsAnon
        ? { isAnonymous: true, uid: ANON_UID, authorName: ANON_NAME, authorUsername: '', authorIsPsychologist: false, authorHideBadge: false, authorPhotoURL: '' }
        : {};
      await addDoc(collection(db, 'forum', p.id, 'comments'), {
        authorName: userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
        authorIsPsychologist: isPsychologist,
        authorHideBadge: Boolean(userProfile?.hideBadge),
        authorPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
        text: replyText.trim(),
        imageUrl: replyImageUrl || '',
        replyToUsername: replyToUser || username,
        parentId: replyTo?.rootId || '',
        replyToCommentId: replyTo?.id || '',
        createdAt: serverTimestamp(),
        reactionsData: {},
        repostsData: {},
        bookmarksData: {},
        uid: currentUser.uid,
        ...anonFields,
      });

      if (usesNewPhoto) {
        try { await updateDoc(doc(db, 'users', currentUser.uid), { photoUploadsUsed: increment(1) }); } catch {}
      }

      await updateDoc(doc(db, 'forum', p.id), {
        commentCount: increment(1)
      });

      if (p.uid && p.uid !== currentUser.uid) {
        try {
          await sendNotification({
            toUid: p.uid,
            fromUid: currentUser.uid,
            fromUser: userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
            fromUsername: userProfile?.username || (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
            fromPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
            type: 'comment',
            message: 'gönderine yanıt verdi.',
            postId: p.originalPostId || p.id,
            postTitle: replyText.trim().slice(0, 50),
            read: false,
            createdAt: serverTimestamp()
          });
        } catch {}
      }

      // Notify any mentioned users in reply (isimsiz yanıtta kimlik açığa çıkmasın diye gönderilmez)
      if (!ownsAnon) try {
        await notifyMentions({
          text: replyText,
          postId: p.originalPostId || p.id,
          currentUser,
          userProfile,
          skipUids: [p.uid, replyTo?.uid || ''].filter(Boolean)
        });
      } catch {}

      // Yanıtlanan yorumun sahibine de haber ver (gönderi sahibi zaten yukarıda bildirildi)
      if (replyTo && replyTo.uid && replyTo.uid !== currentUser.uid && replyTo.uid !== p.uid) {
        try {
          await sendNotification({
            toUid: replyTo.uid,
            fromUid: currentUser.uid,
            fromUser: ownsAnon ? ANON_NAME : userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
            fromUsername: ownsAnon ? '' : userProfile?.username || '',
            fromPhotoURL: ownsAnon ? '' : userProfile?.photoURL || currentUser.photoURL || '',
            type: 'comment',
            message: 'yanıtına yanıt verdi.',
            postId: p.originalPostId || p.id,
            postTitle: replyText.trim().slice(0, 50),
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch {}
      }

      setReplyText('');
      setReplyImageUrl('');
      setReplyToUser(username);
      setReplyTo(null);
      replyTag.current = '';
      setReplyFull(false);
      toast.success('Yanıtınız paylaşıldı');
    } catch (err: any) {
      toast.error('Yanıt gönderilemedi: ' + (err.message || ''));
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bu yanıtı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'forum', p.id, 'comments', commentId));
      await updateDoc(doc(db, 'forum', p.id), {
        commentCount: increment(-1)
      });
      toast.success('Yanıt silindi');
    } catch (err: any) {
      toast.error('Silinemedi: ' + (err.message || ''));
    }
  };

  const handleCommentLike = async (commentId: string, currentReactionData: any) => {
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    const commentRef = doc(db, 'forum', p.id, 'comments', commentId);
    const userReaction = currentReactionData?.[currentUser.uid];
    if (userReaction === 'like') {
      await updateDoc(commentRef, { [`reactionsData.${currentUser.uid}`]: deleteField() });
    } else {
      await updateDoc(commentRef, { [`reactionsData.${currentUser.uid}`]: 'like' });
    }
  };

  const handleCommentDislike = async (commentId: string, currentReactionData: any) => {
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    const commentRef = doc(db, 'forum', p.id, 'comments', commentId);
    const userReaction = currentReactionData?.[currentUser.uid];
    if (userReaction === 'dislike') {
      await updateDoc(commentRef, { [`reactionsData.${currentUser.uid}`]: deleteField() });
    } else {
      await updateDoc(commentRef, { [`reactionsData.${currentUser.uid}`]: 'dislike' });
    }
  };

  const handleCommentRepost = async (c: any) => {
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    const commentRef = doc(db, 'forum', p.id, 'comments', c.id);
    const hasRepostedComment = Boolean(c.repostsData?.[currentUser.uid]);
    const existingDocId = typeof c.repostsData?.[currentUser.uid] === 'string' ? c.repostsData[currentUser.uid] : null;

    if (hasRepostedComment) {
      await updateDoc(commentRef, { [`repostsData.${currentUser.uid}`]: deleteField() });
      if (existingDocId) {
        try { await deleteDoc(doc(db, 'forum', existingDocId)); } catch {}
      }
      toast.success('Yeniden paylaşım geri alındı');
    } else {
      const isPsychologist = Boolean(
        (userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
        (userProfile?.isPsychologist && !userProfile?.psychologistStatus) ||
        userProfile?.role === 'psychologist'
      );

      const repostDoc = await addDoc(collection(db, 'forum'), {
        body: c.text,
        imageUrl: c.imageUrl || '',
        category: p.category || 'Genel',
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        authorName: userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
        authorPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
        isPsychologist: isPsychologist,
        commentCount: 0,
        reactionsData: {},
        repostsData: {},
        bookmarksData: {},
        isRepost: true,
        originalPostId: p.id,
        originalAuthorName: c.authorName,
        originalAuthorUsername: c.authorUsername || (c.authorName || '').toLowerCase().replace(/\s+/g, ''),
        originalAuthorPhotoURL: c.authorPhotoURL || '',
        originalAuthorIsPsychologist: c.authorIsPsychologist || false,
        originalIsAnonymous: Boolean(c.isAnonymous)
      });
      await updateDoc(commentRef, { [`repostsData.${currentUser.uid}`]: repostDoc.id });
      toast.success('Yeniden paylaşıldı');
    }
  };

  const handleCommentBookmark = async (commentId: string, currentBookmarks: any) => {
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
    const commentRef = doc(db, 'forum', p.id, 'comments', commentId);
    const hasBookmarked = Boolean(currentBookmarks?.[currentUser.uid]);
    if (hasBookmarked) {
      await updateDoc(commentRef, { [`bookmarksData.${currentUser.uid}`]: deleteField() });
      toast.success('Yer işaretlerinden kaldırıldı');
    } else {
      await updateDoc(commentRef, { [`bookmarksData.${currentUser.uid}`]: true });
      toast.success('Yer işaretlerine kaydedildi');
    }
  };

  const isMember = Boolean(currentUser && !currentUser.isAnonymous);
  const amPsych = Boolean((userProfile?.isPsychologist && (userProfile?.psychologistStatus === 'approved' || !userProfile?.psychologistStatus)) || userProfile?.role === 'psychologist');
  const authorBlockedMe = Boolean(currentPost?.uid && blocks.blockedBy.has(currentPost.uid));
  const iBlockedAuthor = Boolean(currentPost?.uid && blocks.blocked.has(currentPost.uid));
  const canReply = !authorBlockedMe && !iBlockedAuthor && (!isMember || replyPolicy === 'everyone' || currentPost?.uid === currentUser?.uid || ownsAnon ||
    adminEmails.includes(currentUser?.email?.toLowerCase() || '') ||
    (replyPolicy === 'psychologists' && amPsych) || (replyPolicy === 'followers' && followsAuthor));
  const replyNote = replyPolicy === 'nobody' ? 'Bu gönderiye yanıt kapalı.'
    : replyPolicy === 'psychologists' ? 'Bu gönderiyi yalnızca psikologlar yanıtlayabilir.'
    : replyPolicy === 'followers' ? `Bu gönderiyi yalnızca @${currentPost?.authorUsername || 'yazarın'} adlı kişinin takipçileri yanıtlayabilir.` : '';
  const authorPhoto = authorProfilePhoto || p.authorPhotoURL || (currentUser?.uid === p.uid ? (userProfile?.photoURL || currentUser?.photoURL) : '');
  const myPhoto = ownsAnon ? ANON_AVATAR : userProfile?.photoURL || currentUser?.photoURL || '';
  const myName = ownsAnon ? ANON_NAME : userProfile?.displayName || currentUser?.displayName || '';
  const timeLabel = formatPostTime(p.createdAt);

  const notifText: Record<string, string> = {
    reaction: 'bu gönderini beğendi.',
    repost: 'bu gönderini yeniden paylaştı.',
    comment: 'bu gönderine yanıt verdi.',
    mention: 'bu gönderide senden bahsetti.',
  };

  const stats = [
    { n: commentsCount, label: 'Yanıt' },
    { n: repostsCount, label: 'Yeniden paylaşım' },
    { n: likesCount, label: 'Beğeni' },
    { n: bookmarksCount, label: 'Kayıt' },
  ].filter(s => s.n > 0);

  if (authorBlockedMe || iBlockedAuthor) {
    const h = currentPost?.authorUsername || 'kullanici';
    return (
      <div className="fx-thread">
        <div className="fx-thead">
          <button type="button" className="fx-icon-btn" onClick={onBack} aria-label="Geri" style={{ color: 'var(--fx-ink)' }}>
            <ArrowLeft size={20} />
          </button>
          <h2>Gönderi</h2>
        </div>
        <div className="fx-empty">
          {authorBlockedMe ? (
            <>
              <h2>Bu gönderiyi göremezsin</h2>
              <p>@{h} seni engellediği için gönderilerini göremez ve yanıt yazamazsın.</p>
            </>
          ) : (
            <>
              <h2>@{h} adlı kişiyi engelledin</h2>
              <p>Engeli kaldırırsan gönderilerini yeniden görebilirsin.</p>
              <button type="button" className="fx-btn fx-btn-outline" onClick={async () => {
                if (!(await confirmUnblock(h))) return;
                try { await unblockUser(currentUser.uid, currentPost.uid); toast.success(`@${h} adlı kişinin engeli kaldırıldı`); } catch { toast.error('İşlem yapılamadı.'); }
              }}>Engeli kaldır</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Yorumlar: kök yorumlar ve altlarındaki yanıtlar (tek seviye girinti)
  const visibleComments = comments.filter(c => !blocks.hidden.has(c.uid));
  const commentIds = new Set(visibleComments.map(c => c.id));
  const kidsOf: Record<string, any[]> = {};
  const lastByAuthor: Record<string, string> = {};
  const threadRoots: any[] = [];
  for (const c of visibleComments) {
    let root = c.parentId && commentIds.has(c.parentId) ? c.parentId : '';
    // parentId'den önceki eski yanıtlar: aynı kişinin en son yorumuna bağlanır
    if (!c.parentId && c.replyToUsername && c.replyToUsername !== username && lastByAuthor[c.replyToUsername]) {
      root = lastByAuthor[c.replyToUsername];
    }
    if (root) (kidsOf[root] ||= []).push(c);
    else threadRoots.push(c);
    const handle = c.authorUsername || (c.authorName || '').toLowerCase().replace(/\s+/g, '');
    if (handle) lastByAuthor[handle] = root || c.id;
  }

  const dropTag = (t: string) => (replyTag.current && t.startsWith(replyTag.current) ? t.slice(replyTag.current.length) : t);

  const clearReplyTo = () => {
    setReplyText(t => dropTag(t));
    replyTag.current = '';
    setReplyTo(null);
    setReplyToUser(username);
  };

  const openPostReply = () => {
    clearReplyTo();
    setReplyFull(true);
  };

  const startReplyTo = (c: any, handle: string) => {
    // Yanıtlanan kişi yanıtın başında etiketlenir (kendi yorumuna ya da isimsiz yoruma etiket eklenmez)
    const myHandle = (userProfile?.username || '').toLowerCase();
    const tag = !c.isAnonymous && handle && handle.toLowerCase() !== myHandle ? `@${handle} ` : '';
    setReplyText(t => {
      const rest = dropTag(t);
      return rest.startsWith(tag) ? rest : (tag + rest).slice(0, COMMENT_CHAR_LIMIT);
    });
    replyTag.current = tag;
    setReplyToUser(c.isAnonymous ? '' : handle);
    setReplyTo({ id: c.id, rootId: c.parentId && commentIds.has(c.parentId) ? c.parentId : c.id, uid: c.uid, name: c.isAnonymous ? ANON_NAME : c.authorName || handle, text: (c.text || '').slice(0, 120), photo: c.isAnonymous ? ANON_AVATAR : c.authorPhotoURL || '' });
    if (isMobile) { setReplyFull(true); return; }
    setTimeout(() => caretToEnd(replyInputRef.current), 0);
    replyInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const renderComment = (c: any, isChild: boolean): React.ReactNode => {
    const kids = isChild ? [] : kidsOf[c.id] || [];
            const commentAuthorUsername = c.authorUsername || (c.authorName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici';
            const canDeleteComment = (currentUser?.uid && currentUser.uid === c.uid) || (c.isAnonymous && ownsAnon) || isAdmin;
            const uid = currentUser?.uid || '';
            const liked = c.reactionsData?.[uid] === 'like';
            const disliked = c.reactionsData?.[uid] === 'dislike';
            const reposted = Boolean(c.repostsData?.[uid]);
            const saved = Boolean(c.bookmarksData?.[uid]);
            const likeN = Object.values(c.reactionsData || {}).filter(v => v === 'like').length;
            const downN = Object.values(c.reactionsData || {}).filter(v => v === 'dislike').length;
            const repostN = Object.values(c.repostsData || {}).filter(Boolean).length;
            const saveN = Object.values(c.bookmarksData || {}).filter(Boolean).length;
            const replyTarget = c.replyToUsername || username;
            const guard = (fn: () => void) => () => (isMember ? fn() : onOpenAuth());

            return (
              <div key={c.id} className={`fx-post fx-comment ${isChild ? 'is-child' : ''} ${kids.length ? 'has-kids' : ''}`}>
                <div className="fx-post-grid">
                  {c.isAnonymous ? (
                    <span className="fx-anon-avatar"><Avatar src={ANON_AVATAR} name={ANON_NAME} size={isChild ? 32 : 40} /></span>
                  ) : (
                    <Link href={`/forum/profil/${encodeURIComponent(commentAuthorUsername)}`} aria-label={c.authorName}>
                      <Avatar src={c.authorPhotoURL} name={c.authorName} size={isChild ? 32 : 40} />
                    </Link>
                  )}
                  <div className="fx-post-body">
                    <div className="fx-post-meta">
                      <div className="fx-post-meta-main">
                        {c.isAnonymous ? (
                          <>
                            <span className="fx-name fx-name-anon">{ANON_NAME}</span>
                            <span className="fx-anon-mine">Gönderi sahibi</span>
                          </>
                        ) : (
                          <>
                            <Link href={`/forum/profil/${encodeURIComponent(commentAuthorUsername)}`} className="fx-name">{c.authorName}</Link>
                            {c.authorIsPsychologist && !c.authorHideBadge && <VerifiedMark label={users[c.uid]?.title} />}
                            <span className="fx-handle">@{commentAuthorUsername}</span>
                          </>
                        )}
                        <span className="fx-sep" aria-hidden="true">·</span>
                        <time className="fx-time" title={formatPostDate(c.createdAt)}>{formatTimeAgo(c.createdAt)}</time>
                      </div>
                      {canDeleteComment && (
                        <button type="button" className="fx-icon-btn fx-comment-del" onClick={() => handleDeleteComment(c.id)} aria-label="Yanıtı sil" title="Yanıtı sil">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {replyTarget !== username && !(c.text || '').startsWith('@' + replyTarget) && (
                      <div className="fx-reply-to">
                        <Link href={`/forum/profil/${encodeURIComponent(replyTarget)}`} className="fx-mention">@{replyTarget}</Link> adlı kişiye yanıt
                      </div>
                    )}

                    {c.text && <p className="fx-post-text">{renderTextWithMentions(c.text)}</p>}
                    {c.imageUrl && (
                      <div className="fx-post-media">
                        <img src={c.imageUrl} alt="" loading="lazy" />
                      </div>
                    )}

                    <div className="fx-actions" role="group" aria-label="Yanıt etkileşimleri">
                      <button type="button" className="fx-act" onClick={guard(() => startReplyTo(c, commentAuthorUsername))} aria-label={kids.length ? `Yanıtla, ${kids.length} yanıt` : 'Yanıtla'}>
                        <span className="fx-act-ic"><MessageCircle size={17} strokeWidth={1.8} /></span>
                        {!isChild && kids.length > 0 && <span className="fx-act-n">{compactCount(kids.length)}</span>}
                      </button>
                      <button type="button" data-kind="repost" className={`fx-act ${reposted ? 'is-on' : ''}`} onClick={() => handleCommentRepost(c)} aria-pressed={reposted} aria-label="Yeniden paylaş">
                        <span className="fx-act-ic"><Repeat2 size={18} strokeWidth={reposted ? 2.4 : 1.8} /></span>
                        <span className="fx-act-n">{compactCount(repostN)}</span>
                      </button>
                      <button type="button" data-kind="like" className={`fx-act ${liked ? 'is-on' : ''}`} onClick={() => handleCommentLike(c.id, c.reactionsData)} aria-pressed={liked} aria-label="Beğen">
                        <span className="fx-act-ic"><Heart size={17} strokeWidth={liked ? 0 : 1.8} fill={liked ? 'currentColor' : 'none'} /></span>
                        <span className="fx-act-n">{compactCount(likeN)}</span>
                      </button>
                      <button type="button" data-kind="down" className={`fx-act ${disliked ? 'is-on' : ''}`} onClick={() => handleCommentDislike(c.id, c.reactionsData)} aria-pressed={disliked} aria-label="Katılmıyorum">
                        <span className="fx-act-ic"><ThumbsDown size={16} strokeWidth={1.8} fill={disliked ? 'currentColor' : 'none'} /></span>
                        <span className="fx-act-n">{compactCount(downN)}</span>
                      </button>
                      <button type="button" data-kind="save" className={`fx-act ${saved ? 'is-on' : ''}`} onClick={() => handleCommentBookmark(c.id, c.bookmarksData)} aria-pressed={saved} aria-label="Kaydet">
                        <span className="fx-act-ic"><Bookmark size={17} strokeWidth={saved ? 0 : 1.8} fill={saved ? 'currentColor' : 'none'} /></span>
                        <span className="fx-act-n">{compactCount(saveN)}</span>
                      </button>
                      <button
                        type="button"
                        className="fx-act"
                        onClick={async () => {
                          try { await navigator.clipboard.writeText(`${window.location.origin}/forum?thread=${p.id}`); toast.success('Bağlantı panoya kopyalandı'); }
                          catch { toast.error('Bağlantı kopyalanamadı'); }
                        }}
                        aria-label="Bağlantıyı kopyala"
                      >
                        <span className="fx-act-ic"><Share size={16} strokeWidth={1.8} /></span>
                      </button>
                    </div>
                  </div>
                </div>
                {!isChild && kids.length > 0 && (
                  <div className="fx-comment-kids" aria-label={`${kids.length} yanıt`}>
                    {kids.map(k => renderComment(k, true))}
                  </div>
                )}
              </div>
            );
  };

  return (
    <div className="fx-thread">
      <div className="fx-thead">
        <button type="button" className="fx-icon-btn" onClick={onBack} aria-label="Geri" style={{ color: 'var(--fx-ink)' }}>
          <ArrowLeft size={20} />
        </button>
        <h2>Gönderi</h2>
      </div>

      {notifFromUser && !dismissNotif && (
        <div className="fx-notice">
          <span>
            <Link href={`/forum/profil/${encodeURIComponent(notifFromUser)}`}>@{notifFromUser}</Link>{' '}
            {notifText[notifType || ''] || 'bu gönderinle etkileşime geçti.'}
          </span>
          <button type="button" className="fx-icon-btn" onClick={() => setDismissNotif(true)} aria-label="Kapat"><X size={16} /></button>
        </div>
      )}

      <article className="fx-detail">
        <div className="fx-detail-head">
          {pAnon ? (
            <>
              <span className="fx-anon-avatar"><Avatar src={ANON_AVATAR} name={ANON_NAME} size={44} /></span>
              <div className="fx-detail-who">
                <div className="fx-post-meta-main"><span className="fx-name fx-name-anon">{ANON_NAME}</span></div>
                <div className="fx-handle">{ownsAnon ? 'Senin isimsiz paylaşımın' : 'Profili gizli'}</div>
              </div>
            </>
          ) : (
            <>
              <Link href={`/forum/profil/${encodeURIComponent(username)}`} aria-label={p.authorName}>
                <Avatar src={authorPhoto} name={p.authorName} size={44} />
              </Link>
              <div className="fx-detail-who">
                <div className="fx-post-meta-main">
                  <Link href={`/forum/profil/${encodeURIComponent(username)}`} className="fx-name">{p.authorName}</Link>
                  {(post.authorIsPsychologist || p.authorIsPsychologist) && !p.authorHideBadge && <VerifiedMark label={users[p.uid]?.title} />}
                </div>
                <div className="fx-handle">@{username}</div>
              </div>
            </>
          )}

          <div className="fx-menu-wrap">
            <button type="button" className="fx-icon-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Diğer seçenekler" aria-expanded={menuOpen}>
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <>
                <div className="fx-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="fx-menu" role="menu">
                  <button type="button" role="menuitem" onClick={(e) => { setMenuOpen(false); handleShare(e); }}>
                    <LinkIcon size={17} /> Bağlantıyı kopyala
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setReportModalOpen(true); }}>
                    <Flag size={17} /> Gönderiyi şikayet et
                  </button>
                  {canDeletePost && (
                    <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenuOpen(false); handleDeletePost(); }}>
                      <Trash2 size={17} /> Sil
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {p.title && <h3 className="fx-detail-title">{p.title}</h3>}
        {p.body && <p className="fx-detail-text">{renderTextWithMentions(p.body)}</p>}

        {p.imageUrl && (
          <div className="fx-post-media">
            <img src={p.imageUrl} alt="" />
          </div>
        )}

        <div className="fx-detail-meta">
          {timeLabel && <><time>{timeLabel}</time><span aria-hidden="true">·</span></>}
          <time>{formatPostDate(p.createdAt)}</time>
          <span aria-hidden="true">·</span>
          <span><b>{viewsCount}</b> görüntülenme</span>
          {p.category && (
            <>
              <span aria-hidden="true">·</span>
              <Link href={`/forum?cat=${encodeURIComponent(p.category)}`} className="fx-mention">{p.category}</Link>
            </>
          )}
        </div>

        {stats.length > 0 && (
          <div className="fx-detail-stats">
            {stats.map(s => <span key={s.label}><b>{s.n}</b> {s.label}</span>)}
          </div>
        )}

        <div className="fx-actions fx-detail-actions" role="group" aria-label="Gönderi etkileşimleri">
          <button type="button" className="fx-act" onClick={() => (!isMember ? onOpenAuth() : isMobile ? (canReply ? openPostReply() : toast.error(replyNote)) : replyInputRef.current?.focus())} aria-label="Yanıtla">
            <span className="fx-act-ic"><MessageCircle size={21} strokeWidth={1.8} /></span>
          </button>
          <button type="button" data-kind="repost" className={`fx-act ${hasReposted ? 'is-on' : ''}`} onClick={handleRepost} aria-pressed={hasReposted} aria-label="Yeniden paylaş">
            <span className="fx-act-ic"><Repeat2 size={22} strokeWidth={hasReposted ? 2.4 : 1.8} /></span>
          </button>
          <button type="button" data-kind="like" className={`fx-act ${hasLiked ? 'is-on' : ''}`} onClick={handleLike} aria-pressed={hasLiked} aria-label="Beğen">
            <span className="fx-act-ic"><Heart size={21} strokeWidth={hasLiked ? 0 : 1.8} fill={hasLiked ? 'currentColor' : 'none'} /></span>
          </button>
          <button type="button" data-kind="down" className={`fx-act ${hasDisliked ? 'is-on' : ''}`} onClick={handleDislike} aria-pressed={hasDisliked} aria-label={`Katılmıyorum${dislikesCount ? `, ${dislikesCount}` : ''}`}>
            <span className="fx-act-ic"><ThumbsDown size={20} strokeWidth={1.8} fill={hasDisliked ? 'currentColor' : 'none'} /></span>
          </button>
          <button type="button" data-kind="save" className={`fx-act ${hasBookmarked ? 'is-on' : ''}`} onClick={handleBookmark} aria-pressed={hasBookmarked} aria-label="Kaydet">
            <span className="fx-act-ic"><Bookmark size={21} strokeWidth={hasBookmarked ? 0 : 1.8} fill={hasBookmarked ? 'currentColor' : 'none'} /></span>
          </button>
          <button type="button" className="fx-act" onClick={handleShare} aria-label="Bağlantıyı kopyala">
            <span className="fx-act-ic"><Share size={20} strokeWidth={1.8} /></span>
          </button>
        </div>
      </article>

      {replyNote && (
        <div className="fx-reply-policy-note" role="note">{replyNote}{canReply && isMember && currentPost?.uid !== currentUser?.uid ? ' Sen yanıtlayabilirsin.' : ''}</div>
      )}
      {(isMember && !canReply) || isMobile ? null : isMember ? (
        <div className="fx-compose fx-reply">
          <Avatar src={myPhoto} name={myName} size={40} />
          <div className="fx-compose-body">
            <div className="fx-reply-to">
              {replyToUser || username ? (
                <>
                  <Link href={`/forum/profil/${encodeURIComponent(replyToUser || username)}`} className="fx-mention">@{replyToUser || username}</Link>
                  <span> adlı kişiye yanıt</span>
                </>
              ) : (
                <span>{ownsAnon ? 'İsimsiz olarak yanıt veriyorsun' : 'İsimsiz kullanıcıya yanıt'}</span>
              )}
              {replyTo ? (
                <button type="button" className="fx-text-btn" onClick={clearReplyTo}>vazgeç</button>
              ) : replyToUser && replyToUser !== username && (
                <button type="button" className="fx-text-btn" onClick={() => setReplyToUser(username)}>gönderiye dön</button>
              )}
            </div>
            {replyTo && (
              <div className="fx-replying-quote">
                <b>{replyTo.name}</b>
                <span>{replyTo.text || 'Görsel'}</span>
              </div>
            )}
            <textarea
              ref={replyInputRef}
              rows={2}
              value={replyText}
              maxLength={COMMENT_CHAR_LIMIT}
              onChange={e => setReplyText(e.target.value.slice(0, COMMENT_CHAR_LIMIT))}
              placeholder="Yanıtını yaz"
              aria-label="Yanıt metni"
            />
            {replyImageUrl && (
              <div className="fx-compose-preview">
                <img src={replyImageUrl} alt="Eklenen görsel" />
                <button type="button" onClick={() => setReplyImageUrl('')} aria-label="Görseli kaldır"><X size={16} /></button>
              </div>
            )}
            <div className="fx-compose-bar">
              <div className="fx-compose-tools">
                <label className="fx-tool" aria-disabled={photoLimitReached || uploadingImage} title={photoLimitReached ? 'Görsel ekleme hakkını kullandın' : 'Görsel ekle'}>
                  {uploadingImage ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={19} />}
                  <input type="file" accept="image/*" onChange={handleReplyImageUpload} hidden disabled={uploadingImage || photoLimitReached} />
                </label>
              </div>
              <div className="fx-compose-send">
                <CharRing length={replyText.length} limit={COMMENT_CHAR_LIMIT} />
                <button
                  type="button"
                  className="fx-btn fx-btn-primary"
                  onClick={handleSubmitReply}
                  disabled={submittingReply || (!replyText.trim() && !replyImageUrl)}
                >
                  {submittingReply ? 'Gönderiliyor…' : 'Yanıtla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="fx-reply-guest">
          <span>Yanıt yazmak için giriş yap.</span>
          <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={onOpenAuth}>Giriş yap</button>
        </div>
      )}

      <section aria-label="Yanıtlar">
        {comments.length === 0 ? (
          <div className="fx-end">Henüz yanıt yok. İlk yanıtı sen yaz.</div>
        ) : (
          threadRoots.map(c => renderComment(c, false))
        )}
      </section>

      {isMobile && !(isMember && !canReply) && (
        <>
          <div className="fx-reply-dock-space" aria-hidden="true" />
          <div className="fx-reply-dock">
            <button type="button" onClick={() => (isMember ? openPostReply() : onOpenAuth())}>
              {isMember ? (replyText ? replyText : 'Yanıtını gönder') : 'Yanıt yazmak için giriş yap'}
            </button>
          </div>
        </>
      )}

      {replyFull && isMobile && createPortal(
        <div className="fx-fullcompose" role="dialog" aria-modal="true" aria-label="Yanıt yaz" style={vv ? { height: vv.h, top: vv.top } : undefined}>
          <div className="fx-fullcompose-head">
            <button type="button" className="fx-text-btn fx-fullcompose-cancel" onClick={() => setReplyFull(false)}>İptal et</button>
            <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={handleSubmitReply} disabled={submittingReply || (!replyText.trim() && !replyImageUrl)}>
              {submittingReply ? 'Gönderiliyor…' : 'Yanıtla'}
            </button>
          </div>
          <div className="fx-fullcompose-main">
            <div className="fx-reply-ctx">
              <div className="fx-reply-ctx-rail">
                <Avatar src={replyTo ? replyTo.photo : pAnon ? ANON_AVATAR : authorPhoto} name={replyTo ? replyTo.name : pAnon ? ANON_NAME : p.authorName} size={40} />
              </div>
              <div className="fx-reply-ctx-body">
                <b>{replyTo ? replyTo.name : pAnon ? ANON_NAME : p.authorName}</b>
                <p>{(replyTo ? replyTo.text : (p.body || '').slice(0, 160)) || 'Görsel'}</p>
                <div className="fx-reply-ctx-to">
                  {replyToUser || username ? <>Yanıtladığın kişi <span className="fx-mention">@{replyToUser || username}</span></> : ownsAnon ? 'İsimsiz olarak yanıt veriyorsun' : 'İsimsiz kullanıcıya yanıt veriyorsun'}
                </div>
              </div>
            </div>
            <div className="fx-compose fx-compose-full">
              <Avatar src={myPhoto} name={myName} size={40} />
              <div className="fx-compose-body">
                <textarea
                  ref={fullReplyRef}
                  value={replyText}
                  maxLength={COMMENT_CHAR_LIMIT}
                  onChange={e => setReplyText(e.target.value.slice(0, COMMENT_CHAR_LIMIT))}
                  placeholder="Yanıtını yaz"
                  aria-label="Yanıt metni"
                />
                {replyImageUrl && (
                  <div className="fx-compose-preview">
                    <img src={replyImageUrl} alt="Eklenen görsel" />
                    <button type="button" onClick={() => setReplyImageUrl('')} aria-label="Görseli kaldır"><X size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="fx-fullcompose-foot">
            <div className="fx-fullcompose-tools">
              <div className="fx-compose-tools">
                <label className="fx-tool" aria-disabled={photoLimitReached || uploadingImage} title="Fotoğraf ekle">
                  {uploadingImage ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={21} />}
                  <input type="file" accept="image/*" onChange={handleReplyImageUpload} hidden disabled={uploadingImage || photoLimitReached} />
                </label>
                <label className="fx-tool" aria-disabled={photoLimitReached || uploadingImage} title="Kamerayı aç">
                  <Camera size={21} />
                  <input type="file" accept="image/*" capture="environment" onChange={handleReplyImageUpload} hidden disabled={uploadingImage || photoLimitReached} />
                </label>
              </div>
              <CharRing length={replyText.length} limit={COMMENT_CHAR_LIMIT} />
            </div>
          </div>
        </div>,
        (document.querySelector('[data-forum-page]') as HTMLElement | null) || document.body
      )}

      {reportModalOpen && (
        <ReportDialog
          reason={reportReason}
          setReason={setReportReason}
          submitting={submittingReport}
          onClose={() => setReportModalOpen(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
}
