'use client';
import React, { useState } from 'react';
import { X, Send, Trash2, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string; title?: string; body: string; category: string;
  authorName: string; authorUsername?: string; uid: string;
  commentCount: number; createdAt: Date; reactionsData?: Record<string, string>;
  authorPhotoURL?: string;
}
interface Comment {
  id: string; authorName: string; authorUsername?: string;
  text: string; createdAt: Date; reactionsData?: Record<string, string>; uid: string;
  authorPhotoURL?: string;
}
interface Props {
  post: Post; comments: Comment[];
  currentUser: any; userProfile?: any; adminEmails: string[];
  onClose: () => void;
  onReact: (e: React.MouseEvent, post: Post, emoji: string) => void;
  onCommentReact: (e: React.MouseEvent, comment: Comment, emoji: string) => void;
  onSubmitComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
  onOpenAuth: () => void;
}

const EMOJIS = [
  { key: 'heart', emoji: '❤️', color: '#ef4444' },
  { key: 'lightbulb', emoji: '💡', color: '#eab308' },
  { key: 'clap', emoji: '👏', color: '#3b82f6' },
  { key: 'fire', emoji: '🔥', color: '#f97316' },
];

export default function ForumModal({ post, comments, currentUser, userProfile, adminEmails, onClose, onReact, onCommentReact, onSubmitComment, onDeleteComment, onOpenAuth }: Props) {
  const [text, setText] = useState('');
  const username = post.authorUsername || post.authorName.toLowerCase().replace(/\s+/g, '');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmitComment(text);
    setText('');
  };

  const isAdmin = adminEmails.includes(currentUser?.email || '');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white', width: '100%', maxWidth: 640, maxHeight: '90vh',
        borderRadius: 20, display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)'
        }}>
          <button onClick={onClose} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} color="#475569" />
          </button>
          <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>Gönderi Detayı</h2>
          <span style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase' }}>{post.category}</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '24px 24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Link href={`/forum/profil/${encodeURIComponent(username)}`}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', cursor: 'pointer', overflow: 'hidden' }}>
                  {post.authorPhotoURL ? <img src={post.authorPhotoURL} alt="pp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : post.authorName[0]?.toUpperCase()}
                </div>
              </Link>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{post.authorName}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{username} · {post.createdAt.toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
            {post.title && <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 12, lineHeight: 1.3 }}>{post.title}</h1>}
            <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20 }}>{post.body}</p>
            <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              {EMOJIS.map(({ key, emoji, color }) => {
                const count = Object.values(post.reactionsData || {}).filter(v => v === key).length;
                const active = post.reactionsData?.[currentUser?.uid || ''] === key;
                return (
                  <button key={key} onClick={e => onReact(e, post, key)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: active ? `${color}20` : '#f8fafc',
                    border: `1px solid ${active ? color + '40' : '#e2e8f0'}`, borderRadius: 999,
                    padding: '6px 14px', cursor: 'pointer', color: active ? color : '#64748b',
                    fontWeight: active ? 700 : 500, fontSize: '0.88rem', transition: 'all 0.2s'
                  }}>{emoji} {count}</button>
                );
              })}
            </div>
          </div>

          {currentUser && !currentUser.isAnonymous ? (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, overflow: 'hidden' }}>
                {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="pp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || currentUser.displayName || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                <input
                  placeholder="Yanıtla..." value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                  style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', fontSize: '0.95rem', outline: 'none', color: '#0f172a' }}
                />
                <button onClick={handleSubmit} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <button onClick={onOpenAuth} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 999, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                Yanıtlamak için giriş yap
              </button>
            </div>
          )}

          <div style={{ borderTop: '4px solid #f8fafc', paddingBottom: 80 }}>
            {comments.map(c => {
              const cu = c.authorUsername || c.authorName.toLowerCase().replace(/\s+/g, '');
              const canDeleteComment = (currentUser?.uid && currentUser.uid === c.uid) || isAdmin;
              return (
                <div key={c.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 12 }}>
                  <Link href={`/forum/profil/${encodeURIComponent(cu)}`}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#f093fb,#f5576c)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}>
                      {c.authorPhotoURL ? <img src={c.authorPhotoURL} alt="pp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.authorName[0]?.toUpperCase()}
                    </div>
                  </Link>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{c.authorName}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>@{cu}</span>
                      <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>· {c.createdAt.toLocaleDateString('tr-TR')}</span>
                      {canDeleteComment && (
                        <button
                          onClick={() => onDeleteComment(c.id)}
                          style={{
                            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                            color: '#94a3b8', padding: '2px 4px', borderRadius: 4, transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center'
                          }}
                          onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                          title="Yorumu Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p style={{ color: '#334155', fontSize: '0.93rem', lineHeight: 1.5, margin: 0 }}>{c.text}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {[{ key: 'heart', emoji: '❤️' }, { key: 'lightbulb', emoji: '💡' }].map(({ key, emoji }) => {
                        const count = Object.values(c.reactionsData || {}).filter(v => v === key).length;
                        return (
                          <button key={key} onClick={e => onCommentReact(e, c, key)} style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                            fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px'
                          }}>{emoji} {count > 0 && count}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
