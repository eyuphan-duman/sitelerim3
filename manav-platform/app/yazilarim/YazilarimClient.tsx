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
    // Makale açıldığında sayfanın en başına kaydır (SPA deneyimi)
    window.scrollTo({ top: 0, behavior: 'auto' });

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
        .yz-hero { background: #fff; border: 1px solid #eaeaea; border-radius: 12px; padding: 32px; margin-bottom: 40px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .yz-hero:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.06); border-color: #d4c4b7; }
        .yz-hero-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; color: #b8956a; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .yz-hero-title { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 800; color: #111; line-height: 1.2; margin-bottom: 16px; overflow-wrap: break-word; word-break: normal; }
        .yz-hero-excerpt { font-family: 'Crimson Text', serif; font-size: 1.1rem; color: #555; line-height: 1.6; margin-bottom: 24px; overflow-wrap: break-word; word-break: normal; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
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
          .yz-hero-title { font-size: 1.6rem; }
          .yz-hero-excerpt { font-size: 1.05rem; }
          .yz-cards { grid-template-columns: 1fr; gap: 24px; }
          .yz-card { padding: 24px; border-radius: 12px; }
          .yz-sidebar-inner { padding: 24px; }
        }
        @media (max-width: 480px) {
          .yz-cats { gap: 0; }
          .yz-cat-btn { padding: 8px 10px; font-size: 0.65rem; }
        }
      `}</style>

      {!active ? (
        <>
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
        </>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
             ARTICLE READER — Sıfırdan İnşa Edilmiş Editorial Deneyimi
             Medium / Substack / Akademik Dergi Hissiyatı
             ═══════════════════════════════════════════════════════════════ */
        <div className="ed-wrapper">
          <style>{`
            /* ── RESET & BASE ── */
            .ed-wrapper {
              min-height: 100vh;
              background: #fcfcfa;
              padding-bottom: 60px;
            }
            .ed-wrapper * { box-sizing: border-box; }

            /* ── NAVIGATION BAR ── */
            .ed-nav {
              position: sticky; top: 0; z-index: 200;
              display: flex; align-items: center; justify-content: space-between;
              padding: 0 clamp(16px, 4vw, 48px);
              height: 56px;
              background: rgba(252,252,250,0.92);
              backdrop-filter: saturate(180%) blur(16px);
              -webkit-backdrop-filter: saturate(180%) blur(16px);
              border-bottom: 1px solid rgba(0,0,0,0.06);
              padding-top: env(safe-area-inset-top, 0px);
            }
            .ed-nav-brand {
              font-family: 'Playfair Display', serif;
              font-size: 0.95rem; font-weight: 800;
              color: #1a1a1a; letter-spacing: 0.04em;
              text-transform: uppercase;
            }
            .ed-nav-actions { display: flex; align-items: center; gap: 8px; }
            .ed-nav-btn {
              display: inline-flex; align-items: center; gap: 5px;
              padding: 7px 14px; border-radius: 6px;
              font-size: 0.75rem; font-weight: 700;
              cursor: pointer; border: none;
              transition: background 0.15s, opacity 0.15s;
            }
            .ed-nav-btn:active { opacity: 0.7; }
            .ed-nav-btn--close {
              background: transparent; color: #555;
              border: 1px solid #d5d5d5;
            }
            .ed-nav-btn--close:hover { background: #f0f0ee; }
            .ed-nav-btn--edit { background: #b8956a; color: #fff; }
            .ed-nav-btn--edit:hover { background: #a6845c; }
            .ed-nav-btn--del { background: #dc3545; color: #fff; }
            .ed-nav-btn--del:hover { background: #c82333; }

            /* ── ARTICLE CONTAINER ── */
            .ed-container {
              width: 100%;
              max-width: 900px;
              margin: 0 auto;
              padding: 64px 48px 100px;
            }

            /* ── ARTICLE HEADER ── */
            .ed-cat {
              display: inline-block;
              font-size: 0.7rem; font-weight: 700;
              text-transform: uppercase; letter-spacing: 0.12em;
              color: #b8956a;
              margin-bottom: 20px;
            }
            .ed-title {
              font-family: 'Playfair Display', serif;
              font-size: 3rem;
              font-weight: 900;
              color: #1a1a1a;
              line-height: 1.15;
              letter-spacing: -0.015em;
              margin: 0 0 28px 0;
              word-break: normal;
              overflow-wrap: break-word;
              white-space: normal;
              -webkit-hyphens: auto;
              hyphens: auto;
            }
            .ed-meta {
              display: flex; align-items: center; gap: 12px;
              flex-wrap: wrap;
              padding-bottom: 28px;
              margin-bottom: 40px;
              border-bottom: 1px solid #e8e8e4;
            }
            .ed-meta-author {
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 0.85rem; font-weight: 600; color: #333;
            }
            .ed-meta-dot {
              width: 3px; height: 3px;
              border-radius: 50%; background: #ccc;
              display: inline-block; flex-shrink: 0;
            }
            .ed-meta-date {
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 0.82rem; color: #999;
            }
            .ed-meta-stats {
              display: flex; align-items: center; gap: 12px;
              font-size: 0.8rem; color: #aaa;
              margin-left: auto;
            }
            .ed-meta-stat { display: flex; align-items: center; gap: 4px; }

            /* ── ARTICLE BODY — TYPOGRAPHY SYSTEM ── */
            .ed-body {
              font-family: 'Crimson Text', 'Georgia', serif;
              font-size: 1.3rem;
              line-height: 1.9;
              color: #292929;
              word-break: normal;
              overflow-wrap: break-word;
              white-space: normal;
              -webkit-hyphens: auto;
              hyphens: auto;
            }
            .ed-body p {
              margin: 0 0 1.5em 0;
              word-break: normal;
              overflow-wrap: break-word;
            }

            /* Headings */
            .ed-body h1, .ed-body h2, .ed-body h3, .ed-body h4 {
              font-family: 'Playfair Display', serif;
              color: #1a1a1a;
              word-break: normal;
              overflow-wrap: break-word;
              white-space: normal;
              line-height: 1.3;
              -webkit-hyphens: auto;
              hyphens: auto;
            }
            .ed-body h1 { font-size: 2rem; margin: 2.5em 0 0.8em; font-weight: 800; }
            .ed-body h2 { font-size: 1.65rem; margin: 2.2em 0 0.7em; font-weight: 800; }
            .ed-body h3 { font-size: 1.35rem; margin: 2em 0 0.6em; font-weight: 700; }
            .ed-body h4 { font-size: 1.15rem; margin: 1.8em 0 0.5em; font-weight: 700; }

            /* Strong & Emphasis */
            .ed-body strong, .ed-body b { font-weight: 700; color: #1a1a1a; }
            .ed-body em, .ed-body i { font-style: italic; }

            /* Blockquote */
            .ed-body blockquote {
              margin: 2em 0;
              padding: 20px 0 20px 28px;
              border-left: 3px solid #b8956a;
              font-size: 1.3rem;
              line-height: 1.75;
              font-style: italic;
              color: #444;
            }

            /* Lists */
            .ed-body ul, .ed-body ol {
              margin: 0 0 1.5em 0;
              padding-left: 1.5em;
            }
            .ed-body li {
              margin-bottom: 0.6em;
              line-height: 1.75;
            }

            /* Images */
            .ed-body img {
              display: block;
              width: 100%; max-width: 100%;
              height: auto;
              margin: 2.5em 0;
              border-radius: 8px;
            }

            /* Links */
            .ed-body a {
              color: #b8956a;
              text-decoration: underline;
              text-decoration-thickness: 1px;
              text-underline-offset: 2px;
              transition: color 0.15s;
            }
            .ed-body a:hover { color: #96754e; }

            /* Horizontal rule */
            .ed-body hr {
              border: none;
              height: 1px;
              background: #e8e8e4;
              margin: 3em 0;
            }

            /* ── COMMENTS SECTION ── */
            .ed-comments {
              margin-top: 64px;
              padding-top: 40px;
              border-top: 1px solid #e8e8e4;
            }
            .ed-comments-heading {
              font-family: 'Playfair Display', serif;
              font-size: 1.3rem; font-weight: 800;
              color: #1a1a1a;
              margin-bottom: 28px;
            }
            .ed-comment-form {
              margin-bottom: 32px;
              padding: 20px;
              background: #f7f7f4;
              border-radius: 10px;
              border: 1px solid #eee;
            }
            .ed-comment-textarea {
              display: block; width: 100%;
              min-height: 80px; padding: 12px;
              border: 1px solid #ddd; border-radius: 8px;
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 0.92rem; line-height: 1.5;
              resize: vertical; margin-bottom: 10px;
              box-sizing: border-box;
              background: #fff;
              color: #333;
            }
            .ed-comment-textarea:focus { outline: none; border-color: #b8956a; }
            .ed-comment-submit {
              display: block; width: 100%;
              padding: 11px; border: none; border-radius: 8px;
              background: #1a1a1a; color: #fff;
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 0.88rem; font-weight: 700;
              cursor: pointer; transition: background 0.15s;
            }
            .ed-comment-submit:hover { background: #333; }
            .ed-comment-submit:disabled { opacity: 0.5; cursor: not-allowed; }
            .ed-comment-login {
              text-align: center; padding: 18px;
              background: #f7f7f4; border-radius: 10px;
              margin-bottom: 28px; border: 1px solid #eee;
              font-size: 0.88rem; color: #888;
            }
            .ed-comment-item {
              padding: 20px 0;
              border-bottom: 1px solid #f0f0ec;
            }
            .ed-comment-item:last-child { border-bottom: none; }
            .ed-comment-head {
              display: flex; justify-content: space-between;
              align-items: flex-start; margin-bottom: 8px;
            }
            .ed-comment-author {
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 0.88rem; font-weight: 700; color: #1a1a1a;
              display: block;
            }
            .ed-comment-date {
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 0.72rem; color: #bbb;
            }
            .ed-comment-del {
              background: none; border: none;
              color: #dc3545; cursor: pointer;
              font-size: 0.72rem; font-weight: 700;
              font-family: 'Inter', system-ui, sans-serif;
            }
            .ed-comment-text {
              font-family: 'Crimson Text', serif;
              font-size: 1.05rem; line-height: 1.65;
              color: #333; margin: 0;
              word-break: normal; overflow-wrap: break-word;
            }

            /* ══════════════════════════════════════
               RESPONSIVE BREAKPOINTS — MOBILE FIRST
               ══════════════════════════════════════ */

            /* Tablet — 768px */
            @media (max-width: 768px) {
              .ed-container { padding: 40px 24px 80px; }
              .ed-title { font-size: 2.1rem; margin-bottom: 22px; }
              .ed-body { font-size: 1.15rem; line-height: 1.8; }
              .ed-body h1 { font-size: 1.7rem; }
              .ed-body h2 { font-size: 1.45rem; }
              .ed-body h3 { font-size: 1.2rem; }
              .ed-body blockquote { font-size: 1.15rem; padding-left: 20px; }
              .ed-meta-stats { margin-left: 0; width: 100%; margin-top: 4px; }
            }

            /* Mobile — 480px */
            @media (max-width: 480px) {
              .ed-nav { height: 48px; }
              .ed-nav-brand { font-size: 0.82rem; }
              .ed-nav-btn { padding: 6px 10px; font-size: 0.7rem; }
              .ed-container { padding: 32px 24px 64px; }
              .ed-title { font-size: 1.85rem; line-height: 1.22; margin-bottom: 20px; }
              .ed-meta { gap: 8px; padding-bottom: 20px; margin-bottom: 28px; }
              .ed-body { font-size: 1.08rem; line-height: 1.75; }
              .ed-body h1 { font-size: 1.5rem; }
              .ed-body h2 { font-size: 1.3rem; }
              .ed-body h3 { font-size: 1.12rem; }
              .ed-body blockquote { padding-left: 16px; font-size: 1.05rem; margin: 1.5em 0; }
              .ed-body img { margin: 1.5em 0; border-radius: 6px; }
              .ed-comments { margin-top: 48px; padding-top: 28px; }
            }
          `}</style>

          {/* ── Top Navigation ── */}
          <nav className="ed-nav">
            <span className="ed-nav-brand">Yazılarım</span>
            <div className="ed-nav-actions">
              {ADMIN_EMAILS.includes(user?.email || '') && (
                <>
                  <button className="ed-nav-btn ed-nav-btn--edit" onClick={() => editPost(active!)}>Düzenle</button>
                  <button className="ed-nav-btn ed-nav-btn--del" onClick={() => handleDeletePost(active!.id)}>Sil</button>
                </>
              )}
              <button className="ed-nav-btn ed-nav-btn--close" onClick={closePost}>
                <X size={14} /> Kapat
              </button>
            </div>
          </nav>

          {/* ── Article Container ── */}
          <article className="ed-container" lang="tr">
            {/* Category */}
            <span className="ed-cat">{active.category}</span>

            {/* Title */}
            <h1 className="ed-title">{active.title}</h1>

            {/* Meta */}
            <div className="ed-meta">
              <span className="ed-meta-author">Psikolog Furkan Manav</span>
              <span className="ed-meta-dot" />
              <span className="ed-meta-date">{format(new Date(active.date), 'dd MMMM yyyy', { locale: tr })}</span>
              <div className="ed-meta-stats">
                <span className="ed-meta-stat"><Heart size={14} /> {active.likes}</span>
                <span className="ed-meta-stat"><MessageCircle size={14} /> {active.commentCount}</span>
              </div>
            </div>

            {/* Article Body */}
            <div className="ed-body" dangerouslySetInnerHTML={{ __html: active.content }} />

            {/* Comments */}
            <section className="ed-comments">
              <h3 className="ed-comments-heading">Yorumlar ({comments.length})</h3>

              {user ? (
                <div className="ed-comment-form">
                  <textarea
                    className="ed-comment-textarea"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Düşüncelerinizi paylaşın..."
                  />
                  <button
                    className="ed-comment-submit"
                    onClick={submit}
                    disabled={submitting || !text.trim()}
                  >
                    {submitting ? 'Gönderiliyor...' : 'Yorum Yap'}
                  </button>
                </div>
              ) : (
                <div className="ed-comment-login">
                  Yorum yapmak için giriş yapmalısınız.
                </div>
              )}

              <div>
                {loadingC ? (
                  <p style={{ color: '#bbb', fontStyle: 'italic' }}>Yorumlar yükleniyor...</p>
                ) : comments.map(c => (
                  <div key={c.id} className="ed-comment-item">
                    <div className="ed-comment-head">
                      <div>
                        <span className="ed-comment-author">{c.authorName}</span>
                        <span className="ed-comment-date">{format(c.createdAt, 'd MMM yyyy HH:mm', { locale: tr })}</span>
                      </div>
                      {(ADMIN_EMAILS.includes(user?.email || '') || user?.uid === c.uid) && (
                        <button className="ed-comment-del" onClick={() => deleteComment(c.id)}>Sil</button>
                      )}
                    </div>
                    <p className="ed-comment-text">{c.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </article>
        </div>
      )}
    </div>
  );
}

