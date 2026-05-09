'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Edit3, Trash2, Plus, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (t: string, n: number) => { if (t.length <= n) return t; const s = t.slice(0, n); const l = s.lastIndexOf(' '); return (l === -1 ? s : s.slice(0, l)) + '...'; };

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

// Quill Modules configuration (Word-style, NO justify)
const quillModules = {
  toolbar: [
    [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
    [{ 'color': [] }, { 'background': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': ['', 'center', 'right'] }],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'font', 'size', 'color', 'background',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'align',
  'link', 'image'
];

export default function YazilarimClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('post');
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorCategory, setEditorCategory] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load single post when URL has ?post=ID
  useEffect(() => {
    if (!postId) { setSelectedPost(null); return; }
    const fetchPost = async () => {
      try {
        const d = await getDoc(doc(db, 'posts', postId));
        if (d.exists()) setSelectedPost({ id: d.id, ...d.data() });
        else { toast.error('Yazı bulunamadı.'); router.replace('/yazilarim'); }
      } catch { toast.error('Yüklenemedi.'); }
    };
    fetchPost();
  }, [postId]);

  const openPost = (id: string) => router.push(`/yazilarim?post=${id}`, { scroll: true });
  const closePost = () => router.push('/yazilarim', { scroll: true });

  // Editor functions
  const openNewEditor = () => {
    setEditingPost(null); setEditorTitle(''); setEditorCategory(''); setEditorContent('');
    setShowEditor(true);
  };

  const openEditEditor = (post: any) => {
    setEditingPost(post); setEditorTitle(post.title); setEditorCategory(post.category || '');
    setEditorContent(post.content || '');
    setShowEditor(true);
  };


  const handleSave = async () => {
    if (!editorTitle.trim()) { toast.error('Başlık zorunlu.'); return; }
    const content = editorContent;
    if (!content.trim() || content === '<p><br></p>') { toast.error('İçerik zorunlu.'); return; }
    setSubmitting(true);
    try {
      const excerpt = truncate(stripHtml(content), 200);
      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), { title: editorTitle, category: editorCategory, content, excerpt });
        toast.success('Yazı güncellendi!');
        if (selectedPost?.id === editingPost.id) setSelectedPost({ ...selectedPost, title: editorTitle, category: editorCategory, content, excerpt });
      } else {
        await addDoc(collection(db, 'posts'), { title: editorTitle, category: editorCategory, content, excerpt, likes: 0, commentCount: 0, createdAt: serverTimestamp(), date: new Date().toISOString() });
        toast.success('Yazı yayınlandı!');
      }
      setShowEditor(false);
    } catch { toast.error('Hata oluştu.'); }
    finally { setSubmitting(false); }
  };

  const deletePost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;
    try { await deleteDoc(doc(db, 'posts', id)); toast.success('Silindi.'); if (selectedPost?.id === id) closePost(); }
    catch { toast.error('Silinemedi.'); }
  };

  // ─── FULL PAGE ARTICLE VIEW ───
  if (selectedPost) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        {/* Article Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)', paddingTop: 140, paddingBottom: 64 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
            <button onClick={closePost} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: 28, letterSpacing: '0.04em' }}>
              <ArrowLeft size={16} /> TÜM YAZILAR
            </button>
            {selectedPost.category && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold-light)', padding: '5px 14px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid rgba(201,169,110,0.25)' }}>{selectedPost.category}</span>
              </div>
            )}
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 20 }}>{selectedPost.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                <Clock size={14} /> {selectedPost.date ? format(new Date(selectedPost.date), 'd MMMM yyyy', { locale: tr }) : ''}
              </span>
              {isAdmin && (
                <button onClick={() => openEditEditor(selectedPost)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(201,169,110,0.2)', color: 'var(--gold-light)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Edit3 size={14} /> Düzenle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px 120px' }}>
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: selectedPost.content || '' }}
          />
        </div>

        {/* Editor overlay */}
        {showEditor && renderEditor()}
      </div>
    );
  }

  // ─── EDITOR OVERLAY (FULL-PAGE) ───
  function renderEditor() {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Editor Top Bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setShowEditor(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 40, height: 40, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>✕</button>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>
              {editingPost ? 'Yazıyı Düzenle' : 'Yeni Yazı Oluştur'}
            </h2>
          </div>
          <button onClick={handleSave} disabled={submitting} className="btn-gold" style={{ padding: '12px 32px' }}>
            {submitting ? 'Kaydediliyor...' : editingPost ? 'Güncelle' : 'Yayınla'}
          </button>
        </div>

        {/* Editor Body */}
        <div style={{ maxWidth: 1000, width: '100%', margin: '40px auto', padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', gap: 16 }}>
             <input value={editorTitle} onChange={e => setEditorTitle(e.target.value)} placeholder="Yazı Başlığı" className="input-field" style={{ fontSize: '1.4rem', fontWeight: 700, padding: '20px 24px', flex: 2 }} />
             <input value={editorCategory} onChange={e => setEditorCategory(e.target.value)} placeholder="Kategori" className="input-field" style={{ fontSize: '1.1rem', padding: '20px 24px', flex: 1 }} />
          </div>

          <div className="quill-editor-container" style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
            <ReactQuill 
              theme="snow"
              value={editorContent}
              onChange={setEditorContent}
              modules={quillModules}
              formats={quillFormats}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              className="custom-quill"
            />
          </div>

        </div>
      </div>
    );
  }

  // ─── ARTICLES LIST VIEW ───
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)', paddingTop: 160, paddingBottom: 72 }}>
        <div className="container-main" style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: 20, justifyContent: 'center' }}>Derinlemesine İncelemeler</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', fontWeight: 700, color: 'white', marginBottom: 16 }}>Yazılarım</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 560, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Psikoloji, varoluşçuluk ve psikanaliz üzerine derinlemesine yazılar ve incelemeler.
          </p>
          {isAdmin && (
            <button onClick={openNewEditor} style={{ marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--gold)', color: 'var(--navy)', padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
              <Plus size={16} /> Yeni Yazı Oluştur
            </button>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="container-main" style={{ padding: '64px 40px 120px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '80px 0' }}>Yükleniyor...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '80px 0', fontStyle: 'italic' }}>Henüz yayınlanan bir yazı bulunmuyor.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 32 }}>
            {posts.map(p => {
              const preview = p.excerpt || truncate(stripHtml(p.content || ''), 160);
              return (
                <div key={p.id} onClick={() => openPost(p.id)} className="post-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', border: 'none', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                  {/* Card Header */}
                  <div style={{ padding: '32px 28px 20px', background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)', borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden', minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(201,169,110,0.08)' }} />
                    {p.category && <span style={{ alignSelf: 'flex-start', background: 'rgba(201,169,110,0.15)', color: 'var(--gold-light)', padding: '4px 12px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{p.category}</span>}
                    <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'white', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 }}>{p.title}</h3>
                  </div>
                  {/* Card Body */}
                  <div style={{ padding: '20px 28px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <p style={{ fontFamily: 'Crimson Text, serif', color: '#64748b', fontSize: '1rem', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{preview}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{p.date ? format(new Date(p.date), 'd MMM yyyy', { locale: tr }) : ''}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: 'var(--gold-dim)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Devamını Oku →</span>
                        {isAdmin && <button onClick={e => deletePost(p.id, e)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor overlay */}
      {showEditor && renderEditor()}
    </div>
  );
}
