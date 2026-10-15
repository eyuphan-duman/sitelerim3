'use client';
import React, { useState } from 'react';
import { X, Send, Trash2, Heart, Lightbulb, ThumbsUp, Flame, Camera, Loader, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string; title?: string; body: string; category: string;
  authorName: string; authorUsername?: string; uid: string;
  commentCount: number; createdAt: Date; reactionsData?: Record<string, string>;
  authorPhotoURL?: string;
  imageUrl?: string;
  authorIsPsychologist?: boolean;
  authorHideBadge?: boolean;
}
interface Comment {
  id: string; authorName: string; authorUsername?: string;
  text: string; createdAt: Date; reactionsData?: Record<string, string>; uid: string;
  authorPhotoURL?: string;
  imageUrl?: string;
  authorIsPsychologist?: boolean;
  authorHideBadge?: boolean;
}
interface Props {
  post: Post; comments: Comment[];
  currentUser: any; userProfile?: any; adminEmails: string[];
  onClose: () => void;
  onReact: (e: React.MouseEvent, post: Post, emoji: string) => void;
  onCommentReact: (e: React.MouseEvent, comment: Comment, emoji: string) => void;
  onSubmitComment: (text: string, imageUrl?: string) => void;
  onDeleteComment: (id: string) => void;
  onOpenAuth: () => void;
}

const REACTIONS = [
  { key: 'heart', label: 'Beğen', Icon: Heart, color: '#ef4444' },
  { key: 'lightbulb', label: 'Fikir', Icon: Lightbulb, color: '#eab308' },
  { key: 'clap', label: 'Tebrik', Icon: ThumbsUp, color: '#3b82f6' },
  { key: 'fire', label: 'Etkileyici', Icon: Flame, color: '#f97316' },
];

export default function ForumModal({ post, comments, currentUser, userProfile, adminEmails, onClose, onReact, onCommentReact, onSubmitComment, onDeleteComment, onOpenAuth }: Props) {
  const [text, setText] = useState('');
  const [commentImageUrl, setCommentImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const username = post.authorUsername || post.authorName.toLowerCase().replace(/\s+/g, '');

  const handleSubmit = () => {
    if (!text.trim() && !commentImageUrl) return;
    onSubmitComment(text, commentImageUrl);
    setText('');
    setCommentImageUrl('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'manav-platform/forum');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCommentImageUrl(data.url);
    } catch (err: any) {
      alert('Görsel yüklenemedi: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
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
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{post.authorName}</span>
                  {post.authorIsPsychologist && !post.authorHideBadge && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      background: 'rgba(212, 175, 55, 0.12)',
                      color: '#926100',
                      border: '1px solid rgba(212, 175, 55, 0.45)',
                      padding: '1px 7px',
                      borderRadius: 999,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                    }}>
                      <CheckCircle size={10} color="#926100" />
                      <span>Psikolog</span>
                    </span>
                  )}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{username} · {post.createdAt.toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
            {post.title && <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 12, lineHeight: 1.3 }}>{post.title}</h1>}
            <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: post.imageUrl ? 12 : 20 }}>{post.body}</p>
            {post.imageUrl && (
              <div style={{ marginBottom: 20, borderRadius: 14, overflow: 'hidden', maxHeight: 450, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <img src={post.imageUrl} alt="" style={{ width: '100%', maxHeight: 450, objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              {REACTIONS.map(({ key, label, Icon, color }) => {
                const count = Object.values(post.reactionsData || {}).filter(v => v === key).length;
                const active = post.reactionsData?.[currentUser?.uid || ''] === key;
                return (
                  <button key={key} onClick={e => onReact(e, post, key)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: active ? `${color}20` : '#f8fafc',
                    border: `1px solid ${active ? color + '40' : '#e2e8f0'}`, borderRadius: 999,
                    padding: '6px 14px', cursor: 'pointer', color: active ? color : '#64748b',
                    fontWeight: active ? 700 : 500, fontSize: '0.88rem', transition: 'all 0.2s'
                  }}>
                    <Icon size={15} color={active ? color : '#64748b'} fill={active && key === 'heart' ? color : 'none'} />
                    <span>{label}</span>
                    {count > 0 && <span>({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {currentUser && !currentUser.isAnonymous ? (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {commentImageUrl && (
                <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={commentImageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setCommentImageUrl('')} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}>
                    <X size={12} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, overflow: 'hidden' }}>
                  {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="pp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userProfile?.displayName || currentUser.displayName || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    placeholder="Yanıtla..." value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                    style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', fontSize: '0.95rem', outline: 'none', color: '#0f172a' }}
                  />
                  <label style={{ background: '#f1f5f9', padding: '10px 12px', borderRadius: 12, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }} title="Görsel ekle">
                    {uploadingImage ? <Loader size={16} className="animate-spin" /> : <Camera size={16} />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                  </label>
                  <button onClick={handleSubmit} disabled={uploadingImage || (!text.trim() && !commentImageUrl)} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, padding: '10px 16px', cursor: (text.trim() || commentImageUrl) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', opacity: (!text.trim() && !commentImageUrl) ? 0.5 : 1 }}>
                    <Send size={16} />
                  </button>
                </div>
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
                      {c.authorIsPsychologist && !c.authorHideBadge && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          background: 'rgba(212, 175, 55, 0.12)',
                          color: '#926100',
                          border: '1px solid rgba(212, 175, 55, 0.45)',
                          padding: '1px 7px',
                          borderRadius: 999,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                        }}>
                          <CheckCircle size={9} color="#926100" />
                          <span>Psikolog</span>
                        </span>
                      )}
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
                    {c.text && <p style={{ color: '#334155', fontSize: '0.93rem', lineHeight: 1.5, margin: 0 }}>{c.text}</p>}
                    {c.imageUrl && (
                      <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', maxHeight: 250, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <img src={c.imageUrl} alt="" style={{ width: '100%', maxHeight: 250, objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {[
                        { key: 'heart', Icon: Heart, color: '#ef4444' },
                        { key: 'lightbulb', Icon: Lightbulb, color: '#eab308' }
                      ].map(({ key, Icon, color }) => {
                        const count = Object.values(c.reactionsData || {}).filter(v => v === key).length;
                        const active = c.reactionsData?.[currentUser?.uid || ''] === key;
                        return (
                          <button key={key} onClick={e => onCommentReact(e, c, key)} style={{
                            background: active ? `${color}15` : 'none', border: 'none', cursor: 'pointer', color: active ? color : '#94a3b8',
                            fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6
                          }}>
                            <Icon size={14} color={active ? color : '#94a3b8'} fill={active && key === 'heart' ? color : 'none'} />
                            {count > 0 && <span>{count}</span>}
                          </button>
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
