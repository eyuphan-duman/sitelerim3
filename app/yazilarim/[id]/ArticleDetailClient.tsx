'use client';

import { safeHtml } from '@/lib/sanitize';
import { uploadFetch } from '@/lib/notify';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  doc, deleteDoc, updateDoc,
  collection, addDoc, serverTimestamp, query, orderBy, onSnapshot
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Calendar, Tag, Edit3, Trash2,
  MessageSquare, Send, User, X, Check,
  Share2, Link2, MessageCircle, Upload
} from 'lucide-react';
import { LOCAL_ARTICLES } from '@/data/local-articles';
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, background: '#f8f9fa', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', borderRadius: 8 }}>Editör yükleniyor...</div>
});

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];


interface Props {
  id: string;
  initialArticle: any;
}

export default function ArticleDetailClient({ id, initialArticle }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  const [article, setArticle] = useState<any>(initialArticle);
  
  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    title: initialArticle?.title || '', 
    category: initialArticle?.category || '', 
    featuredImage: initialArticle?.featuredImage || '', 
    content: initialArticle?.content || '' 
  });
  const [saving, setSaving] = useState(false);

  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Comments realtime
  useEffect(() => {
    const q = query(collection(db, 'articles', id, 'comments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
        };
      }));
    });
    return () => unsub();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Bu yazıyı kalıcı olarak silmek istediğinize emin misiniz?')) return;
    
    // Check if it's a local article
    const isLocal = LOCAL_ARTICLES.some(a => a.id === id);
    if (isLocal) {
      toast.error('Bu yazı yerel bir dosyadır, veritabanından silinemez.');
      return;
    }

    try {
      await Promise.all([
        deleteDoc(doc(db, 'articles', id)),
        // Try to delete from posts as well (they might have different IDs but let's try or handle separately)
        deleteDoc(doc(db, 'posts', id))
      ]);
      toast.success('Yazı silindi.');
      router.push('/yazilarim');
    } catch { toast.error('Silme başarısız.'); }
  };

  const handleUpdate = async () => {
    if (!editForm.title.trim()) { toast.error('Başlık zorunludur.'); return; }
    if (!editForm.content || editForm.content === '<p><br></p>') { toast.error('İçerik zorunludur.'); return; }
    
    // Check if it's a local article
    const isLocal = LOCAL_ARTICLES.some(a => a.id === id);
    if (isLocal) {
      toast.error('Bu yazı yerel bir dosyadır. Değişiklikler kalıcı olmaz. Lütfen veritabanına taşıyın.');
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const strip = (h: string) => h.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();
      const raw = strip(editForm.content);
      const excerpt = raw.length > 220 ? raw.slice(0, 220) + '…' : raw;
      
      const updateData = { ...editForm, excerpt };
      
      await Promise.all([
        updateDoc(doc(db, 'articles', id), updateData),
        // If posts use the same ID, update it too
        updateDoc(doc(db, 'posts', id), {
          title: editForm.title,
          category: editForm.category,
          content: editForm.content,
          excerpt: excerpt
        }).catch(() => {/* Ignore if post ID doesn't match */})
      ]);

      setArticle((a: any) => ({ ...a, ...editForm, excerpt }));
      setEditing(false);
      toast.success('Yazı güncellendi!');
    } catch (e) { 
      console.error(e);
      toast.error('Güncelleme başarısız.'); 
    }
    finally { setSaving(false); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Yorum için giriş yapmalısınız.'); return; }
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      await addDoc(collection(db, 'articles', id, 'comments'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
        content: commentText,
        createdAt: serverTimestamp(),
      });
      setCommentText('');
      toast.success('Yorum paylaşıldı!');
    } catch { toast.error('Yorum eklenemedi.'); }
    finally { setPostingComment(false); }
  };

  const handleDeleteComment = async (cid: string) => {
    if (!confirm('Yorumu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'articles', id, 'comments', cid));
      toast.success('Yorum silindi.');
    } catch { toast.error('Silme başarısız.'); }
  };

  // ── EDITOR MODE ──
  if (editing) {
    return (
      <div className="yz-editor-overlay">
        <div className="yz-editor-topbar">
          <button onClick={() => setEditing(false)} className="yz-editor-back">
            <X size={20} /> İptal
          </button>
          <span className="yz-editor-label">Yazıyı Düzenle</span>
          <button onClick={handleUpdate} disabled={saving} className="yz-editor-save">
            <Check size={18} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
        <div className="yz-editor-body">
          <input
            className="yz-editor-title-input"
            value={editForm.title}
            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Yazı başlığı…"
          />
          <div className="yz-editor-row" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              className="yz-editor-field"
              style={{ flex: 1 }}
              value={editForm.category}
              onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Kategori"
            />
            <div style={{ flex: 2, display: 'flex', gap: 8 }}>
              <input
                className="yz-editor-field"
                style={{ flex: 1 }}
                value={editForm.featuredImage}
                onChange={e => setEditForm(f => ({ ...f, featuredImage: e.target.value }))}
                placeholder="Kapak görseli URL veya dosya yükleyin"
              />
              <label style={{ background: '#2563eb', color: 'white', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }} title="Cloudinary'ye görsel yükle">
                <Upload size={16} /> Yükle
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const t = toast.loading('Kapak görseli yükleniyor…');
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('folder', 'manav-platform/covers');
                    const res = await uploadFetch({ method: 'POST', body: fd });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error);
                    setEditForm(prev => ({ ...prev, featuredImage: data.url }));
                    toast.success('Kapak görseli yüklendi!', { id: t });
                  } catch (err: any) {
                    toast.error('Hata: ' + err.message, { id: t });
                  }
                }} />
              </label>
            </div>
          </div>
          <div className="editor-container" style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <RichTextEditor
              value={editForm.content}
              onChange={val => setEditForm(f => ({ ...f, content: val }))}
              placeholder="Yazı içeriğini buraya yazın..."
            />
          </div>
        </div>
      </div>
    );
  }

  const dateStr = article.createdAt
    ? format(new Date(article.createdAt), 'd MMMM yyyy', { locale: tr })
    : '';

  // ── ARTICLE VIEW ──
  return (
    <div className="yz-detail-page">
      <div className="yz-detail-container">
        {/* ── BACK BUTTON ── */}
        <Link href="/yazilarim" className="yz-detail-back-minimal">
          <ArrowLeft size={16} /> Yazılara Dön
        </Link>

        {/* ── HEADER ── */}
        <header className="yz-detail-header-minimal">
          <h1 className="yz-detail-title-minimal">{article.title}</h1>
          
          <div className="yz-detail-meta-minimal">
            {article.category && (
              <span className="yz-detail-meta-item">
                <Tag size={14} /> {article.category}
              </span>
            )}
            {dateStr && (
              <span className="yz-detail-meta-item">
                <Calendar size={14} /> {dateStr}
              </span>
            )}
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="yz-detail-admin-bar-minimal">
              <button onClick={() => {
                if (LOCAL_ARTICLES.some(a => a.id === id)) {
                  toast.error('Bu yazı yerel bir dosyadır ve buradan düzenlenemez.');
                } else {
                  setEditing(true);
                }
              }} className="yz-admin-edit-btn-min">
                <Edit3 size={14} /> Düzenle
              </button>
              <button onClick={handleDelete} className="yz-admin-delete-btn-min">
                <Trash2 size={14} /> Sil
              </button>
            </div>
          )}
        </header>

        {/* ── COVER IMAGE ── */}
        {article.featuredImage && (
          <div className="yz-detail-cover-minimal">
            <img src={article.featuredImage} alt={article.title} />
          </div>
        )}

        {/* ── CONTENT ── */}
        <div className="yz-detail-content-wrapper">
          <div
            className="yz-detail-content ql-editor-view"
            dangerouslySetInnerHTML={{ __html: safeHtml(article.content || '') }}
          />
        </div>

        {/* ── SHARE BUTTONS ── */}
        <div className="yz-detail-share-bar">
          <span className="yz-share-label">Yazıyı Paylaş:</span>
          <div className="yz-share-actions">
            <button 
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.href)}`, '_blank')}
              className="yz-share-btn wa" title="WhatsApp'ta Paylaş"
            >
              <MessageCircle size={18} />
            </button>
            <button 
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="yz-share-btn tw" title="Twitter'da Paylaş"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button 
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="yz-share-btn fb" title="Facebook'ta Paylaş"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Bağlantı kopyalandı!');
              }}
              className="yz-share-btn copy" title="Bağlantıyı Kopyala"
            >
              <Link2 size={18} />
            </button>
          </div>
        </div>

        {/* ── COMMENTS ── */}
        <section className="yz-comments-minimal">
          <h3 className="yz-comments-title">
            <MessageSquare size={20} />
            Yorumlar ({comments.length})
          </h3>

          {user ? (
            <form className="yz-comment-form-minimal" onSubmit={handleComment}>
              <textarea
                className="yz-comment-textarea-minimal"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Yorumunuzu buraya yazın..."
                rows={3}
                required
              />
              <button type="submit" disabled={postingComment} className="yz-comment-submit-minimal">
                <Send size={14} /> {postingComment ? 'Gönderiliyor...' : 'Paylaş'}
              </button>
            </form>
          ) : (
            <div className="yz-comment-login-prompt">
              Yorum yapmak için giriş yapmalısınız.
            </div>
          )}

          <div className="yz-comment-list-minimal">
            {comments.map(c => (
              <div key={c.id} className="yz-comment-item-minimal">
                <div className="yz-comment-header-minimal">
                  <strong>{c.userName}</strong>
                  {c.createdAt && (
                    <span>{format(new Date(c.createdAt), 'd MMM yyyy, HH:mm', { locale: tr })}</span>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDeleteComment(c.id)} className="yz-comment-del-min">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p>{c.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
