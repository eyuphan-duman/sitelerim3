'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Edit3, Trash2, Plus, Clock, Tag, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div style={{ height: 400, background: '#f8f9fa', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', borderRadius: 8 }}>Editör yükleniyor...</div>
});

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (t: string, n: number) => { if (t.length <= n) return t; const s = t.slice(0, n); const l = s.lastIndexOf(' '); return (l === -1 ? s : s.slice(0, l)) + '...'; };

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];


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
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: 24 }}>{selectedPost.title}</h1>
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
        <div style={{ maxWidth: 850, margin: '0 auto', padding: '64px 24px 120px' }}>
          <div
            className="yz-detail-content"
            style={{ 
              fontFamily: 'Montserrat, sans-serif', 
              fontSize: '1.1rem', 
              lineHeight: '1.8', 
              color: '#1f2937', 
              textAlign: 'left',
              wordBreak: 'normal',
              overflowWrap: 'break-word',
              hyphens: 'none'
            }}
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
            <button onClick={() => setShowEditor(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={20} /></button>
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

          <div className="editor-wrapper" style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <RichTextEditor 
              value={editorContent}
              onChange={setEditorContent}
              placeholder="Düşüncelerinizi buraya dökün..."
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 40 }}>
            {posts.map(p => {
              const preview = p.excerpt || truncate(stripHtml(p.content || ''), 160);
              return (
                <div 
                  key={p.id} 
                  onClick={() => openPost(p.id)} 
                  className="post-card" 
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: 'white',
                    borderRadius: 20, 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    border: '1px solid #f1f5f9',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                >
                  {/* Card Header (Image or Accent) */}
                  <div style={{ height: 180, background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle at 70% 30%, var(--gold) 0%, transparent 70%)' }} />
                    <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
                      {p.category && (
                        <span style={{ 
                          background: 'var(--gold)', 
                          color: 'var(--navy)', 
                          padding: '4px 12px', 
                          borderRadius: 4, 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          letterSpacing: '0.1em', 
                          textTransform: 'uppercase' 
                        }}>{p.category}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div style={{ padding: '28px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ 
                      fontFamily: 'Montserrat, sans-serif', 
                      color: 'var(--navy)', 
                      fontSize: '1.25rem', 
                      fontWeight: 700, 
                      lineHeight: 1.3,
                      marginBottom: 14,
                      wordBreak: 'normal',
                      overflowWrap: 'break-word'
                    }}>{p.title}</h3>
                    
                    <p style={{ 
                      fontFamily: 'Montserrat, sans-serif', 
                      color: '#64748b', 
                      fontSize: '0.95rem', 
                      lineHeight: 1.6, 
                      marginBottom: 20, 
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      wordBreak: 'normal',
                      overflowWrap: 'break-word'
                    }}>{preview}</p>
                    
                    <div style={{ 
                      marginTop: 'auto',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      paddingTop: 16,
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                        {p.date ? format(new Date(p.date), 'd MMM yyyy', { locale: tr }) : ''}
                      </span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ color: 'var(--gold-dim)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>İncele →</span>
                        {isAdmin && (
                          <button 
                            onClick={e => deletePost(p.id, e)} 
                            style={{ background: '#fff1f1', color: '#ef4444', border: '1px solid #fee2e2', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
