'use client';
import React from 'react';
import Link from 'next/link';
import { MessageCircle, Trash2, MoreHorizontal } from 'lucide-react';

interface Post {
  id: string; title?: string; body: string; category: string;
  authorName: string; authorUsername?: string; uid: string;
  commentCount: number; createdAt: Date; reactionsData?: Record<string, string>;
  authorPhotoURL?: string;
}

interface Props {
  post: Post;
  currentUserUid?: string;
  currentUserEmail?: string;
  adminEmails: string[];
  onOpen: (p: Post) => void;
  onReact: (e: React.MouseEvent, p: Post, emoji: string) => void;
  onDelete: (id: string) => void;
}

const EMOJIS = [
  { key: 'heart', emoji: '❤️', color: '#ef4444' },
  { key: 'lightbulb', emoji: '💡', color: '#eab308' },
  { key: 'clap', emoji: '👏', color: '#3b82f6' },
  { key: 'fire', emoji: '🔥', color: '#f97316' },
];

export default function ForumPost({ post, currentUserUid, currentUserEmail, adminEmails, onOpen, onReact, onDelete }: Props) {
  const username = post.authorUsername || post.authorName.toLowerCase().replace(/\s+/g, '');
  const userReaction = post.reactionsData?.[currentUserUid || ''];
  const canDelete = (currentUserUid && currentUserUid === post.uid) || adminEmails.includes(currentUserEmail || '');

  return (
    <article
      style={{
        padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.15s', background: 'white'
      }}
      onMouseOver={e => (e.currentTarget.style.background = '#fafbfc')}
      onMouseOut={e => (e.currentTarget.style.background = 'white')}
    >
      <div style={{ display: 'flex', gap: 14 }}>
        <Link href={`/forum/profil/${encodeURIComponent(username)}`} onClick={e => e.stopPropagation()}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, cursor: 'pointer', overflow: 'hidden'
          }}>
            {post.authorPhotoURL ? <img src={post.authorPhotoURL} alt="pp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : post.authorName[0]?.toUpperCase()}
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Link href={`/forum/profil/${encodeURIComponent(username)}`} onClick={e => e.stopPropagation()}
                style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', textDecoration: 'none' }}>
                {post.authorName}
              </Link>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{username}</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>·</span>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{post.createdAt.toLocaleDateString('tr-TR')}</span>
              <span style={{
                background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem',
                fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{post.category}</span>
            </div>
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                  padding: '4px 6px', borderRadius: 6, transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                title="Gönderiyi Sil"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
          <div onClick={() => onOpen(post)} style={{ cursor: 'pointer' }}>
            {post.title && <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 6, lineHeight: 1.3, overflowWrap: 'break-word', wordBreak: 'normal' }}>{post.title}</h3>}
            <p style={{ fontSize: '0.97rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 14, overflowWrap: 'break-word', wordBreak: 'normal' }}>{post.body}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {EMOJIS.map(({ key, emoji, color }) => {
              const count = Object.values(post.reactionsData || {}).filter(v => v === key).length;
              const active = userReaction === key;
              return (
                <button key={key} onClick={e => onReact(e, post, key)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: active ? `${color}15` : 'none',
                  border: 'none', borderRadius: 999, padding: '4px 10px', cursor: 'pointer',
                  color: active ? color : '#94a3b8', fontWeight: active ? 700 : 500, fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}>
                  {emoji} {count > 0 && <span>{count}</span>}
                </button>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: '0.85rem', marginLeft: 'auto' }}>
              <MessageCircle size={16} /> <span>{post.commentCount}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
