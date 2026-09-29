'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageCircle, Trash2, Heart, ThumbsDown, Repeat2, 
  Bookmark, Share2, CheckCircle 
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatPostDate, formatTimeAgo, renderTextWithMentions } from './ThreadView';
import toast from 'react-hot-toast';

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
  imageUrl?: string;
  authorIsPsychologist?: boolean;
  isRepost?: boolean;
  originalPostId?: string;
  originalAuthorName?: string;
  originalAuthorUsername?: string;
  originalAuthorPhotoURL?: string;
  originalAuthorIsPsychologist?: boolean;
}

interface Props {
  post: Post;
  currentUserUid?: string;
  currentUserEmail?: string;
  adminEmails: string[];
  isPsychologist?: boolean;
  isDark?: boolean;
  onOpen: (p: Post) => void;
  onLike?: (e: React.MouseEvent, p: Post) => void;
  onDislike?: (e: React.MouseEvent, p: Post) => void;
  onRepost?: (e: React.MouseEvent, p: Post) => void;
  onBookmark?: (e: React.MouseEvent, p: Post) => void;
  onDelete: (id: string) => void;
}

export default function ForumPost({
  post,
  currentUserUid,
  currentUserEmail,
  adminEmails,
  isPsychologist,
  isDark,
  onOpen,
  onLike,
  onDislike,
  onRepost,
  onBookmark,
  onDelete
}: Props) {
  const isRepost = Boolean(post.isRepost);
  const displayAuthorName = isRepost && post.originalAuthorName ? post.originalAuthorName : (post.authorName || 'Kullanıcı');
  const displayAuthorUsername = isRepost && post.originalAuthorUsername ? post.originalAuthorUsername : (post.authorUsername || (displayAuthorName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici');
  const displayAuthorPhoto = isRepost && post.originalAuthorPhotoURL ? post.originalAuthorPhotoURL : post.authorPhotoURL;
  const canDelete = (currentUserUid && currentUserUid === post.uid) || adminEmails.includes(currentUserEmail || '');
  const hasPsychBadge = Boolean(isPsychologist || post.authorIsPsychologist || (isRepost && post.originalAuthorIsPsychologist));

  const [liveAuthorPhoto, setLiveAuthorPhoto] = useState<string | undefined>(displayAuthorPhoto);

  useEffect(() => {
    if (displayAuthorPhoto) {
      setLiveAuthorPhoto(displayAuthorPhoto);
    }
  }, [displayAuthorPhoto]);

  useEffect(() => {
    if (displayAuthorPhoto) return;
    const targetUid = post.uid;
    if (!targetUid) return;
    const unsub = onSnapshot(doc(db, 'users', targetUid), snap => {
      if (snap.exists() && snap.data()?.photoURL) {
        setLiveAuthorPhoto(snap.data().photoURL);
      }
    });
    return () => unsub();
  }, [post.uid, displayAuthorPhoto]);

  // Reaction & state flags
  const userReaction = post.reactionsData?.[currentUserUid || ''];
  const hasLiked = userReaction === 'like' || userReaction === 'heart';
  const hasDisliked = userReaction === 'dislike';
  const hasReposted = Boolean(post.repostsData?.[currentUserUid || '']);
  const hasBookmarked = Boolean(post.bookmarksData?.[currentUserUid || '']);

  // Counts
  const likesCount = Object.values(post.reactionsData || {}).filter(v => v === 'like' || v === 'heart').length;
  const dislikesCount = Object.values(post.reactionsData || {}).filter(v => v === 'dislike').length;
  const repostsCount = Object.values(post.repostsData || {}).filter(Boolean).length;
  const bookmarksCount = Object.values(post.bookmarksData || {}).filter(Boolean).length;
  const commentsCount = post.commentCount || 0;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/forum?thread=${post.originalPostId || post.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Gönderi bağlantısı kopyalandı');
    } catch {
      toast.error('Bağlantı kopyalanamadı');
    }
  };

  return (
    <article
      style={{
        padding: '18px 20px',
        borderBottom: `1px solid ${isDark ? '#2f3336' : '#f1f5f9'}`,
        transition: 'background 0.15s ease',
        background: isDark ? '#000000' : 'white',
        cursor: 'pointer'
      }}
      onClick={() => onOpen(post)}
      onMouseOver={e => (e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.03)' : '#fafbfc')}
      onMouseOut={e => (e.currentTarget.style.background = isDark ? '#000000' : 'white')}
    >
      {/* Repost Header Badge */}
      {isRepost && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#16a34a',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: 8,
          paddingLeft: 46
        }}>
          <Repeat2 size={15} strokeWidth={2.4} />
          <Link
            href={`/forum/profil/${encodeURIComponent(post.authorUsername || '')}`}
            onClick={e => e.stopPropagation()}
            style={{ color: '#16a34a', textDecoration: 'none' }}
            onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {post.authorName} yeniden paylaştı
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14 }}>
        
        {/* User avatar */}
        <Link href={`/forum/profil/${encodeURIComponent(displayAuthorUsername)}`} onClick={e => e.stopPropagation()}>
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
            flexShrink: 0,
            cursor: 'pointer',
            overflow: 'hidden'
          }}>
            {(liveAuthorPhoto || displayAuthorPhoto) ? (
              <img src={liveAuthorPhoto || displayAuthorPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (displayAuthorName || 'U')[0].toUpperCase()
            )}
          </div>
        </Link>

        {/* Content column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Link
                href={`/forum/profil/${encodeURIComponent(displayAuthorUsername)}`}
                onClick={e => e.stopPropagation()}
                style={{ fontWeight: 800, color: isDark ? '#e7e9ea' : '#0f172a', fontSize: '0.94rem', textDecoration: 'none' }}
              >
                {displayAuthorName}
              </Link>

              {hasPsychBadge && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  background: isDark ? 'rgba(212, 175, 55, 0.18)' : 'rgba(212, 175, 55, 0.12)',
                  color: isDark ? '#fbbf24' : '#926100',
                  border: `1px solid ${isDark ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.45)'}`,
                  padding: '1px 7px',
                  borderRadius: 999,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                }}>
                  <CheckCircle size={10} color={isDark ? '#fbbf24' : '#926100'} />
                  <span>Psikolog</span>
                </span>
              )}

              <span style={{ color: isDark ? '#71767b' : '#64748b', fontSize: '0.84rem' }}>@{displayAuthorUsername}</span>
              <span style={{ color: isDark ? '#3e4144' : '#cbd5e1', fontSize: '0.84rem' }}>·</span>
              <span style={{ color: isDark ? '#71767b' : '#94a3b8', fontSize: '0.82rem' }}>{formatTimeAgo(post.createdAt)}</span>

              {post.category && (
                <span style={{
                  background: isDark ? '#16181c' : '#f1f5f9',
                  color: isDark ? '#94a3b8' : '#64748b',
                  border: isDark ? '1px solid #2f3336' : 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {post.category}
                </span>
              )}
            </div>

            {canDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDark ? '#71767b' : '#94a3b8',
                  padding: '4px 6px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s'
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'; }}
                onMouseOut={e => { e.currentTarget.style.color = isDark ? '#71767b' : '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                title="Gönderiyi Sil"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Post text & optional title */}
          <div>
            {post.title && (
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: isDark ? '#e7e9ea' : '#0f172a',
                marginBottom: 6,
                lineHeight: 1.35,
                wordBreak: 'break-word'
              }}>
                {post.title}
              </h3>
            )}
            <p style={{
              fontSize: '0.96rem',
              color: isDark ? '#e7e9ea' : '#1e293b',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: '0 0 10px'
            }}>
              {renderTextWithMentions(post.body)}
            </p>

            {post.imageUrl && (
              <div style={{
                marginTop: 10,
                marginBottom: 12,
                borderRadius: 18,
                overflow: 'hidden',
                maxHeight: 480,
                background: isDark ? '#16181c' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.06)'
              }}>
                <img
                  src={post.imageUrl}
                  alt=""
                  style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}
          </div>

          {/* ── ACTION BAR: Yanıt, Repost, Like, Dislike, Kaydet, Paylaş ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 450,
            marginTop: 6,
            color: isDark ? '#71767b' : '#64748b'
          }}>
            
            {/* 1. Reply */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpen(post); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '0.82rem',
                padding: '4px 6px',
                borderRadius: 6
              }}
              onMouseOver={e => (e.currentTarget.style.color = '#1d9bf0')}
              onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
              title="Yanıtla"
            >
              <MessageCircle size={16} strokeWidth={1.8} />
              <span>{commentsCount}</span>
            </button>

            {/* 2. Repost */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRepost && onRepost(e, post); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: hasReposted ? '#16a34a' : '#64748b',
                fontWeight: hasReposted ? 700 : 500,
                fontSize: '0.82rem',
                padding: '4px 6px',
                borderRadius: 6
              }}
              onMouseOver={e => !hasReposted && (e.currentTarget.style.color = '#16a34a')}
              onMouseOut={e => !hasReposted && (e.currentTarget.style.color = '#64748b')}
              title="Yeniden Paylaş"
            >
              <Repeat2 size={17} strokeWidth={hasReposted ? 2.4 : 1.8} />
              <span>{repostsCount}</span>
            </button>

            {/* 3. Like */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onLike && onLike(e, post); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: hasLiked ? '#ef4444' : '#64748b',
                fontWeight: hasLiked ? 700 : 500,
                fontSize: '0.82rem',
                padding: '4px 6px',
                borderRadius: 6
              }}
              onMouseOver={e => !hasLiked && (e.currentTarget.style.color = '#ef4444')}
              onMouseOut={e => !hasLiked && (e.currentTarget.style.color = '#64748b')}
              title="Beğen"
            >
              <Heart size={16} strokeWidth={hasLiked ? 2.4 : 1.8} fill={hasLiked ? '#ef4444' : 'none'} />
              <span>{likesCount}</span>
            </button>

            {/* 4. Dislike */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDislike && onDislike(e, post); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: hasDisliked ? '#3b82f6' : '#64748b',
                fontWeight: hasDisliked ? 700 : 500,
                fontSize: '0.82rem',
                padding: '4px 6px',
                borderRadius: 6
              }}
              onMouseOver={e => !hasDisliked && (e.currentTarget.style.color = '#3b82f6')}
              onMouseOut={e => !hasDisliked && (e.currentTarget.style.color = '#64748b')}
              title="Beğenme"
            >
              <ThumbsDown size={16} strokeWidth={hasDisliked ? 2.4 : 1.8} fill={hasDisliked ? '#3b82f6' : 'none'} />
              <span>{dislikesCount}</span>
            </button>

            {/* 5. Bookmark */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onBookmark && onBookmark(e, post); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: hasBookmarked ? '#d97706' : '#64748b',
                fontWeight: hasBookmarked ? 700 : 500,
                fontSize: '0.82rem',
                padding: '4px 6px',
                borderRadius: 6
              }}
              onMouseOver={e => !hasBookmarked && (e.currentTarget.style.color = '#d97706')}
              onMouseOut={e => !hasBookmarked && (e.currentTarget.style.color = '#64748b')}
              title="Kaydet"
            >
              <Bookmark size={16} strokeWidth={hasBookmarked ? 2.4 : 1.8} fill={hasBookmarked ? '#d97706' : 'none'} />
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
                padding: '4px 6px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseOver={e => (e.currentTarget.style.color = '#0f172a')}
              onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
              title="Paylaş"
            >
              <Share2 size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
