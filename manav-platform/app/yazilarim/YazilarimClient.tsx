'use client';
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Heart, ArrowRight, X, Send, Filter, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';


interface Comment { id: string; authorName: string; text: string; createdAt: Date; uid: string; }
interface Post { id: string; title: string; category: string; excerpt: string; content: string; date: string; likes: number; commentCount: number; createdAt: Date; }

const CATEGORIES = ['Tümü', 'Psikanaliz', 'Varoluşçuluk', 'Günlük Yaşam', 'İlişkiler', 'Rüyalar'];

export default function YazilarimClient() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [active, setActive] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loadingC, setLoadingC] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('Tümü');
  const [showPostForm, setShowPostForm] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({ title: '', category: 'Tümü', excerpt: '', content: '' });

  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Post[]);
    });
    return () => unsub();
  }, []);

  const filtered = filter === 'Tümü' ? posts : posts.filter(p => p.category === filter);

  const openPost = (post: Post) => {
    router.replace(`/yazilarim?post=${post.id}`, { scroll: false });
  };

  const closePost = () => {
    setActive(null);
    router.replace('/yazilarim', { scroll: false });
  };

  // Sync active post with URL
  useEffect(() => {
    if (posts.length === 0) return;
    const postId = searchParams.get('post');
    if (postId) {
      if (!active || active.id !== postId) {
        const found = posts.find(p => p.id === postId);
        if (found) {
          setActive(found);
          setText('');
          setLoadingC(true);
        }
      }
    } else {
      setActive(null);
    }
  }, [posts, searchParams, active?.id]);

  // Fetch comments when active post changes
  useEffect(() => {
    if (!active) {
      setComments([]);
      return;
    }
    // Scroll to top of modal when opening a new post
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.scrollTop = 0;

    const q = query(collection(db, 'posts', active.id, 'comments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })) as Comment[]);
      setLoadingC(false);
    });
    return () => unsub();
  }, [active?.id]);

  const submit = async () => {
    if (!text.trim() || !active || !user) return;
    if (user.isAnonymous) { toast.error('Yorum yapmak için üye olmalısınız.'); return; }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'posts', active.id, 'comments'), { authorName: user.displayName || user.email?.split('@')[0] || 'Kullanıcı', text: text.trim(), createdAt: serverTimestamp(), uid: user.uid });
      await updateDoc(doc(db, 'posts', active.id), { commentCount: increment(1) });
      setText(''); toast.success('Yorumunuz eklendi!');
    } catch { toast.error('Yorum eklenemedi.'); }
    finally { setSubmitting(false); }
  };

  const deleteComment = async (commentId: string) => {
    if (!active) return;
    if (confirm('Bu yorumu silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'posts', active.id, 'comments', commentId));
        await updateDoc(doc(db, 'posts', active.id), { commentCount: increment(-1) });
        toast.success('Yorum silindi.');
      } catch (err: any) {
        toast.error('Silme hatası: ' + (err.code || err.message));
      }
    }
  };

  const handleDeletePost = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bu yazıyı kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      toast.success('Yazı silindi.');
      if (active?.id === id) setActive(null);
    } catch (err: any) {
      toast.error('Silme hatası: ' + err.message);
    }
  };

  const editPost = (post: Post, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditPostId(post.id);
    setPostForm({ title: post.title, category: post.category, excerpt: post.excerpt, content: post.content });
    setShowPostForm(true);
    setActive(null);
    router.replace('/yazilarim', { scroll: false });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleSharePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim()) {
      toast.error('Lütfen bir başlık giriniz.');
      return;
    }
    setSubmitting(true);
    try {
      if (editPostId) {
        await updateDoc(doc(db, 'posts', editPostId), { ...postForm });
        toast.success('Yazı güncellendi!');
      } else {
        await addDoc(collection(db, 'posts'), { ...postForm, likes: 0, commentCount: 0, createdAt: serverTimestamp(), date: new Date().toISOString() });
        toast.success('Yazı paylaşıldı!');
      }
      setShowPostForm(false);
      setEditPostId(null);
      setPostForm({ title: '', category: 'Tümü', excerpt: '', content: '' });
    } catch { toast.error('Hata oluştu.'); }
    finally { setSubmitting(false); }
  };

  const stripHtml = (html: string) => {
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const heroPost = filtered[0];
  const otherPosts = filtered.slice(1);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      {/* Newspaper Header */}
      <div style={{ background: 'white', padding: '60px 0 20px', borderBottom: '2px solid #000' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <Link href="/forum/profil/furkanmanav" style={{ textDecoration: 'none' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 20, cursor: 'pointer' }} className="hover:text-black transition-colors">Psikolog Furkan Manav</div>
          </Link>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, color: '#111', lineHeight: 1, letterSpacing: '-0.02em', borderBottom: '1px solid #eaeaea', paddingBottom: 24, marginBottom: 16 }}>
            YAZILARIM
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: filter === c ? 700 : 500, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.2s', padding: '4px 8px', color: filter === c ? '#000' : '#888', borderBottom: filter === c ? '2px solid #000' : '2px solid transparent'
              }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 80px' }}>
        {ADMIN_EMAILS.includes(user?.email || '') && (
          <div style={{ marginBottom: 40 }}>
            {!showPostForm ? (
              <button onClick={() => { setShowPostForm(true); setEditPostId(null); setPostForm({ title: '', category: 'Tümü', excerpt: '', content: '' }); }} className="btn-dark-outline" style={{ borderRadius: 0, padding: '12px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                Yazı Paylaş
              </button>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #ddd', padding: 32 }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: 24 }}>{editPostId ? 'Yazıyı Düzenle' : 'Yeni Yazı Paylaş'}</h3>
                <form onSubmit={handleSharePost} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <input placeholder="Başlık" className="input-field" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
                  <select className="input-field" value={postForm.category} onChange={e => setPostForm({ ...postForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea placeholder="Kısa Açıklama (Opsiyonel)" className="input-field" value={postForm.excerpt} onChange={e => setPostForm({ ...postForm, excerpt: e.target.value })} style={{ minHeight: 80, resize: 'none' }} />
                  
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: 8, display: 'block' }}>Makale İçeriği</label>
                    <RichTextEditor 
                      value={postForm.content} 
                      onChange={(content) => setPostForm({ ...postForm, content })} 
                      placeholder="Makalenizi buraya yazın..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="submit" disabled={submitting} className="btn-dark-outline" style={{ borderRadius: 0, padding: '12px 32px', fontWeight: 700, textTransform: 'uppercase', background: '#111', color: '#fff' }}>
                      {submitting ? 'Kaydediliyor...' : (editPostId ? 'Güncelle' : 'Paylaş')}
                    </button>
                    <button type="button" onClick={() => setShowPostForm(false)} className="btn-dark-outline" style={{ borderRadius: 0, padding: '12px 32px', fontWeight: 700, textTransform: 'uppercase' }}>
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#888', fontStyle: 'italic', fontFamily: 'Playfair Display, serif', fontSize: '1.2rem' }}>
            Bu kategoride yayınlanmış eser bulunmamaktadır.
          </div>
        ) : (
          <div className="yazilarim-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 48 }}>
            
            {/* LATEST / HERO POST (Left Col) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
              {heroPost && (
                <article style={{ borderBottom: '1px solid #ddd', paddingBottom: 40, cursor: 'pointer' }} onClick={() => openPost(heroPost)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-dim)' }}>Manşet • {heroPost.category}</span>
                    <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>{format(new Date(heroPost.date), 'dd MMMM yyyy', { locale: tr })}</span>
                  </div>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#111', lineHeight: 1.1, marginBottom: 20 }}>
                    {heroPost.title}
                  </h2>
                  <p className="crimson" style={{ fontSize: '1.15rem', color: '#444', lineHeight: 1.7, marginBottom: 24 }}>
                    {heroPost.excerpt || (heroPost.content ? stripHtml(heroPost.content).slice(0, 200) + '...' : '')}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn-dark-outline" style={{ border: '1px solid #000', color: '#000', borderRadius: 0, padding: '8px 24px', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Makaleyi Oku</button>
                    {ADMIN_EMAILS.includes(user?.email || '') && (
                      <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 10 }}>
                        <button 
                          onClick={(e) => editPost(heroPost, e)} 
                          style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', background: 'var(--gold-dim)', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 4 }}
                        >
                          Düzenle
                        </button>
                        <button 
                          onClick={(e) => handleDeletePost(heroPost.id, e)} 
                          style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', background: '#ff4d4f', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 4 }}
                        >
                          Sil
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, color: '#888', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Heart size={14}/> {heroPost.likes}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MessageCircle size={14}/> {heroPost.commentCount}</span>
                    </div>
                  </div>
                </article>
              )}

              {/* Grid of older posts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '40px 32px' }}>
                {otherPosts.map(post => (
                  <article key={post.id} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => openPost(post)}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#777', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{post.category}</span>
                      {ADMIN_EMAILS.includes(user?.email || '') && (
                        <div style={{ display: 'flex', gap: 6, position: 'relative', zIndex: 10 }}>
                          <button 
                            onClick={(e) => editPost(post, e)} 
                            style={{ color: 'white', fontWeight: 700, background: 'var(--gold-dim)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: '0.65rem' }}
                          >
                            DÜZENLE
                          </button>
                          <button 
                            onClick={(e) => handleDeletePost(post.id, e)} 
                            style={{ color: 'white', fontWeight: 700, background: '#ff4d4f', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: '0.65rem' }}
                          >
                            SİL
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#111', lineHeight: 1.25, marginBottom: 12 }}>
                      {post.title}
                    </h3>
                    <p className="crimson" style={{ fontSize: '1rem', color: '#555', lineHeight: 1.6, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.excerpt || (post.content ? stripHtml(post.content).slice(0, 150) + '...' : '')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eaeaea', paddingTop: 12, fontSize: '0.75rem', color: '#999' }}>
                      <span style={{ fontStyle: 'italic' }}>{format(new Date(post.date), 'd MMM yyyy', { locale: tr })}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#444' }}>Oku <ArrowRight size={10}/></span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* SIDEBAR (Right Col) */}
            <aside style={{ borderLeft: '1px solid #ddd', paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 48 }}>
              <div>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 800, color: '#111', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Editörün Seçimi</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                   {posts.slice(0,3).map((p,i) => (
                     <div key={p.id} style={{ display: 'flex', gap: 16, cursor: 'pointer' }} onClick={() => openPost(p)}>
                       <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 900, color: '#ddd', lineHeight: 1 }}>{i+1}</div>
                       <div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111', lineHeight: 1.4 }}>{p.title}</div>
                         <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 4, textTransform: 'uppercase' }}>{p.category}</div>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {active && (
        <div className="modal-backdrop" onClick={closePost}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* Modal Header/Toolbar */}
            <div style={{ 
              position: 'sticky', 
              top: 0, 
              background: 'white', 
              borderBottom: '1px solid #f0f0f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 24px', 
              paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
              zIndex: 1000 
            }}>
              <button 
                onClick={(e) => { e.stopPropagation(); closePost(); }} 
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f5f7', border: 'none', borderRadius: '40px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#111' }}
              >
                <X size={18}/> KAPAT
              </button>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {ADMIN_EMAILS.includes(user?.email || '') && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); editPost(active!); }} 
                      style={{ background: 'var(--gold-dim)', color: '#fff', border: 'none', borderRadius: '40px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      DÜZENLE
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePost(active!.id); }} 
                      style={{ background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '40px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      SİL
                    </button>
                  </div>
                )}
                <div style={{ display: 'none', gap: 12, color: '#888', fontSize: '0.75rem', fontWeight: 600 }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={14}/> {active.likes}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14}/> {active.commentCount}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '40px 24px 80px' }}>
              <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span className="tag-gold" style={{ fontSize: '0.7rem' }}>{active.category}</span>
                  <span style={{ fontSize: '0.8rem', color: '#999' }}>{format(new Date(active.date), 'dd MMMM yyyy', { locale: tr })}</span>
                </div>

                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 900, color: '#111', lineHeight: 1.2, marginBottom: 32 }}>
                  {active.title}
                </h2>

                <div className="article-content" dangerouslySetInnerHTML={{ __html: active.content }} />
                
                {/* Comments Section */}
                <div style={{ marginTop: 80, paddingTop: 40, borderTop: '1px solid #f0f0f0' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 800, marginBottom: 32 }}>Yorumlar ({comments.length})</h3>
                  
                  {/* Comment Form */}
                  {user ? (
                    <div style={{ marginBottom: 40, background: '#f9f9fb', padding: 24, borderRadius: 12 }}>
                      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Düşüncelerinizi paylaşın..." style={{ width: '100%', minHeight: 100, padding: 16, border: '1px solid #ddd', borderRadius: 8, fontSize: '0.95rem', marginBottom: 12, resize: 'none' }} />
                      <button onClick={submit} disabled={submitting || !text.trim()} className="btn-dark" style={{ width: '100%', padding: '12px', borderRadius: 8, fontWeight: 700, background: '#111', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        {submitting ? 'Gönderiliyor...' : 'Yorum Yap'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 12, textAlign: 'center', marginBottom: 40 }}>
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>Yorum yapmak için giriş yapmalısınız.</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {loadingC ? <p>Yorumlar yükleniyor...</p> : comments.map(c => (
                      <div key={c.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block' }}>{c.authorName}</span>
                            <span style={{ fontSize: '0.75rem', color: '#999' }}>{format(c.createdAt, 'd MMM yyyy HH:mm', { locale: tr })}</span>
                          </div>
                          {(ADMIN_EMAILS.includes(user?.email || '') || user?.uid === c.uid) && (
                            <button onClick={() => deleteComment(c.id)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>SİL</button>
                          )}
                        </div>
                        <p style={{ fontSize: '1rem', color: '#444', lineHeight: 1.6 }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
