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
              <button onClick={() => setEditing(true)} className="yz-admin-edit-btn-min">
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
        <div className="yz-detail-content-minimal">
          <div
            className="yz-detail-content"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
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
