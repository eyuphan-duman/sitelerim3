'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Folder, Edit3, Trash2, MessageSquare, Send, User, Calendar } from 'lucide-react';
import Link from 'next/link';

// Dynamic import for the editor to avoid SSR issues
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ 'header': [2, 3, 4, false] }, { 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': ['', 'center', 'right'] }],
    ['blockquote'],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'align',
  'blockquote', 'link', 'image'
];

export default function ArticleDetailClient({ initialArticle, id }: { initialArticle: any, id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'].includes(user?.email || '');
  
  const [article, setArticle] = useState(initialArticle);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', category: '', featuredImage: '', content: '' });
  const [updating, setUpdating] = useState(false);

  // Fetch comments
  useEffect(() => {
    const q = query(collection(db, 'articles', id, 'comments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id]);

  const handleDelete = async () => {
    if (confirm('Bu makaleyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await deleteDoc(doc(db, 'articles', id));
        toast.success('Makale başarıyla silindi.');
        router.push('/yazilarim');
      } catch (err) {
        toast.error('Silinirken bir hata oluştu.');
      }
    }
  };

  const handleEditOpen = () => {
    setEditForm({
      title: article.title,
      category: article.category || '',
      featuredImage: article.featuredImage || '',
      content: article.content || ''
    });
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error('Başlık ve içerik zorunludur.');
      return;
    }
    setUpdating(true);
    try {
      const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();
      const raw = stripHtml(editForm.content);
      const excerpt = raw.length > 200 ? raw.slice(0, 200) + '...' : raw;

      await updateDoc(doc(db, 'articles', id), {
        ...editForm,
        excerpt
      });
      setArticle({ ...article, ...editForm, excerpt });
      setIsEditing(false);
      toast.success('Makale başarıyla güncellendi.');
    } catch (err) {
      toast.error('Güncellenirken hata oluştu.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Yorum yapmak için giriş yapmalısınız.'); return; }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'articles', id, 'comments'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
        content: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
      toast.success('Yorumunuz paylaşıldı.');
    } catch (err) {
      toast.error('Yorum eklenirken hata oluştu.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Yorumu silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'articles', id, 'comments', commentId));
        toast.success('Yorum silindi.');
      } catch (err) {
        toast.error('Yorum silinirken hata oluştu.');
      }
    }
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#f8fafc] flex flex-col overflow-y-auto">
        {/* Editor Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-serif text-2xl font-bold text-[var(--navy)]">Makaleyi Düzenle</h2>
          </div>
          <button onClick={handleUpdate} disabled={updating} className="bg-[var(--gold)] hover:bg-[var(--gold-dim)] text-[var(--navy)] px-8 py-2.5 rounded-lg font-bold transition-colors shadow-sm">
            {updating ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>

        {/* Editor Body */}
        <div className="max-w-[1000px] w-full mx-auto py-10 px-6 flex flex-col gap-6 flex-1">
          <input 
            value={editForm.title} 
            onChange={e => setEditForm({...editForm, title: e.target.value})} 
            placeholder="Makale Başlığı" 
            className="w-full text-4xl font-serif font-bold text-[var(--navy)] bg-transparent border-none outline-none placeholder:text-gray-300"
          />
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kategori</label>
              <input 
                value={editForm.category} 
                onChange={e => setEditForm({...editForm, category: e.target.value})} 
                placeholder="Örn: Psikanaliz" 
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
            <div className="flex-[2]">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kapak Görseli URL</label>
              <input 
                value={editForm.featuredImage} 
                onChange={e => setEditForm({...editForm, featuredImage: e.target.value})} 
                placeholder="https://..." 
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-[600px] shadow-sm premium-editor">
            <ReactQuill 
              theme="snow"
              value={editForm.content}
              onChange={val => setEditForm({...editForm, content: val})}
              modules={quillModules}
              formats={quillFormats}
              className="flex-1 flex flex-col"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Article Header */}
      <div className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <Link href="/yazilarim" className="inline-flex items-center gap-2 text-[var(--gold-dim)] font-bold text-xs uppercase tracking-widest hover:text-[var(--gold)] transition-colors mb-10">
          <ArrowLeft size={16} /> Tüm Makaleler
        </Link>
        
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {article.category && (
            <span className="bg-[var(--navy)] text-[var(--gold)] text-xs font-bold px-3 py-1.5 rounded-md tracking-wider uppercase">
              {article.category}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-gray-400 text-sm font-semibold tracking-wide">
            <Clock size={16} />
            {article.createdAt ? format(new Date(article.createdAt.seconds ? article.createdAt.toDate() : article.createdAt), 'd MMMM yyyy', { locale: tr }) : ''}
          </span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--navy)] leading-[1.15] mb-8">
          {article.title}
        </h1>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-8">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Yönetici Kontrolleri:</span>
            <button onClick={handleEditOpen} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:text-[var(--navy)] hover:border-[var(--navy)] px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
              <Edit3 size={16} /> Düzenle
            </button>
            <button onClick={handleDelete} className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
              <Trash2 size={16} /> Makaleyi Sil
            </button>
          </div>
        )}
      </div>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="max-w-6xl mx-auto px-6 mb-16">
          <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl relative">
            <img src={article.featuredImage} alt={article.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <div 
          className="premium-article-content"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />
      </div>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Comments Section */}
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-10">
          <MessageSquare size={24} className="text-[var(--gold)]" />
          <h3 className="font-serif text-3xl font-bold text-[var(--navy)]">Yorumlar</h3>
          <span className="bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded-full text-sm">{comments.length}</span>
        </div>

        {user ? (
          <form onSubmit={handlePostComment} className="mb-12 bg-[#f8fafc] p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[var(--navy)] text-[var(--gold)] flex items-center justify-center font-bold text-xs">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="font-semibold text-gray-700">{user.displayName || user.email?.split('@')[0]}</span>
            </div>
            <textarea 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Düşüncelerinizi paylaşın..."
              className="w-full bg-white border border-gray-200 rounded-xl p-4 min-h-[120px] outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-all resize-y mb-4"
              required
            />
            <div className="flex justify-end">
              <button disabled={submittingComment} type="submit" className="flex items-center gap-2 bg-[var(--navy)] hover:bg-[#1e293b] text-white px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-md">
                <Send size={16} /> {submittingComment ? 'Gönderiliyor...' : 'Yorum Yap'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-12 bg-[#f8fafc] p-8 rounded-2xl border border-gray-100 text-center">
            <p className="text-gray-500 mb-4">Yorum yapabilmek için giriş yapmalısınız.</p>
            <button className="bg-[var(--gold)] text-[var(--navy)] px-6 py-2.5 rounded-lg font-bold shadow-sm">Giriş Yap / Üye Ol</button>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[var(--navy)]">{comment.userName}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {comment.createdAt ? format(new Date(comment.createdAt.seconds ? comment.createdAt.toDate() : comment.createdAt), 'd MMM yyyy, HH:mm', { locale: tr }) : 'Az önce'}
                    </span>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteComment(comment.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-10 text-gray-400 italic">Henüz yorum yapılmamış. İlk yorumu siz yapın.</div>
          )}
        </div>
      </div>
    </div>
  );
}
