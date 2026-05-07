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

  const editPost = (post: Post, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditPostId(post.id);
    setPostForm({ title: post.title, category: post.category, excerpt: post.excerpt, content: post.content });
    setShowPostForm(true);
    if (active) setActive(null); // Close modal if editing from modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSharePost = async (e: React.FormEvent) => {
    e.preventDefault();
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
                  <input required placeholder="Başlık" className="input-field" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
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
                      {submitting ? 'Kaydediliyor...' : 'Paylaş'}
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
                    {heroPost.excerpt || (heroPost.content ? heroPost.content.replace(/<[^>]*>?/gm, '').slice(0, 200) + '...' : '')}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn-dark-outline" style={{ border: '1px solid #000', color: '#000', borderRadius: 0, padding: '8px 24px', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Makaleyi Oku</button>
                    {ADMIN_EMAILS.includes(user?.email || '') && (
                      <button onClick={(e) => editPost(heroPost, e)} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-dim)', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>Düzenle</button>
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
                        <button onClick={(e) => editPost(post, e)} style={{ color: 'var(--gold-dim)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>DÜZENLE</button>
                      )}
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#111', lineHeight: 1.25, marginBottom: 12 }}>
                      {post.title}
                    </h3>
                    <p className="crimson" style={{ fontSize: '1rem', color: '#555', lineHeight: 1.6, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.excerpt || (post.content ? post.content.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...' : '')}
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
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 800, color: '#111', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Günün Sözü</h4>
                <p className="crimson" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: '#444', lineHeight: 1.6, position: 'relative', paddingLeft: 16, borderLeft: '3px solid var(--gold)' }}>
                  "İnsan, kendini inşa etmek zorunda olan yegane varlıktra."
                </p>
              </div>

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
        <div className="modal-backdrop" onClick={closePost} style={{ background: 'rgba(255,255,255,0.95)', alignItems: 'stretch', padding: 0 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 800, margin: '0 auto', boxShadow: '0 0 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }} onClick={e => e.stopPropagation()}>
            {/* Toolbar */}
            <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', padding: '16px 24px', zIndex: 10 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <button onClick={closePost} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#111', textTransform: 'uppercase' }}>
                  <X size={16}/> Kapat
                </button>
                {ADMIN_EMAILS.includes(user?.email || '') && (
                  <button onClick={() => editPost(active!)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-dim)', textTransform: 'uppercase' }}>
                    Düzenle
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, color: '#888', fontSize: '0.8rem' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={14}/> {active.likes}</span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14}/> {active.commentCount}</span>
              </div>
            </div>

            {/* Post Content */}
            <div style={{ padding: 'clamp(24px, 5vw, 48px) clamp(16px, 6vw, 64px)', overflowY: 'auto', flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold-dim)', display: 'block', marginBottom: 16 }}>{active.category}</span>
                <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#111', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em' }}>
                  {active.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  <Clock size={14}/> {format(new Date(active.date), 'dd MMMM yyyy', { locale: tr })}
                </div>
              </div>

              {/* The Article */}
              <div className="crimson" style={{ borderTop: '2px solid #111', paddingTop: 40, borderBottom: '1px solid #eaeaea', paddingBottom: 48, marginBottom: 48 }}>
                <p style={{ fontSize: '1.3rem', color: '#222', lineHeight: 1.8, marginBottom: 32, fontStyle: 'italic', fontWeight: 600 }}>{active.excerpt}</p>
                <div 
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: active.content }} 
                  style={{ color: '#333', fontSize: '1.15rem', lineHeight: 1.85, letterSpacing: '0.01em' }}
                />
              </div>

              {/* Comments Section */}
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 800, color: '#111', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Yorumlar ({comments.length})
                </h3>

                {user ? (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 48 }}>
                    <div className="avatar" style={{ width: 44, height: 44, background: '#111', color: '#fff', fontSize: '1rem' }}>{user.displayName?.[0]?.toUpperCase() || 'U'}</div>
                    <div style={{ flex: 1 }}>
                      <textarea className="input-field" placeholder="Düşüncelerinizi paylaşın..." value={text} onChange={e => setText(e.target.value)} style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 0, minHeight: 100, marginBottom: 12, padding: 12, width: '100%', resize: 'none' }} />
                      <button onClick={submit} disabled={submitting || !text.trim() || user.isAnonymous} className="btn-dark-outline" style={{ borderRadius: 0, padding: '10px 24px', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>
                        <Send size={14}/> {user.isAnonymous ? 'ÜYE OLUN' : 'Yorum Yap'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#f5f5f5', padding: '24px', textAlign: 'center', marginBottom: 48, border: '1px solid #eee' }}>
                    <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: 12 }}>Okuduğunuz makale hakkında fikirlerinizi belirtmek için giriş yapın.</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: 24, borderBottom: '1px dashed #eaeaea' }}>
                      <Link href={`/forum/profil/${encodeURIComponent(c.authorName)}`}>
                        <div className="avatar" style={{ width: 40, height: 40, background: '#eee', color: '#555', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s' }}>{c.authorName[0]?.toUpperCase()}</div>
                      </Link>
                      <div style={{ flex: 1 }}>
                        <Link href={`/forum/profil/${encodeURIComponent(c.authorName)}`} style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111', display: 'block', marginBottom: 4, textDecoration: 'none' }} className="hover:underline">
                          {c.authorName}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic', display: 'block', marginBottom: 12 }}>{c.createdAt.toLocaleDateString('tr-TR')}</span>
                        <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.6 }}>{c.text}</p>
                        
                        {(ADMIN_EMAILS.includes(user?.email || '') || user?.uid === c.uid) && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem', marginTop: 8, padding: '4px 8px', borderRadius: 4 }}
                          >
                            <Trash2 size={13} /> Yorumu Sil
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
