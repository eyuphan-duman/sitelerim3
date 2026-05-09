'use client';

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
  MessageSquare, Send, User, X, Check
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, 4, false] }],
    [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: ['', 'center'] }],
    ['blockquote', 'link', 'image'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'align',
  'blockquote', 'link', 'image',
];

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
    if (!confirm('Bu makaleyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'articles', id));
      toast.success('Makale silindi.');
      router.push('/yazilarim');
    } catch { toast.error('Silme başarısız.'); }
  };

  const handleUpdate = async () => {
    if (!editForm.title.trim()) { toast.error('Başlık zorunludur.'); return; }
    if (!editForm.content || editForm.content === '<p><br></p>') { toast.error('İçerik zorunludur.'); return; }
    setSaving(true);
    try {
      const strip = (h: string) => h.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();
      const raw = strip(editForm.content);
      const excerpt = raw.length > 220 ? raw.slice(0, 220) + '…' : raw;
      await updateDoc(doc(db, 'articles', id), { ...editForm, excerpt });
      setArticle((a: any) => ({ ...a, ...editForm, excerpt }));
      setEditing(false);
      toast.success('Makale güncellendi!');
    } catch { toast.error('Güncelleme başarısız.'); }
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
          <span className="yz-editor-label">Makaleyi Düzenle</span>
          <button onClick={handleUpdate} disabled={saving} className="yz-editor-save">
            <Check size={18} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
        <div className="yz-editor-body">
          <input
            className="yz-editor-title-input"
            value={editForm.title}
            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Makale başlığı…"
          />
          <div className="yz-editor-row">
            <input
              className="yz-editor-field"
              value={editForm.category}
              onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Kategori"
            />
            <input
              className="yz-editor-field"
              value={editForm.featuredImage}
              onChange={e => setEditForm(f => ({ ...f, featuredImage: e.target.value }))}
              placeholder="Kapak görseli URL (opsiyonel)"
            />
          </div>
          <div className="yz-editor-quill">
            <ReactQuill
              theme="snow"
              value={editForm.content}
              onChange={val => setEditForm(f => ({ ...f, content: val }))}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
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
      {/* ── HERO ── */}
      <header className="yz-detail-hero">
        <div className="yz-detail-hero-inner">
          <Link href="/yazilarim" className="yz-detail-back">
            <ArrowLeft size={16} /> Tüm Yazılar
          </Link>

          <div className="yz-detail-meta">
            {article.category && (
              <span className="yz-detail-category"><Tag size={13} />{article.category}</span>
            )}
            {dateStr && (
              <span className="yz-detail-date"><Calendar size={13} />{dateStr}</span>
            )}
          </div>

          <h1 className="yz-detail-title">{article.title}</h1>

          {/* Admin controls */}
          {isAdmin && (
            <div className="yz-detail-admin-bar">
              <button onClick={() => setEditing(true)} className="yz-admin-edit-btn">
                <Edit3 size={15} /> Düzenle
              </button>
              <button onClick={handleDelete} className="yz-admin-delete-btn">
                <Trash2 size={15} /> Sil
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── COVER IMAGE ── */}
      {article.featuredImage && (
        <div className="yz-detail-cover">
          <img src={article.featuredImage} alt={article.title} />
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="yz-detail-content-wrap">
        <div
          className="yz-detail-content"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />
      </div>

      {/* ── COMMENTS ── */}
      <section className="yz-comments">
        <div className="yz-comments-inner">
          <h3 className="yz-comments-title">
            <MessageSquare size={22} />
            Yorumlar
            <span className="yz-comments-count">{comments.length}</span>
          </h3>

          {/* Comment form */}
          {user ? (
            <form className="yz-comment-form" onSubmit={handleComment}>
              <div className="yz-comment-avatar">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="yz-comment-form-right">
                <textarea
                  className="yz-comment-textarea"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Düşüncelerinizi paylaşın…"
                  rows={3}
                  required
                />
                <button type="submit" disabled={postingComment} className="yz-comment-submit">
                  <Send size={16} />
                  {postingComment ? 'Gönderiliyor…' : 'Yorum Yap'}
                </button>
              </div>
            </form>
          ) : (
            <div className="yz-comment-login-prompt">
              Yorum yapmak için giriş yapmalısınız.
            </div>
          )}

          {/* Comment list */}
          <div className="yz-comment-list">
            {comments.length === 0 && (
              <p className="yz-no-comments">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="yz-comment-item">
                <div className="yz-comment-item-avatar"><User size={18} /></div>
                <div className="yz-comment-item-body">
                  <div className="yz-comment-item-header">
                    <strong className="yz-comment-username">{c.userName}</strong>
                    {c.createdAt && (
                      <span className="yz-comment-time">
                        {format(new Date(c.createdAt), 'd MMM yyyy, HH:mm', { locale: tr })}
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="yz-comment-delete"
                        title="Yorumu sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="yz-comment-text">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
