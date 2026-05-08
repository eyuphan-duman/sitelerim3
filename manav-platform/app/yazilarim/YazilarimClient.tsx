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

  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    const sub = text.slice(0, limit);
    const lastSpace = sub.lastIndexOf(' ');
    if (lastSpace === -1) return sub + '...';
    return sub.slice(0, lastSpace) + '...';
  };

  const heroPost = filtered[0];
  const otherPosts = filtered.slice(1);

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>
      <style>{`
        .yz-header { background: #fff; padding: 56px 0 0; border-bottom: 3px solid #111; }
        .yz-header-inner { max-width: 1100px; margin: 0 auto; padding: 0 20px; text-align: center; }
        .yz-cats { display: flex; gap: 4px; justify-content: center; flex-wrap: nowrap; overflow-x: auto; padding: 12px 16px 0; scrollbar-width: none; -ms-overflow-style: none; }
        .yz-cats::-webkit-scrollbar { display: none; }
        .yz-cat-btn { background: none; border: none; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; padding: 8px 12px; white-space: nowrap; color: #777; border-bottom: 3px solid transparent; transition: all 0.2s; flex-shrink: 0; }
        .yz-cat-btn.active { color: #111; border-bottom-color: #111; font-weight: 800; }
        .yz-main { max-width: 1300px; margin: 0 auto; padding: 56px 20px 100px; }
        .yz-grid { display: grid; grid-template-columns: 1fr 340px; gap: 60px; }
        .yz-hero { background: #fff; border: 1px solid #eaeaea; border-radius: 16px; padding: 48px; margin-bottom: 56px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .yz-hero:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-color: #d4c4b7; }
        .yz-hero-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; color: #b8956a; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .yz-hero-title { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; color: #111; line-height: 1.15; margin-bottom: 20px; overflow-wrap: break-word; word-break: normal; }
        .yz-hero-excerpt { font-family: 'Crimson Text', serif; font-size: 1.25rem; color: #444; line-height: 1.7; margin-bottom: 28px; overflow-wrap: break-word; word-break: normal; }
        .yz-hero-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .yz-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 32px; }
        .yz-card { cursor: pointer; background: #fff; border: 1px solid #eaeaea; border-radius: 12px; padding: 32px; display: flex; flex-direction: column; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .yz-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.06); border-color: #d4c4b7; }
        .yz-card-cat { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #b8956a; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        .yz-card-title { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 800; color: #111; line-height: 1.35; margin-bottom: 12px; overflow-wrap: break-word; word-break: normal; }
        .yz-card-excerpt { font-family: 'Crimson Text', serif; font-size: 1.05rem; color: #555; line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 20px; word-break: normal; }
        .yz-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; font-size: 0.75rem; color: #999; border-top: 1px solid #f0f0f0; }
        .yz-sidebar { position: sticky; top: 120px; height: max-content; }
        .yz-sidebar-inner { background: #fff; border: 1px solid #eaeaea; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .yz-sidebar-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 900; color: #111; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 24px; }
        .yz-sidebar-item { display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.2s; border-radius: 8px; margin: 0 -8px; padding-left: 8px; padding-right: 8px; }
        .yz-sidebar-item:hover { background: #fafafa; }
        .yz-sidebar-num { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: #e5e5e5; line-height: 1; flex-shrink: 0; width: 36px; }
        .yz-sidebar-item-title { font-size: 0.85rem; font-weight: 700; color: #111; line-height: 1.4; overflow-wrap: break-word; word-break: normal; }
        .yz-sidebar-item-cat { font-size: 0.65rem; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px; }
        .yz-read-btn { display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #111; background: none; border: 1.5px solid #111; padding: 10px 24px; cursor: pointer; transition: all 0.2s; border-radius: 50px; }
        .yz-read-btn:hover { background: #111; color: #fff; }
        @media (max-width: 1024px) {
          .yz-grid { grid-template-columns: 1fr; gap: 40px; }
          .yz-sidebar { position: static; }
        }
        @media (max-width: 768px) {
          .yz-header { padding: 40px 0 0; }
          .yz-main { padding: 32px 16px 60px; }
          .yz-hero { padding: 24px; border-radius: 12px; margin-bottom: 32px; }
          .yz-hero-title { font-size: clamp(1.6rem, 6vw, 2.2rem); }
          .yz-hero-excerpt { font-size: 1.1rem; }
          .yz-cards { grid-template-columns: 1fr; gap: 24px; }
          .yz-card { padding: 24px; border-radius: 12px; }
          .yz-sidebar-inner { padding: 24px; }
        }
        @media (max-width: 480px) {
          .yz-cats { gap: 0; }
          .yz-cat-btn { padding: 8px 10px; font-size: 0.65rem; }
        }
      `}</style>

      {/* Header */}
      <div className="yz-header">
        <div className="yz-header-inner">
          <Link href="/forum/profil/furkanmanav" style={{ textDecoration: 'none' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: '0.62rem', fontWeight: 700, color: '#999', marginBottom: 16 }}>Psikolog Furkan Manav</div>
          </Link>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 9vw, 4.5rem)', fontWeight: 900, color: '#111', lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 20 }}>
            YAZILARIM
          </h1>
        </div>
        <div className="yz-cats">
          {CATEGORIES.map(c => (
            <button key={c} className={`yz-cat-btn${filter === c ? ' active' : ''}`} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="yz-main">
        {ADMIN_EMAILS.includes(user?.email || '') && (
          <div style={{ marginBottom: 40, borderBottom: '1px solid #eee', paddingBottom: 32 }}>
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
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#999', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontStyle: 'italic' }}>
            Bu kategoride yayınlanmış eser bulunmamaktadır.
          </div>
        ) : (
          <div className="yz-grid">
            {/* Sol Ana İçerik */}
            <div>
              {heroPost && (
                <article className="yz-hero" onClick={() => openPost(heroPost)}>
                  <div className="yz-hero-label">
                    <span>📰 Manşet</span>
                    <span style={{ width: 40, height: 1, background: '#b8956a', display: 'inline-block' }} />
                    <span>{heroPost.category}</span>
                    <span style={{ marginLeft: 'auto', fontStyle: 'italic', color: '#aaa', fontFamily: 'Crimson Text, serif', fontSize: '0.75rem', fontWeight: 400 }}>{format(new Date(heroPost.date), 'dd MMMM yyyy', { locale: tr })}</span>
                  </div>
                  <h2 className="yz-hero-title">{heroPost.title}</h2>
                  <p className="yz-hero-excerpt">
                    {heroPost.excerpt || (heroPost.content ? truncateText(stripHtml(heroPost.content), 220) : '')}
                  </p>
                  <div className="yz-hero-meta">
                    <button className="yz-read-btn" onClick={() => openPost(heroPost)}>Makaleyi Oku <ArrowRight size={12}/></button>
                    {ADMIN_EMAILS.includes(user?.email || '') && (
                      <>
                        <button onClick={(e) => editPost(heroPost, e)} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white', background: '#b8956a', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 4 }}>Düzenle</button>
                        <button onClick={(e) => handleDeletePost(heroPost.id, e)} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white', background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 4 }}>Sil</button>
                      </>
                    )}
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, color: '#bbb', fontSize: '0.78rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={13}/>{heroPost.likes}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={13}/>{heroPost.commentCount}</span>
                    </span>
                  </div>
                </article>
              )}

              {/* Kart Listesi */}
              <div className="yz-cards">
                {otherPosts.map(post => (
                  <article key={post.id} className="yz-card" onClick={() => openPost(post)}>
                    <div className="yz-card-cat">
                      {post.category}
                      {ADMIN_EMAILS.includes(user?.email || '') && (
                        <span style={{ marginLeft: 8 }}>
                          <button onClick={(e) => editPost(post, e)} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', background: '#b8956a', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 3 }}>D</button>{' '}
                          <button onClick={(e) => handleDeletePost(post.id, e)} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', background: '#ef4444', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 3 }}>S</button>
                        </span>
                      )}
                    </div>
                    <h3 className="yz-card-title">{post.title}</h3>
                    <p className="yz-card-excerpt">
                      {post.excerpt || (post.content ? truncateText(stripHtml(post.content), 130) : '')}
                    </p>
                    <div className="yz-card-footer">
                      <span style={{ fontStyle: 'italic' }}>{format(new Date(post.date), 'd MMM yyyy', { locale: tr })}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, color: '#555' }}>Oku <ArrowRight size={10}/></span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Sağ Kenar Çubuğu */}
            <aside className="yz-sidebar">
              <div className="yz-sidebar-inner">
                <div className="yz-sidebar-title">Editörün Seçimi</div>
                {posts.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="yz-sidebar-item" onClick={() => openPost(p)}>
                    <div className="yz-sidebar-num">{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      <div className="yz-sidebar-item-title">{p.title}</div>
                      <div className="yz-sidebar-item-cat">{p.category} · {format(new Date(p.date), 'd MMM', { locale: tr })}</div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 40 }}>
                  <div className="yz-sidebar-title">Yazar Hakkında</div>
                  <div style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.7, marginBottom: 16 }}>
                    Psikolog Furkan Manav — Varoluşçu-Psikanalitik yönelimli bireysel psikolojik danışmanlık.
                  </div>
                  <Link href="/ben-kimim" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#111', textDecoration: 'none', borderBottom: '1.5px solid #111', paddingBottom: 2 }}>Daha Fazla Bilgi →</Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Post Modal — Tam Ekran Okuma */}
      {active && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', overflowY: 'auto' }}>
          <style>{`
            .art-topbar { position: sticky; top: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; padding-top: calc(12px + env(safe-area-inset-top,0px)); z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
            .art-topbar-brand { font-family: 'Playfair Display',serif; font-size: 1.1rem; font-weight: 900; color: #111; letter-spacing: -0.01em; }
            .art-close { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #ddd; border-radius: 50px; padding: 8px 16px; cursor: pointer; font-size: 0.8rem; font-weight: 700; color: #333; transition: all 0.2s; }
            .art-close:hover { background: #f4f4f4; border-color: #ccc; }
            .art-reader { max-width: 860px; margin: 0 auto; padding: 64px 24px 120px; }
            .art-cat-badge { display: inline-block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #b8956a; border: 1px solid #b8956a; padding: 4px 12px; margin-bottom: 24px; border-radius: 4px; }
            .art-title { font-family: 'Playfair Display',serif; font-size: clamp(2rem, 6vw, 3.8rem); font-weight: 900; color: #111; line-height: 1.12; margin-bottom: 32px; word-break: normal; overflow-wrap: break-word; letter-spacing: -0.01em; }
            .art-meta { display: flex; align-items: center; gap: 16px; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 1px solid #eaeaea; flex-wrap: wrap; }
            .art-body { font-family: 'Crimson Text',serif; font-size: 1.35rem; line-height: 1.95; color: #222; word-break: normal; overflow-wrap: break-word; }
            .art-body p { margin-bottom: 1.6em; }
            .art-body h1,.art-body h2,.art-body h3 { font-family: 'Playfair Display',serif; color: #111; margin: 56px 0 24px; line-height: 1.3; word-break: normal; overflow-wrap: break-word; }
            .art-body h1 { font-size: 2.2rem; }
            .art-body h2 { font-size: 1.8rem; }
            .art-body h3 { font-size: 1.5rem; }
            .art-body img { width: 100%; height: auto; border-radius: 12px; margin: 48px 0; display: block; box-shadow: 0 8px 30px rgba(0,0,0,0.05); }
            .art-body blockquote { border-left: 4px solid #b8956a; padding-left: 24px; margin: 40px 0; font-style: italic; color: #444; font-size: 1.5rem; line-height: 1.7; background: rgba(184, 149, 106, 0.05); padding-top: 16px; padding-bottom: 16px; border-radius: 0 8px 8px 0; }
            .art-body ul, .art-body ol { margin-bottom: 1.6em; padding-left: 24px; }
            .art-body li { margin-bottom: 0.8em; }
            .art-comments { margin-top: 80px; padding-top: 48px; border-top: 1px solid #eaeaea; }
            @media (max-width: 768px) {
              .art-topbar { padding: 12px 16px; }
              .art-reader { padding: 32px 16px 80px; }
              .art-title { font-size: 2rem; margin-bottom: 24px; }
              .art-body { font-size: 1.15rem; line-height: 1.8; }
              .art-body blockquote { font-size: 1.25rem; padding: 16px; margin: 32px 0; }
              .art-body img { margin: 32px 0; border-radius: 8px; }
            }
          `}</style>
          <div className="art-topbar">
            <div className="art-topbar-brand">YAZILARIM</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {ADMIN_EMAILS.includes(user?.email || '') && (
                <>
                  <button onClick={() => editPost(active!)} style={{ background: '#b8956a', color: '#fff', border: 'none', borderRadius: 50, padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>DÜZENLE</button>
                  <button onClick={() => handleDeletePost(active!.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 50, padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>SİL</button>
                </>
              )}
              <button className="art-close" onClick={closePost}><X size={15}/> Kapat</button>
            </div>
          </div>
          <div className="art-reader">
            <span className="art-cat-badge">{active.category}</span>
            <h1 className="art-title">{active.title}</h1>
            <div className="art-meta">
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333' }}>Psikolog Furkan Manav</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ccc', display: 'inline-block' }} />
              <span style={{ fontSize: '0.78rem', color: '#aaa', fontStyle: 'italic' }}>{format(new Date(active.date), 'dd MMMM yyyy', { locale: tr })}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ccc', display: 'inline-block' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: '#aaa' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={13}/>{active.likes}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={13}/>{active.commentCount}</span>
              </span>
            </div>
            <div className="art-body article-content" dangerouslySetInnerHTML={{ __html: active.content }} />
            <div className="art-comments">
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.4rem', fontWeight: 800, marginBottom: 28, color: '#111' }}>Yorumlar ({comments.length})</h3>
              {user ? (
                <div style={{ marginBottom: 36, background: '#f8f8f8', padding: 20, borderRadius: 12, border: '1px solid #eee' }}>
                  <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Düşüncelerinizi paylaşın..." style={{ width: '100%', minHeight: 90, padding: 14, border: '1px solid #e0e0e0', borderRadius: 8, fontSize: '0.95rem', marginBottom: 10, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  <button onClick={submit} disabled={submitting || !text.trim()} style={{ width: '100%', padding: '12px', borderRadius: 8, fontWeight: 700, background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Gönderiliyor...' : 'Yorum Yap'}
                  </button>
                </div>
              ) : (
                <div style={{ padding: 20, background: '#f8f8f8', borderRadius: 12, textAlign: 'center', marginBottom: 32, border: '1px solid #eee' }}>
                  <p style={{ fontSize: '0.9rem', color: '#777', margin: 0 }}>Yorum yapmak için giriş yapmalısınız.</p>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {loadingC ? <p style={{ color: '#bbb' }}>Yükleniyor...</p> : comments.map(c => (
                  <div key={c.id} style={{ paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111', display: 'block' }}>{c.authorName}</span>
                        <span style={{ fontSize: '0.72rem', color: '#bbb' }}>{format(c.createdAt, 'd MMM yyyy HH:mm', { locale: tr })}</span>
                      </div>
                      {(ADMIN_EMAILS.includes(user?.email || '') || user?.uid === c.uid) && (
                        <button onClick={() => deleteComment(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>SİL</button>
                      )}
                    </div>
                    <p style={{ fontSize: '1rem', color: '#333', lineHeight: 1.65, margin: 0 }}>{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

