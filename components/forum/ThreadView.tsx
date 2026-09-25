'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, MessageCircle, Heart, ThumbsDown, Repeat2, Bookmark, 
  Share2, Trash2, Camera, Loader, CheckCircle, Image as ImageIcon, X, MoreHorizontal 
} from 'lucide-react';
import { 
  doc, updateDoc, deleteField, increment, collection, 
  addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc,
  getDocs, where, setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export function renderTextWithMentions(text: string) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9ğıüşöçİĞÜŞÖÇ_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const cleanUsername = part.slice(1);
      return (
        <Link
          key={i}
          href={`/forum/profil/${encodeURIComponent(cleanUsername)}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            color: '#1d9bf0',
            fontWeight: 600,
            textDecoration: 'none'
          }}
          onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
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
    if (diff < 3600) return `${Math.floor(diff / 60)}d`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}g`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return 'şimdi';
  }
}

interface ThreadViewProps {
  post: any;
  currentUser: any;
  userProfile?: any;
  adminEmails: string[];
  onBack: () => void;
  onOpenAuth: () => void;
  onPostDeleted?: (postId: string) => void;
}

export default function ThreadView({
  post,
  currentUser,
  userProfile,
  adminEmails,
  onBack,
  onOpenAuth,
  onPostDeleted,
}: ThreadViewProps) {
  const [currentPost, setCurrentPost] = useState<any>(post);
  const [comments, setComments] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyImageUrl, setReplyImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyToUser, setReplyToUser] = useState<string>('');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const u = post?.authorUsername || (post?.authorName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici';
    setReplyToUser(u);
  }, [post?.id, post?.authorUsername, post?.authorName]);

  // Listen to post updates in real-time
  useEffect(() => {
    if (!post?.id) return;
    const unsub = onSnapshot(doc(db, 'forum', post.id), docSnap => {
      if (docSnap.exists()) {
        setCurrentPost((prev: any) => ({ ...prev, id: docSnap.id, ...docSnap.data() }));
      }
    });
    return () => unsub();
  }, [post?.id]);

  // Listen to comments in real-time
  useEffect(() => {
    if (!post?.id) return;
    const q = query(collection(db, 'forum', post.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [post?.id]);

  // Increment view count once per mount
  useEffect(() => {
    if (!post?.id) return;
    updateDoc(doc(db, 'forum', post.id), {
      viewsCount: increment(1)
    }).catch(() => {});
  }, [post?.id]);

  const p = currentPost || post;
  const username = p.authorUsername || (p.authorName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici';
  const isAdmin = adminEmails.includes(currentUser?.email || '');
  const canDeletePost = (currentUser?.uid && currentUser.uid === p.uid) || isAdmin;

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
    const postRef = doc(db, 'forum', p.id);
    if (hasLiked) {
      await updateDoc(postRef, { [`reactionsData.${currentUser.uid}`]: deleteField() });
    } else {
      await updateDoc(postRef, { [`reactionsData.${currentUser.uid}`]: 'like' });
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
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
        (userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
        (userProfile?.isPsychologist && !userProfile?.psychologistStatus) ||
        userProfile?.role === 'psychologist'
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
        originalCreatedAt: p.createdAt instanceof Date ? p.createdAt : new Date(),
      });

      await updateDoc(postRef, { [`repostsData.${currentUser.uid}`]: repostDoc.id });
      toast.success('Yeniden paylaşıldı');
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || currentUser.isAnonymous) return onOpenAuth();
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
    if (!replyText.trim() && !replyImageUrl) return;

    setSubmittingReply(true);
    try {
      const isPsychologist = Boolean(
        (userProfile?.isPsychologist && userProfile?.psychologistStatus === 'approved') ||
        (userProfile?.isPsychologist && !userProfile?.psychologistStatus) ||
        userProfile?.role === 'psychologist'
      );

      await addDoc(collection(db, 'forum', p.id, 'comments'), {
        authorName: userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
        authorIsPsychologist: isPsychologist,
        authorPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
        text: replyText.trim(),
        imageUrl: replyImageUrl || '',
        replyToUsername: replyToUser || username,
        createdAt: serverTimestamp(),
        reactionsData: {},
        repostsData: {},
        bookmarksData: {},
        uid: currentUser.uid
      });

      await updateDoc(doc(db, 'forum', p.id), {
        commentCount: increment(1)
      });

      setReplyText('');
      setReplyImageUrl('');
      setReplyToUser(username);
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
        originalAuthorIsPsychologist: c.authorIsPsychologist || false
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

  return (
    <div style={{ background: '#ffffff', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TOP HEADER (← Gönderi) ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        height: 54,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 20
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            transition: 'background 0.15s'
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseOut={e => (e.currentTarget.style.background = 'none')}
          title="Geri"
          aria-label="Geri"
        >
          <ArrowLeft size={20} strokeWidth={2.4} />
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
          Gönderi
        </h2>
      </div>

      {/* ── MAIN POST CONTAINER ── */}
      <article style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
        
        {/* Author Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href={`/forum/profil/${encodeURIComponent(username)}`} style={{ textDecoration: 'none' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                {p.authorPhotoURL ? (
                  <img src={p.authorPhotoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (p.authorName || 'U')[0].toUpperCase()
                )}
              </div>
            </Link>

            <div style={{ lineHeight: 1.3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Link
                  href={`/forum/profil/${encodeURIComponent(username)}`}
                  style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem', textDecoration: 'none' }}
                >
                  {p.authorName}
                </Link>
                {p.authorIsPsychologist && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    background: 'rgba(212, 175, 55, 0.12)',
                    color: '#926100',
                    border: '1px solid rgba(212, 175, 55, 0.45)',
                    padding: '1px 8px',
                    borderRadius: 999,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                  }}>
                    <CheckCircle size={10} color="#926100" />
                    <span>Psikolog</span>
                  </span>
                )}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.86rem' }}>
                @{username}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {p.category && (
              <span style={{
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {p.category}
              </span>
            )}
            {canDeletePost && (
              <button
                type="button"
                onClick={handleDeletePost}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}
                title="Gönderiyi Sil"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Post Title & Body */}
        {p.title && (
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 10,
            lineHeight: 1.35,
            wordBreak: 'break-word'
          }}>
            {p.title}
          </h1>
        )}

        <div style={{
          fontSize: '1.05rem',
          lineHeight: 1.6,
          color: '#0f172a',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          marginBottom: p.imageUrl ? 12 : 16
        }}>
          {renderTextWithMentions(p.body)}
        </div>

        {/* Attached Image */}
        {p.imageUrl && (
          <div style={{
            marginBottom: 16,
            borderRadius: 16,
            overflow: 'hidden',
            maxHeight: 480,
            border: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <img
              src={p.imageUrl}
              alt=""
              style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* Timestamp & Views */}
        <div style={{
          padding: '12px 0',
          borderBottom: '1px solid #f1f5f9',
          color: '#64748b',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap'
        }}>
          {formatPostTime(p.createdAt) && (
            <span>{formatPostTime(p.createdAt)} ·</span>
          )}
          <span>{formatPostDate(p.createdAt)}</span>
          <span>·</span>
          <span><strong>{viewsCount}</strong> Görüntüleme</span>
        </div>

        {/* ── ACTION BAR (Replies, Repost, Like, Dislike, Bookmark, Share) ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 4px 6px',
          color: '#64748b'
        }}>
          {/* 1. Reply */}
          <button
            type="button"
            onClick={() => replyInputRef.current?.focus()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.84rem',
              fontWeight: 500,
              padding: '6px 8px',
              borderRadius: 999,
              transition: 'color 0.15s'
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#1d9bf0')}
            onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
            title="Yanıtla"
          >
            <MessageCircle size={18} strokeWidth={1.8} />
            <span>{commentsCount}</span>
          </button>

          {/* 2. Repost */}
          <button
            type="button"
            onClick={handleRepost}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: hasReposted ? '#16a34a' : '#64748b',
              fontSize: '0.84rem',
              fontWeight: hasReposted ? 700 : 500,
              padding: '6px 8px',
              borderRadius: 999,
              transition: 'color 0.15s'
            }}
            onMouseOver={e => !hasReposted && (e.currentTarget.style.color = '#16a34a')}
            onMouseOut={e => !hasReposted && (e.currentTarget.style.color = '#64748b')}
            title="Yeniden Paylaş"
          >
            <Repeat2 size={19} strokeWidth={hasReposted ? 2.4 : 1.8} />
            <span>{repostsCount}</span>
          </button>

          {/* 3. Like */}
          <button
            type="button"
            onClick={handleLike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: hasLiked ? '#ef4444' : '#64748b',
              fontSize: '0.84rem',
              fontWeight: hasLiked ? 700 : 500,
              padding: '6px 8px',
              borderRadius: 999,
              transition: 'color 0.15s'
            }}
            onMouseOver={e => !hasLiked && (e.currentTarget.style.color = '#ef4444')}
            onMouseOut={e => !hasLiked && (e.currentTarget.style.color = '#64748b')}
            title="Beğen"
          >
            <Heart size={18} strokeWidth={hasLiked ? 2.4 : 1.8} fill={hasLiked ? '#ef4444' : 'none'} />
            <span>{likesCount}</span>
          </button>

          {/* 4. Dislike */}
          <button
            type="button"
            onClick={handleDislike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: hasDisliked ? '#3b82f6' : '#64748b',
              fontSize: '0.84rem',
              fontWeight: hasDisliked ? 700 : 500,
              padding: '6px 8px',
              borderRadius: 999,
              transition: 'color 0.15s'
            }}
            onMouseOver={e => !hasDisliked && (e.currentTarget.style.color = '#3b82f6')}
            onMouseOut={e => !hasDisliked && (e.currentTarget.style.color = '#64748b')}
            title="Beğenme"
          >
            <ThumbsDown size={18} strokeWidth={hasDisliked ? 2.4 : 1.8} fill={hasDisliked ? '#3b82f6' : 'none'} />
            <span>{dislikesCount}</span>
          </button>

          {/* 5. Bookmark */}
          <button
            type="button"
            onClick={handleBookmark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: hasBookmarked ? '#d97706' : '#64748b',
              fontSize: '0.84rem',
              fontWeight: hasBookmarked ? 700 : 500,
              padding: '6px 8px',
              borderRadius: 999,
              transition: 'color 0.15s'
            }}
            onMouseOver={e => !hasBookmarked && (e.currentTarget.style.color = '#d97706')}
            onMouseOut={e => !hasBookmarked && (e.currentTarget.style.color = '#64748b')}
            title="Kaydet"
          >
            <Bookmark size={18} strokeWidth={hasBookmarked ? 2.4 : 1.8} fill={hasBookmarked ? '#d97706' : 'none'} />
            <span>{bookmarksCount}</span>
          </button>

          {/* 6. Share */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px 8px',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s'
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#0f172a')}
            onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
            title="Paylaş"
          >
            <Share2 size={18} strokeWidth={1.8} />
          </button>
        </div>
      </article>

      {/* ── REPLY BOX (Yanıtını gönder) ── */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        background: '#fafafa'
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '0.95rem',
          flexShrink: 0,
          overflow: 'hidden',
          marginTop: 2
        }}>
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (userProfile?.displayName || currentUser?.displayName || 'U')[0].toUpperCase()
          )}
        </div>

        <div style={{ flex: 1 }}>
          {/* Replying to indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, fontSize: '0.84rem', color: '#64748b' }}>
            <span>Yanıt olarak</span>
            <Link
              href={`/forum/profil/${encodeURIComponent(replyToUser || username)}`}
              style={{ color: '#1d9bf0', textDecoration: 'none', fontWeight: 600 }}
            >
              @{replyToUser || username}
            </Link>
            {replyToUser && replyToUser !== username && (
              <button
                type="button"
                onClick={() => setReplyToUser(username)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 2,
                  marginLeft: 4,
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                title="İptal et"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <textarea
            ref={replyInputRef}
            rows={2}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Yanıtını gönder"
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '1rem',
              color: '#0f172a',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              padding: '6px 0'
            }}
          />

          {replyImageUrl && (
            <div style={{ position: 'relative', width: 90, height: 90, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', margin: '8px 0' }}>
              <img src={replyImageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => setReplyImageUrl('')}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid #f1f5f9'
          }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#64748b',
                cursor: uploadingImage ? 'wait' : 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '6px 8px',
                borderRadius: 8
              }}
              title="Görsel ekle"
            >
              {uploadingImage ? <Loader size={17} className="animate-spin" /> : <ImageIcon size={18} color="#1d9bf0" />}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                style={{ display: 'none' }}
                onChange={handleReplyImageUpload}
              />
            </label>

            <button
              type="button"
              disabled={submittingReply || uploadingImage || (!replyText.trim() && !replyImageUrl)}
              onClick={handleSubmitReply}
              style={{
                background: (replyText.trim() || replyImageUrl) ? '#0f172a' : '#94a3b8',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: (replyText.trim() || replyImageUrl) ? 'pointer' : 'default',
                transition: 'all 0.15s'
              }}
            >
              {submittingReply ? 'Gönderiliyor...' : 'Yanıtla'}
            </button>
          </div>
        </div>
      </div>

      {/* ── THREADED REPLIES LIST ── */}
      <div style={{ flex: 1, paddingBottom: 100 }}>
        {comments.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ margin: 0, fontSize: '0.92rem' }}>Henüz yanıt yok. İlk yanıtı sen gönder!</p>
          </div>
        ) : (
          comments.map(c => {
            const commentAuthorUsername = c.authorUsername || (c.authorName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici';
            const canDeleteComment = (currentUser?.uid && currentUser.uid === c.uid) || isAdmin;
            const commentLiked = c.reactionsData?.[currentUser?.uid || ''] === 'like';
            const commentLikesCount = Object.values(c.reactionsData || {}).filter(v => v === 'like').length;

            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: 'white'
                }}
              >
                {/* Comment author avatar */}
                <Link href={`/forum/profil/${encodeURIComponent(commentAuthorUsername)}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #334155, #0f172a)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {c.authorPhotoURL ? (
                      <img src={c.authorPhotoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (c.authorName || 'U')[0].toUpperCase()
                    )}
                  </div>
                </Link>

                {/* Comment content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Link
                        href={`/forum/profil/${encodeURIComponent(commentAuthorUsername)}`}
                        style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', textDecoration: 'none' }}
                      >
                        {c.authorName}
                      </Link>
                      {c.authorIsPsychologist && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          background: 'rgba(212, 175, 55, 0.12)',
                          color: '#926100',
                          border: '1px solid rgba(212, 175, 55, 0.45)',
                          padding: '1px 6px',
                          borderRadius: 999,
                          fontSize: '0.64rem',
                          fontWeight: 800,
                        }}>
                          <CheckCircle size={9} color="#926100" />
                          <span>Psikolog</span>
                        </span>
                      )}
                      <span style={{ color: '#64748b', fontSize: '0.82rem' }}>@{commentAuthorUsername}</span>
                      <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>·</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{formatTimeAgo(c.createdAt)}</span>
                    </div>

                    {canDeleteComment && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}
                        title="Yanıtı Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Replying to @user indicator in blue */}
                  <div style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Yanıt olarak</span>
                    <Link
                      href={`/forum/profil/${encodeURIComponent(c.replyToUsername || username)}`}
                      style={{ color: '#1d9bf0', textDecoration: 'none', fontWeight: 600 }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      @{c.replyToUsername || username}
                    </Link>
                  </div>

                  {/* Comment text with blue @mentions */}
                  {c.text && (
                    <p style={{
                      color: '#0f172a',
                      fontSize: '0.95rem',
                      lineHeight: 1.55,
                      margin: '4px 0 0',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {renderTextWithMentions(c.text)}
                    </p>
                  )}

                  {/* Comment image */}
                  {c.imageUrl && (
                    <div style={{
                      marginTop: 8,
                      borderRadius: 12,
                      overflow: 'hidden',
                      maxHeight: 260,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc'
                    }}>
                      <img src={c.imageUrl} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}

                  {/* ── COMMENT ACTION BUTTONS: Yanıtla, Yeniden Paylaş, Like, Dislike, Kaydet, Paylaş ── */}
                  {(() => {
                    const commentLiked = c.reactionsData?.[currentUser?.uid || ''] === 'like';
                    const commentDisliked = c.reactionsData?.[currentUser?.uid || ''] === 'dislike';
                    const commentReposted = Boolean(c.repostsData?.[currentUser?.uid || '']);
                    const commentBookmarked = Boolean(c.bookmarksData?.[currentUser?.uid || '']);

                    const commentLikesCount = Object.values(c.reactionsData || {}).filter(v => v === 'like').length;
                    const commentDislikesCount = Object.values(c.reactionsData || {}).filter(v => v === 'dislike').length;
                    const commentRepostsCount = Object.values(c.repostsData || {}).filter(Boolean).length;
                    const commentBookmarksCount = Object.values(c.bookmarksData || {}).filter(Boolean).length;

                    return (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        maxWidth: 380,
                        marginTop: 10,
                        color: '#64748b'
                      }}>
                        {/* 1. Yanıtla */}
                        <button
                          type="button"
                          onClick={() => {
                            setReplyToUser(commentAuthorUsername);
                            replyInputRef.current?.focus();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontSize: '0.8rem',
                            padding: '4px 6px',
                            borderRadius: 6
                          }}
                          onMouseOver={e => (e.currentTarget.style.color = '#1d9bf0')}
                          onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
                          title="Yanıtla"
                        >
                          <MessageCircle size={15} strokeWidth={1.8} />
                          <span>0</span>
                        </button>

                        {/* 2. Yeniden Paylaş (Repost) */}
                        <button
                          type="button"
                          onClick={() => handleCommentRepost(c)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: commentReposted ? '#16a34a' : '#64748b',
                            fontWeight: commentReposted ? 700 : 500,
                            fontSize: '0.8rem',
                            padding: '4px 6px',
                            borderRadius: 6
                          }}
                          onMouseOver={e => !commentReposted && (e.currentTarget.style.color = '#16a34a')}
                          onMouseOut={e => !commentReposted && (e.currentTarget.style.color = '#64748b')}
                          title="Yeniden Paylaş"
                        >
                          <Repeat2 size={16} strokeWidth={commentReposted ? 2.4 : 1.8} />
                          <span>{commentRepostsCount}</span>
                        </button>

                        {/* 3. Beğen (Like) */}
                        <button
                          type="button"
                          onClick={() => handleCommentLike(c.id, c.reactionsData)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: commentLiked ? '#ef4444' : '#64748b',
                            fontWeight: commentLiked ? 700 : 500,
                            fontSize: '0.8rem',
                            padding: '4px 6px',
                            borderRadius: 6
                          }}
                          onMouseOver={e => !commentLiked && (e.currentTarget.style.color = '#ef4444')}
                          onMouseOut={e => !commentLiked && (e.currentTarget.style.color = '#64748b')}
                          title="Beğen"
                        >
                          <Heart size={15} strokeWidth={commentLiked ? 2.4 : 1.8} fill={commentLiked ? '#ef4444' : 'none'} />
                          <span>{commentLikesCount}</span>
                        </button>

                        {/* 4. Beğenme (Dislike) */}
                        <button
                          type="button"
                          onClick={() => handleCommentDislike(c.id, c.reactionsData)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: commentDisliked ? '#3b82f6' : '#64748b',
                            fontWeight: commentDisliked ? 700 : 500,
                            fontSize: '0.8rem',
                            padding: '4px 6px',
                            borderRadius: 6
                          }}
                          onMouseOver={e => !commentDisliked && (e.currentTarget.style.color = '#3b82f6')}
                          onMouseOut={e => !commentDisliked && (e.currentTarget.style.color = '#64748b')}
                          title="Beğenme"
                        >
                          <ThumbsDown size={15} strokeWidth={commentDisliked ? 2.4 : 1.8} fill={commentDisliked ? '#3b82f6' : 'none'} />
                          <span>{commentDislikesCount}</span>
                        </button>

                        {/* 5. Kaydet (Bookmark) */}
                        <button
                          type="button"
                          onClick={() => handleCommentBookmark(c.id, c.bookmarksData)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: commentBookmarked ? '#d97706' : '#64748b',
                            fontWeight: commentBookmarked ? 700 : 500,
                            fontSize: '0.8rem',
                            padding: '4px 6px',
                            borderRadius: 6
                          }}
                          onMouseOver={e => !commentBookmarked && (e.currentTarget.style.color = '#d97706')}
                          onMouseOut={e => !commentBookmarked && (e.currentTarget.style.color = '#64748b')}
                          title="Kaydet"
                        >
                          <Bookmark size={15} strokeWidth={commentBookmarked ? 2.4 : 1.8} fill={commentBookmarked ? '#d97706' : 'none'} />
                          <span>{commentBookmarksCount}</span>
                        </button>

                        {/* 6. Paylaş */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/forum?thread=${p.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Bağlantı kopyalandı');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '4px 6px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseOver={e => (e.currentTarget.style.color = '#0f172a')}
                          onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
                          title="Paylaş"
                        >
                          <Share2 size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
