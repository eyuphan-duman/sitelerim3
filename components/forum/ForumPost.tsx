'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Trash2, Heart, ThumbsDown, Repeat2,
  Bookmark, Share, MoreHorizontal, Link as LinkIcon, Flag, Ban
} from 'lucide-react';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatTimeAgo, formatPostDate, renderTextWithMentions } from './ThreadView';
import { Avatar, VerifiedMark, ReportDialog, compactCount, LevelBadge } from './ui';
import { useUsers, blockUser, useMyAnonPosts, useScores } from './social';
import { ANON_AVATAR, ANON_NAME, ANON_UID } from '@/lib/notify';
import { confirmBlock } from './confirm';
import { openInteractions } from './Interactions';
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
  authorHideBadge?: boolean;
  isRepost?: boolean;
  originalPostId?: string;
  originalAuthorName?: string;
  originalAuthorUsername?: string;
  originalAuthorPhotoURL?: string;
  originalAuthorIsPsychologist?: boolean;
  isAnonymous?: boolean;
  originalIsAnonymous?: boolean;
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
  onTopic?: (category: string) => void;
}

export default function ForumPost({
  post,
  currentUserUid,
  currentUserEmail,
  adminEmails,
  isPsychologist,
  onOpen,
  onLike,
  onDislike,
  onRepost,
  onBookmark,
  onDelete,
  onTopic,
}: Props) {
  const isRepost = Boolean(post.isRepost);
  const anon = Boolean(isRepost ? post.originalIsAnonymous : post.isAnonymous);
  const myAnon = useMyAnonPosts(currentUserUid);
  const ownsAnon = anon && myAnon.has(isRepost ? post.originalPostId || '' : post.id);
  const displayAuthorName = anon ? ANON_NAME : isRepost && post.originalAuthorName ? post.originalAuthorName : (post.authorName || 'Kullanıcı');
  const displayAuthorUsername = isRepost && post.originalAuthorUsername ? post.originalAuthorUsername : (post.authorUsername || (displayAuthorName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici');
  const displayAuthorPhoto = anon ? ANON_AVATAR : isRepost && post.originalAuthorPhotoURL ? post.originalAuthorPhotoURL : post.authorPhotoURL;
  const canDelete = (currentUserUid && currentUserUid === post.uid) || (!isRepost && ownsAnon) || adminEmails.includes(currentUserEmail || '');
  const hasPsychBadge = !anon && !post.authorHideBadge && Boolean(isPsychologist || post.authorIsPsychologist || (isRepost && post.originalAuthorIsPsychologist));
  const users = useUsers();
  const scores = useScores();
  const authorTitle = (!isRepost || !post.originalAuthorName) ? users[post.uid]?.title : undefined;
  const profileHref = `/forum/profil/${encodeURIComponent(displayAuthorUsername)}`;

  const [liveAuthorPhoto, setLiveAuthorPhoto] = useState<string | undefined>(displayAuthorPhoto);

  useEffect(() => {
    if (displayAuthorPhoto) setLiveAuthorPhoto(displayAuthorPhoto);
  }, [displayAuthorPhoto]);

  useEffect(() => {
    if (displayAuthorPhoto) return;
    const targetUid = post.uid;
    if (!targetUid) return;
    const unsub = onSnapshot(doc(db, 'users', targetUid), snap => {
      if (snap.exists() && snap.data()?.photoURL) setLiveAuthorPhoto(snap.data().photoURL);
    });
    return () => unsub();
  }, [post.uid, displayAuthorPhoto]);

  const userReaction = post.reactionsData?.[currentUserUid || ''];
  const hasLiked = userReaction === 'like' || userReaction === 'heart';
  const hasDisliked = userReaction === 'dislike';
  const hasReposted = Boolean(post.repostsData?.[currentUserUid || '']);
  const hasBookmarked = Boolean(post.bookmarksData?.[currentUserUid || '']);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [popped, setPopped] = useState<string | null>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return toast.error('Şikayet sebebini yazın.');
    setSubmittingReport(true);
    try {
      await addDoc(collection(db, 'reports'), {
        postId: post.id,
        postBody: post.body || '',
        postAuthorUid: post.uid,
        postAuthorName: displayAuthorName,
        postAuthorUsername: displayAuthorUsername,
        reportedByUid: currentUserUid || 'misafir',
        reportedByEmail: currentUserEmail || '',
        reason: reportReason.trim(),
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      toast.success('Şikayetin yöneticilere iletildi.');
      setReportModalOpen(false);
      setReportReason('');
    } catch (err: any) {
      toast.error('Şikayet gönderilemedi: ' + (err.message || ''));
    } finally {
      setSubmittingReport(false);
    }
  };

  const likesCount = Object.values(post.reactionsData || {}).filter(v => v === 'like' || v === 'heart').length;
  const dislikesCount = Object.values(post.reactionsData || {}).filter(v => v === 'dislike').length;
  const repostsCount = Object.values(post.repostsData || {}).filter(Boolean).length;
  const bookmarksCount = Object.values(post.bookmarksData || {}).filter(Boolean).length;
  const commentsCount = post.commentCount || 0;

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(`${window.location.origin}/forum?thread=${post.originalPostId || post.id}`);
      toast.success('Bağlantı panoya kopyalandı');
    } catch {
      toast.error('Bağlantı kopyalanamadı');
    }
  };

  const act = (kind: string, fn?: (e: React.MouseEvent, p: Post) => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopped(kind);
    fn?.(e, post);
  };

  return (
    <>
      <article className="fx-post" onClick={() => onOpen(post)}>
        {isRepost && (
          <div className="fx-post-social">
            <Repeat2 size={15} strokeWidth={2.2} />
            <Link href={`/forum/profil/${encodeURIComponent(post.authorUsername || '')}`} onClick={e => e.stopPropagation()}>
              {currentUserUid === post.uid ? 'Yeniden paylaştın' : `${post.authorName} yeniden paylaştı`}
            </Link>
          </div>
        )}

        <div className="fx-post-grid">
          {anon ? (
            <span className="fx-anon-avatar" aria-label={ANON_NAME}>
              <Avatar src={ANON_AVATAR} name={ANON_NAME} size={40} />
            </span>
          ) : (
            <Link href={profileHref} onClick={e => e.stopPropagation()} aria-label={displayAuthorName}>
              <Avatar src={liveAuthorPhoto || displayAuthorPhoto} name={displayAuthorName} size={40} />
            </Link>
          )}

          <div className="fx-post-body">
            <div className="fx-post-meta">
              <div className="fx-post-meta-main">
                {anon ? (
                  <span className="fx-name fx-name-anon">{ANON_NAME}</span>
                ) : (
                  <Link href={profileHref} onClick={e => e.stopPropagation()} className="fx-name">{displayAuthorName}</Link>
                )}
                {hasPsychBadge && <VerifiedMark label={authorTitle} />}
                {!anon && !isRepost && <LevelBadge level={scores.users[post.uid]?.level} points={scores.users[post.uid]?.points} />}
                {anon ? (ownsAnon && <span className="fx-anon-mine">Senin paylaşımın</span>) : <span className="fx-handle">@{displayAuthorUsername}</span>}
                <span className="fx-sep" aria-hidden="true">·</span>
                <time className="fx-time" title={formatPostDate(post.createdAt)}>{formatTimeAgo(post.createdAt)}</time>
              </div>

              <div className="fx-menu-wrap">
                <button
                  type="button"
                  className="fx-icon-btn"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  aria-label="Diğer seçenekler"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal size={18} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fx-menu-backdrop" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                    <div className="fx-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                      <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); copyLink(); }}>
                        <LinkIcon size={17} /> Bağlantıyı kopyala
                      </button>
                      <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setReportModalOpen(true); }}>
                        <Flag size={17} /> Gönderiyi şikayet et
                      </button>
                      {currentUserUid && post.uid && post.uid !== ANON_UID && !anon && currentUserUid !== post.uid && (
                        <button type="button" role="menuitem" onClick={async () => {
                          setMenuOpen(false);
                          const handle = post.authorUsername || post.authorName || 'kullanici';
                          if (!(await confirmBlock(handle))) return;
                          try { await blockUser(currentUserUid, post.uid); toast.success(`@${handle} engellendi`); }
                          catch { toast.error('Engellenemedi. Lütfen tekrar dene.'); }
                        }}>
                          <Ban size={17} /> @{post.authorUsername || 'kullanici'} adlı kişiyi engelle
                        </button>
                      )}
                      {canDelete && (
                        <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenuOpen(false); onDelete(post.id); }}>
                          <Trash2 size={17} /> Sil
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {post.title && <h3 className="fx-post-title">{post.title}</h3>}
            {post.body && <p className="fx-post-text">{renderTextWithMentions(post.body)}</p>}

            {post.imageUrl && (
              <div className="fx-post-media">
                <img src={post.imageUrl} alt="" loading="lazy" />
              </div>
            )}

            {post.category && (
              <button
                type="button"
                className="fx-topic-link"
                onClick={(e) => { e.stopPropagation(); onTopic?.(post.category!); }}
              >
                {post.category}
              </button>
            )}

            <div className="fx-actions" role="group" aria-label="Gönderi etkileşimleri">
              <button type="button" className="fx-act" onClick={(e) => { e.stopPropagation(); onOpen(post); }} aria-label={`Yanıtla, ${commentsCount} yanıt`}>
                <span className="fx-act-ic"><MessageCircle size={18} strokeWidth={1.8} /></span>
                <span className="fx-act-n">{compactCount(commentsCount)}</span>
              </button>
              <button type="button" data-kind="repost" className={`fx-act ${hasReposted ? 'is-on' : ''} ${popped === 'repost' ? 'pop' : ''}`} onClick={act('repost', onRepost)} aria-pressed={hasReposted} aria-label="Yeniden paylaş">
                <span className="fx-act-ic"><Repeat2 size={19} strokeWidth={hasReposted ? 2.4 : 1.8} /></span>
                <span className="fx-act-n fx-act-count" role="button" tabIndex={-1} title="Yeniden paylaşanlar" onClick={e => { if (!repostsCount) return; e.stopPropagation(); openInteractions(post.originalPostId || post.id, 'reposts'); }}>{compactCount(repostsCount)}</span>
              </button>
              <button type="button" data-kind="like" className={`fx-act ${hasLiked ? 'is-on' : ''} ${popped === 'like' ? 'pop' : ''}`} onClick={act('like', onLike)} aria-pressed={hasLiked} aria-label="Beğen">
                <span className="fx-act-ic"><Heart size={18} strokeWidth={hasLiked ? 0 : 1.8} fill={hasLiked ? 'currentColor' : 'none'} /></span>
                <span className="fx-act-n fx-act-count" role="button" tabIndex={-1} title="Beğenenler" onClick={e => { if (!likesCount) return; e.stopPropagation(); openInteractions(post.originalPostId || post.id, 'likes'); }}>{compactCount(likesCount)}</span>
              </button>
              <button type="button" data-kind="down" className={`fx-act ${hasDisliked ? 'is-on' : ''}`} onClick={act('down', onDislike)} aria-pressed={hasDisliked} aria-label="Katılmıyorum">
                <span className="fx-act-ic"><ThumbsDown size={17} strokeWidth={1.8} fill={hasDisliked ? 'currentColor' : 'none'} /></span>
                <span className="fx-act-n">{compactCount(dislikesCount)}</span>
              </button>
              <button type="button" data-kind="save" className={`fx-act ${hasBookmarked ? 'is-on' : ''} ${popped === 'save' ? 'pop' : ''}`} onClick={act('save', onBookmark)} aria-pressed={hasBookmarked} aria-label="Kaydet">
                <span className="fx-act-ic"><Bookmark size={18} strokeWidth={hasBookmarked ? 0 : 1.8} fill={hasBookmarked ? 'currentColor' : 'none'} /></span>
                <span className="fx-act-n">{compactCount(bookmarksCount)}</span>
              </button>
              <button type="button" className="fx-act" onClick={(e) => { e.stopPropagation(); copyLink(); }} aria-label="Bağlantıyı kopyala">
                <span className="fx-act-ic"><Share size={17} strokeWidth={1.8} /></span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {reportModalOpen && (
        <ReportDialog
          reason={reportReason}
          setReason={setReportReason}
          submitting={submittingReport}
          onClose={() => setReportModalOpen(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </>
  );
}
