'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Calendar, Clock, CheckCircle, XCircle, FileText, Video, Trash2, Plus, PenTool, LayoutDashboard, LogOut, Mail, Eye, Edit3, Save, X, Home, Menu, Sliders, Upload, Image as ImageIcon, Sparkles, MessageCircle, RotateCcw, Link2, Type, Check } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { DEFAULT_HERO_SETTINGS, HeroSettings } from '@/lib/heroSettings';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, background: '#f8f9fa', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', borderRadius: 8 }}>Editör yükleniyor...</div>
});


export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);

  const [articles, setArticles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'hero' | 'appointments' | 'posts' | 'videos' | 'messages'>('hero');
  const [subTab, setSubTab] = useState<'pending' | 'approved'>('pending');
  const [messages, setMessages] = useState<any[]>([]);
  const [editingMsg, setEditingMsg] = useState<string | null>(null);
  const [editMsgText, setEditMsgText] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero Slider Settings State
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [heroSubTab, setHeroSubTab] = useState<'slide1' | 'slide2' | 'timing'>('slide1');
  const [savingHero, setSavingHero] = useState(false);
  const [uploadingSlide1Img, setUploadingSlide1Img] = useState(false);
  const [uploadingSlide2Img, setUploadingSlide2Img] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'hero' || tabParam === 'posts' || tabParam === 'videos' || tabParam === 'messages' || tabParam === 'appointments') {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

  // Forms
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({ title: '', category: '', featuredImage: '', content: '' });
  const [videoForm, setVideoForm] = useState({ title: '', category: '', desc: '', dur: '', views: '1', link: '' });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) return;

    const u1 = onSnapshot(query(collection(db, 'appointments'), orderBy('createdAt', 'desc')), snap => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(query(collection(db, 'articles'), orderBy('createdAt', 'desc')), snap => setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(query(collection(db, 'reels'), orderBy('createdAt', 'desc')), snap => setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u4 = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u5 = onSnapshot(doc(db, 'settings', 'hero'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setHeroSettings(prev => ({
          ...prev,
          ...data,
          slide1: { ...prev.slide1, ...(data.slide1 || {}) },
          slide2: { ...prev.slide2, ...(data.slide2 || {}) },
        }));
      }
    });

    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [user]);

  const updateAppointment = async (id: string, newStatus: string) => {
    try { await updateDoc(doc(db, 'appointments', id), { status: newStatus }); toast.success('Randevu ' + newStatus); }
    catch { toast.error('İşlem başarısız.'); }
  };

  const handleUploadHeroImage = async (file: File, slideKey: 'slide1' | 'slide2') => {
    try {
      if (slideKey === 'slide1') setUploadingSlide1Img(true);
      else setUploadingSlide2Img(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'manav-platform/hero');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Görsel yüklenemedi');

      setHeroSettings(prev => ({
        ...prev,
        [slideKey]: {
          ...prev[slideKey],
          bgImage: data.url
        }
      }));
      toast.success(`${slideKey === 'slide1' ? '1. Slayt' : '2. Slayt'} görseli yüklendi!`);
    } catch (err: any) {
      toast.error('Görsel yüklenirken hata: ' + (err.message || ''));
    } finally {
      if (slideKey === 'slide1') setUploadingSlide1Img(false);
      else setUploadingSlide2Img(false);
    }
  };

  const handleSaveHeroSettings = async () => {
    setSavingHero(true);
    try {
      await setDoc(doc(db, 'settings', 'hero'), heroSettings, { merge: true });
      toast.success('Ana sayfa kapak ayarları başarıyla kaydedildi!');
    } catch (err: any) {
      toast.error('Kaydedilirken hata oluştu: ' + (err.message || ''));
    } finally {
      setSavingHero(false);
    }
  };

  const handleResetHeroSettings = () => {
    if (confirm('Kapak ayarlarını orijinal varsayılan ayarlara döndürmek istediğinize emin misiniz?')) {
      setHeroSettings(DEFAULT_HERO_SETTINGS);
      toast('Varsayılan ayarlar yüklendi. Kalıcı olması için "Değişiklikleri Kaydet" butonuna tıklayın.', { icon: 'ℹ️' });
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.content || postForm.content === '<p><br></p>') {
      toast.error('Başlık ve içerik zorunludur.'); return;
    }
    setSubmitting(true);
    try {
      const strip = (h: string) => h.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();
      const raw = strip(postForm.content);
      const excerpt = raw.length > 220 ? raw.slice(0, 220) + '…' : raw;

      if (editingArticleId) {
        await updateDoc(doc(db, 'articles', editingArticleId), {
          ...postForm,
          excerpt,
          updatedAt: serverTimestamp()
        });
        toast.success('Makale güncellendi!');
        setEditingArticleId(null);
      } else {
        await addDoc(collection(db, 'articles'), {
          ...postForm,
          excerpt,
          createdAt: serverTimestamp()
        });
        toast.success('Makale yayımlandı!');
      }

      setPostForm({ title: '', category: '', featuredImage: '', content: '' });
    } catch (e: any) {
      toast.error('Hata oluştu: ' + (e?.message || ''));
    }
    finally { setSubmitting(false); }
  };

  const handleStartEdit = (a: any) => {
    setPostForm({
      title: a.title || '',
      category: a.category || '',
      featuredImage: a.featuredImage || '',
      content: a.content || ''
    });
    setEditingArticleId(a.id);
    setActiveTab('posts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('Makale düzenleme moduna alındı.');
  };

  const handleCancelEdit = () => {
    setEditingArticleId(null);
    setPostForm({ title: '', category: '', featuredImage: '', content: '' });
  };

  const deletePost = async (id: string) => {
    if (!confirm('Makaleyi silmek istediğinize emin misiniz?')) return;
    try {
      await Promise.all([
        deleteDoc(doc(db, 'articles', id)),
        deleteDoc(doc(db, 'posts', id)).catch(() => {})
      ]);
      if (editingArticleId === id) handleCancelEdit();
      toast.success('Silindi.');
    } catch {
      toast.error('Hata oluştu.');
    }
  };


  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!videoFile) { toast.error('Lütfen bir video dosyası seçin'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('folder', 'manav-platform/videos');

      setUploadProgress(50); // Yükleniyor hissi için sahte progress
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Yükleme başarısız');

      await addDoc(collection(db, 'reels'), { ...videoForm, videoUrl: data.url, createdAt: serverTimestamp(), date: new Date().toISOString() });
      setVideoForm({ title: '', category: '', desc: '', dur: '', views: '1', link: '' });
      setVideoFile(null);
      setUploadProgress(0);
      toast.success('Video Cloudinary\'ye yüklendi ve eklendi!');
    } catch (error: any) { 
      toast.error('Hata oluştu: ' + error.message); 
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };
  const deleteVideo = async (id: string) => { if (confirm('Videoyu silmek istediğinize emin misiniz?')) { await deleteDoc(doc(db, 'reels', id)); toast.success('Silindi'); } };

  if (loading) return null;
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)', color: 'white' }}>
        <div style={{ textAlign: 'center' }}><XCircle size={48} color="#ff4444" style={{ margin: '0 auto 20px' }}/><h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem' }}>Yetkisiz Erişim</h1></div>
      </div>
    );
  }

  const MENUS = [
    { id: 'hero', label: 'Ana Sayfa Kapağı', icon: <Sliders size={18}/> },
    { id: 'appointments', label: 'Randevular', icon: <Calendar size={18}/> },
    { id: 'posts', label: 'Yazılarım', icon: <FileText size={18}/> },
    { id: 'videos', label: 'Videolarım', icon: <Video size={18}/> },
    { id: 'messages', label: 'Mesajlar', icon: <Mail size={18}/> },
  ] as const;

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      <style>{`
        @media (max-width: 900px) {
          .admin-layout {
            flex-direction: column !important;
          }
          .admin-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            z-index: 1000 !important;
            transform: translateX(-100%) !important;
            transition: transform 0.28s ease !important;
            box-shadow: 4px 0 24px rgba(0,0,0,0.3) !important;
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
          }
          .admin-sidebar-overlay {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(10,22,40,0.6) !important;
            backdrop-filter: blur(4px) !important;
            z-index: 999 !important;
          }
          .admin-mobile-topbar {
            display: flex !important;
          }
          .admin-main {
            padding: 20px 16px !important;
          }
          .admin-page-title {
            font-size: 1.4rem !important;
            margin-bottom: 20px !important;
            padding-bottom: 14px !important;
          }
          .admin-post-form-row {
            grid-template-columns: 1fr !important;
          }
          .admin-posts-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .admin-card-inner {
            padding: 18px 16px !important;
          }
        }
        @media (min-width: 901px) {
          .admin-mobile-topbar {
            display: none !important;
          }
          .admin-sidebar-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* MOBILE TOPBAR */}
      <header className="admin-mobile-topbar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--navy)', color: 'white', position: 'sticky', top: 0, zIndex: 900, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>F</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Playfair Display, serif' }}>Furkan Manav</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Yönetim Paneli</div>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(prev => !prev)} 
          style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', borderRadius: 8, padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Menüyü aç/kapat"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileMenuOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      
      {/* SIDEBAR (Desktop sticky, Mobile slide-in drawer) */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ width: 280, background: 'var(--navy)', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>F</div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'Playfair Display, serif', letterSpacing: '0.02em' }}>Psikolog</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Furkan Manav</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', paddingLeft: 12, marginBottom: 8 }}>Kontrol Paneli</div>
          {MENUS.map(m => (
            <button key={m.id} onClick={() => { setActiveTab(m.id as any); setMobileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
              background: activeTab === m.id ? 'var(--gold)' : 'transparent',
              color: activeTab === m.id ? 'var(--navy)' : 'rgba(255,255,255,0.7)',
              fontWeight: activeTab === m.id ? 700 : 500,
            }}>
              {m.icon}
              <span style={{ fontSize: '0.95rem' }}>{m.label}</span>
              {m.id === 'messages' && messages.filter(msg => msg.status === 'unread').length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {messages.filter(msg => msg.status === 'unread').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => { setMobileMenuOpen(false); router.push('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: '10px 16px', transition: 'all 0.2s', width: '100%' }}>
            <Home size={16}/> Ana Sayfa
          </button>
          <button onClick={() => { logout(); router.push('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
            <LogOut size={16}/> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main" style={{ flex: 1, padding: '48px 64px', overflowY: 'auto', minWidth: 0 }}>
        <h1 className="admin-page-title" style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 40, borderBottom: '2px solid #e2e8f0', paddingBottom: 24 }}>
          {MENUS.find(m => m.id === activeTab)?.label} Yönetimi
        </h1>

        {/* HERO TAB */}
        {activeTab === 'hero' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Sub-tab pills & Actions header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, background: 'white', padding: '16px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setHeroSubTab('slide1')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    border: heroSubTab === 'slide1' ? '1px solid var(--navy)' : '1px solid #cbd5e1',
                    background: heroSubTab === 'slide1' ? 'var(--navy)' : '#f8fafc',
                    color: heroSubTab === 'slide1' ? 'white' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <ImageIcon size={16} /> 1. Slayt (Ana Kapak & Psikolog)
                </button>
                <button
                  type="button"
                  onClick={() => setHeroSubTab('slide2')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    border: heroSubTab === 'slide2' ? '1px solid var(--navy)' : '1px solid #cbd5e1',
                    background: heroSubTab === 'slide2' ? 'var(--navy)' : '#f8fafc',
                    color: heroSubTab === 'slide2' ? 'white' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <MessageCircle size={16} /> 2. Slayt (Forum Tanıtımı)
                </button>
                <button
                  type="button"
                  onClick={() => setHeroSubTab('timing')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    border: heroSubTab === 'timing' ? '1px solid var(--navy)' : '1px solid #cbd5e1',
                    background: heroSubTab === 'timing' ? 'var(--navy)' : '#f8fafc',
                    color: heroSubTab === 'timing' ? 'white' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <Clock size={16} /> Geçiş & Zamanlama ({heroSettings.slideInterval || 20}sn)
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleResetHeroSettings}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#64748b',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RotateCcw size={14} /> Varsayılana Sıfırla
                </button>
                <button
                  type="button"
                  onClick={handleSaveHeroSettings}
                  disabled={savingHero}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--gold)',
                    color: 'var(--navy)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: savingHero ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  <Save size={16} /> {savingHero ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </div>

            {/* TAB: SLIDE 1 */}
            {heroSubTab === 'slide1' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 28 }} className="admin-posts-grid">
                {/* Form fields */}
                <div style={{ background: 'white', padding: 28, borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                    1. Slayt Metinleri ve Butonları
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Üst Başlık (Eyebrow)</label>
                    <input
                      type="text"
                      value={heroSettings.slide1.eyebrow}
                      onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, eyebrow: e.target.value } }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                      placeholder="VAROLUŞÇU · PSİKANALİTİK · PSİKOTERAPİ"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Ana Başlık (1. Kısım)</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.titlePart1}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, titlePart1: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="Kendinizi"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-dim)', marginBottom: 6 }}>Vurgulu Kelime (Altın İtalik)</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.titlePart2}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, titlePart2: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid var(--gold)', fontSize: '0.92rem', outline: 'none', background: '#fffbeb' }}
                        placeholder="Anlama"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Ana Başlık (3. Kısım)</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.titlePart3}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, titlePart3: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="Yolculuğu"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Açıklama Metni (Paragraf)</label>
                    <textarea
                      rows={4}
                      value={heroSettings.slide1.description}
                      onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, description: e.target.value } }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none', resize: 'vertical' }}
                      placeholder="Varoluşçu-psikanalitik yaklaşımla ilgili derinlemesine incelemeler..."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>1. Buton Metni (Altın Buton)</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.primaryBtnText}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, primaryBtnText: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="Foruma Katıl"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>1. Buton Linki</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.primaryBtnLink}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, primaryBtnLink: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="/forum"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>1. Buton Rozeti (Örn: v2.0)</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.primaryBtnBadge}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, primaryBtnBadge: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="v2.0"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>2. Buton Metni (İletişim/Randevu)</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.secondaryBtnText}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, secondaryBtnText: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="Randevular Hakkında Bilgi Almak İçin İletişime Geçin"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>2. Buton Linki</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.secondaryBtnLink}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, secondaryBtnLink: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="/iletisim"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Arama Çubuğu İpucu Metni</label>
                    <input
                      type="text"
                      value={heroSettings.slide1.searchPlaceholder}
                      onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, searchPlaceholder: e.target.value } }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                      placeholder="Site içinde ara — yazılar, forum, içerikler..."
                    />
                  </div>
                </div>

                {/* Image uploader card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'white', padding: 24, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>
                      1. Slayt Kapak Fotoğrafı
                    </h4>
                    
                    <div style={{ width: '100%', height: 210, borderRadius: 8, overflow: 'hidden', background: '#0a1628', position: 'relative', border: '2px solid rgba(212, 175, 55, 0.3)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {heroSettings.slide1.bgImage ? (
                        <img src={heroSettings.slide1.bgImage} alt="Kapak Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Görsel Yok</span>
                      )}
                      {uploadingSlide1Img && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,40,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 8 }}>
                          <Clock className="animate-spin" size={24} color="var(--gold)" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Fotoğraf Yükleniyor...</span>
                        </div>
                      )}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--navy)', color: 'white', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginBottom: 12 }}>
                      <Upload size={16} /> Fotoğraf Seç ve Yükle
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadHeroImage(file, 'slide1');
                        }}
                      />
                    </label>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Veya Doğrudan Görsel URL'si:</label>
                      <input
                        type="text"
                        value={heroSettings.slide1.bgImage}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide1: { ...prev.slide1, bgImage: e.target.value } }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                        placeholder="/hero-bg.jpg veya https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SLIDE 2 (FORUM PROMO) */}
            {heroSubTab === 'slide2' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 28 }} className="admin-posts-grid">
                {/* Form fields */}
                <div style={{ background: 'white', padding: 28, borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                    2. Slayt Metinleri ve Forum Tanıtımı
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Üst Başlık (Eyebrow)</label>
                    <input
                      type="text"
                      value={heroSettings.slide2.eyebrow}
                      onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, eyebrow: e.target.value } }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                      placeholder="CANLI TOPLULUK & PSİKOLOJİ FORUMU"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Ana Başlık (1. Kısım)</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.titlePart1}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, titlePart1: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="Sorularınızı Sorun,"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-dim)', marginBottom: 6 }}>Vurgulu Kelime (Altın İtalik)</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.titlePart2}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, titlePart2: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid var(--gold)', fontSize: '0.92rem', outline: 'none', background: '#fffbeb' }}
                        placeholder="Birlikte"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Ana Başlık (3. Kısım)</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.titlePart3}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, titlePart3: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="Keşfedelim"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Forum Tanıtım Açıklaması</label>
                    <textarea
                      rows={4}
                      value={heroSettings.slide2.description}
                      onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, description: e.target.value } }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none', resize: 'vertical' }}
                      placeholder="Psikolojiye, ilişkilere ve içsel dünyanıza dair merak ettiğiniz her şeyi foruma taşıyın. İster uzman psikoloğumuz ister deneyimli forum üyeleri yanıtlasın..."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>1. Buton Metni (Hemen Katıl/Üye Ol)</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.primaryBtnText}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, primaryBtnText: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="Hemen Üye Ol & Foruma Katıl"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>1. Buton Linki</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.primaryBtnLink}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, primaryBtnLink: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="/forum"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>1. Buton Rozeti</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.primaryBtnBadge}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, primaryBtnBadge: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="CANLI"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>2. Buton Metni (Konuları Gör)</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.secondaryBtnText}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, secondaryBtnText: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="Tartışmaları ve Konuları İncele"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>2. Buton Linki</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.secondaryBtnLink}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, secondaryBtnLink: e.target.value } }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                        placeholder="/forum"
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>
                      Forum Tanıtım Kutuları (3 Adet Öne Çıkan Özellik)
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Highlight 1 */}
                      <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)', marginBottom: 8 }}>1. Özellik Kartı</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 10 }}>
                          <input
                            type="text"
                            value={heroSettings.slide2.highlight1Title}
                            onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, highlight1Title: e.target.value } }))}
                            placeholder="Başlık (örn: Uzman & Topluluk Rehberliği)"
                            style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                          <input
                            type="text"
                            value={heroSettings.slide2.highlight1Desc}
                            onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, highlight1Desc: e.target.value } }))}
                            placeholder="Kısa Açıklama"
                            style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      {/* Highlight 2 */}
                      <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)', marginBottom: 8 }}>2. Özellik Kartı</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 10 }}>
                          <input
                            type="text"
                            value={heroSettings.slide2.highlight2Title}
                            onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, highlight2Title: e.target.value } }))}
                            placeholder="Başlık (örn: Gizlilik ve Güvenli Alan)"
                            style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                          <input
                            type="text"
                            value={heroSettings.slide2.highlight2Desc}
                            onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, highlight2Desc: e.target.value } }))}
                            placeholder="Kısa Açıklama"
                            style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      {/* Highlight 3 */}
                      <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)', marginBottom: 8 }}>3. Özellik Kartı</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 10 }}>
                          <input
                            type="text"
                            value={heroSettings.slide2.highlight3Title}
                            onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, highlight3Title: e.target.value } }))}
                            placeholder="Başlık (örn: Aktif Tartışmalar & Paylaşım)"
                            style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                          <input
                            type="text"
                            value={heroSettings.slide2.highlight3Desc}
                            onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, highlight3Desc: e.target.value } }))}
                            placeholder="Kısa Açıklama"
                            style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Image for Slide 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'white', padding: 24, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>
                      2. Slayt Arka Plan Görseli
                    </h4>
                    
                    <div style={{ width: '100%', height: 210, borderRadius: 8, overflow: 'hidden', background: '#0a1628', position: 'relative', border: '2px solid rgba(212, 175, 55, 0.3)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {heroSettings.slide2.bgImage ? (
                        <img src={heroSettings.slide2.bgImage} alt="Kapak Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                          <Sparkles size={28} color="var(--gold)" style={{ margin: '0 auto 8px' }} />
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'white' }}>Varsayılan Lüks Tema Aktif</div>
                          <div style={{ fontSize: '0.72rem', marginTop: 4 }}>Görsel yüklenmediğinde şık lacivert ve altın ışıltılı gradient kullanılır.</div>
                        </div>
                      )}
                      {uploadingSlide2Img && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,40,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 8 }}>
                          <Clock className="animate-spin" size={24} color="var(--gold)" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Fotoğraf Yükleniyor...</span>
                        </div>
                      )}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--navy)', color: 'white', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginBottom: 12 }}>
                      <Upload size={16} /> Fotoğraf Seç ve Yükle
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadHeroImage(file, 'slide2');
                        }}
                      />
                    </label>

                    {heroSettings.slide2.bgImage && (
                      <button
                        type="button"
                        onClick={() => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, bgImage: '' } }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}
                      >
                        Görseli Kaldır (Varsayılan Temaya Dön)
                      </button>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Veya Doğrudan Görsel URL'si:</label>
                      <input
                        type="text"
                        value={heroSettings.slide2.bgImage}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slide2: { ...prev.slide2, bgImage: e.target.value } }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TIMING & GENERAL */}
            {heroSubTab === 'timing' && (
              <div style={{ background: 'white', padding: 28, borderRadius: 10, border: '1px solid #e2e8f0', maxWidth: 640 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)', borderBottom: '1px solid #f1f5f9', paddingBottom: 12, marginBottom: 20 }}>
                  Otomatik Geçiş ve Zamanlama Ayarları
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.95rem' }}>Otomatik Slayt Geçişi</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>Açık olduğunda slaytlar belirlenen süre sonunda otomatik sağa kayar.</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={heroSettings.autoSlide}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, autoSlide: e.target.checked }))}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: heroSettings.autoSlide ? 'var(--gold)' : '#cbd5e1',
                        borderRadius: 34,
                        transition: '0.3s'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: 20,
                          width: 20,
                          left: heroSettings.autoSlide ? 24 : 3,
                          bottom: 3,
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '0.3s'
                        }} />
                      </span>
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                      Slayt Bekleme Süresi (Saniye)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={heroSettings.slideInterval || 20}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, slideInterval: Number(e.target.value) || 20 }))}
                        style={{ width: 140, padding: '10px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none' }}
                      />
                      <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>saniye (Varsayılan: 20 saniye)</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 8 }}>
                      Her slayt bu süre boyunca ekranda kalır, dolduğunda yumuşak bir şekilde sonraki slayta geçer.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <button onClick={() => setSubTab('pending')} style={{ padding: '8px 20px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', border: subTab === 'pending' ? '1px solid var(--navy)' : '1px solid transparent', background: subTab === 'pending' ? 'var(--navy)' : '#e2e8f0', color: subTab === 'pending' ? 'white' : '#475569' }}>
                Onay Bekleyenler ({appointments.filter(a => a.status === 'pending').length})
              </button>
              <button onClick={() => setSubTab('approved')} style={{ padding: '8px 20px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', border: subTab === 'approved' ? '1px solid var(--navy)' : '1px solid transparent', background: subTab === 'approved' ? 'var(--navy)' : '#e2e8f0', color: subTab === 'approved' ? 'white' : '#475569' }}>
                Onaylanmış Seanslar
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Danışan Bilgisi</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Tarih / Saat</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Seans Türü</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', width: '30%' }}>Not</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.filter(a => a.status === subTab).map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '24px' }}><div style={{ fontWeight: 700 }}>{app.displayName}</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>{app.email}</div></td>
                      <td style={{ padding: '24px' }}><div style={{ fontWeight: 600, color: '#334155' }}>{app.date}</div><div style={{ fontWeight: 600, color: '#334155' }}>{app.time}</div></td>
                      <td style={{ padding: '24px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, background: app.sessionType === 'online' ? '#eff6ff' : '#f5f3ff', color: app.sessionType === 'online' ? '#2563eb' : '#7c3aed' }}>
                          {app.sessionType === 'online' ? 'Online' : 'Yüz Yüze'}
                        </span>
                      </td>
                      <td style={{ padding: '24px', fontSize: '0.85rem' }}>{app.note || '-'}</td>
                      <td style={{ padding: '24px', textAlign: 'right' }}>
                        {subTab === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => updateAppointment(app.id, 'approved')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Onayla</button>
                            <button onClick={() => updateAppointment(app.id, 'cancelled')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Sil</button>
                          </div>
                        ) : (
                          <button onClick={() => updateAppointment(app.id, 'cancelled')} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}><Trash2 size={16}/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* New Article Form */}
            <div className="admin-card-inner" style={{ background: 'white', padding: 32, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                <PenTool size={20} color="var(--gold-dim)"/>
                <h2 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--navy)' }}>
                  {editingArticleId ? 'Makaleyi Güncelle' : 'Yeni Makale Yayımla'}
                </h2>
                {editingArticleId && (
                  <button type="button" onClick={handleCancelEdit} style={{ marginLeft: 'auto', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <X size={14}/> İptal Et
                  </button>
                )}
              </div>
              <form onSubmit={handleAddPost} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="admin-post-form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                  <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Başlık</label><input required className="input-field" value={postForm.title} onChange={e=>setPostForm({...postForm, title: e.target.value})} placeholder="Makale başlığı…"/></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kategori</label><input className="input-field" value={postForm.category} onChange={e=>setPostForm({...postForm, category: e.target.value})} placeholder="Örn: Psikoloji"/></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kapak Görseli (Cloudinary / URL)</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input className="input-field" style={{ flex: 1 }} value={postForm.featuredImage} onChange={e=>setPostForm({...postForm, featuredImage: e.target.value})} placeholder="https://… veya dosya seçip yükleyin"/>
                    <label style={{ background: '#2563eb', color: 'white', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }} title="Cloudinary'ye görsel yükle">
                      <Upload size={16} /> Yükle
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const t = toast.loading('Görsel Cloudinary\'ye yükleniyor...');
                        try {
                          const fd = new FormData();
                          fd.append('file', file);
                          fd.append('folder', 'manav-platform/covers');
                          const res = await fetch('/api/upload', { method: 'POST', body: fd });
                          const data = await res.json();
                          if (!data.success) throw new Error(data.error);
                          setPostForm(prev => ({ ...prev, featuredImage: data.url }));
                          toast.success('Görsel yüklendi!', { id: t });
                        } catch (err: any) {
                          toast.error('Hata: ' + err.message, { id: t });
                        }
                      }} />
                    </label>
                  </div>
                  {/* Live Preview of Uploaded Cover Image */}
                  {postForm.featuredImage && (
                    <div style={{ marginTop: 12, position: 'relative', width: '100%', maxWidth: 360, height: 180, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <img src={postForm.featuredImage} alt="Kapak Görseli Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => setPostForm(prev => ({ ...prev, featuredImage: '' }))}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Görseli kaldır"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="editor-container" style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <RichTextEditor 
                      value={postForm.content} 
                      onChange={val=>setPostForm({...postForm, content: val})} 
                      placeholder="Makale içeriğini buraya yazın..."
                    />
                  </div>
                </div>
                <button disabled={submitting} type="submit" className="btn-gold justify-center mt-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {editingArticleId ? <Save size={16}/> : <Plus size={16}/>}
                  {submitting ? 'Kaydediliyor…' : (editingArticleId ? 'Makaleyi Güncelle' : 'Makaleyi Yayımla')}
                </button>
              </form>
            </div>

            {/* Published Articles */}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--navy)', marginBottom: 20 }}>Yayımlanan Makaleler</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {articles.map(a => (
                  <div key={a.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {a.featuredImage && <img src={a.featuredImage} alt={a.title} style={{ width: '100%', height: 140, objectFit: 'cover' }}/>}
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      {a.category && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{a.category}</span>}
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.35 }}>{a.title}</h3>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
                        <button onClick={()=>handleStartEdit(a)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}>
                          <Edit3 size={13}/> Düzenle
                        </button>
                        <a href={`/yazilarim/${a.id}`} target="_blank" style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#64748b', display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Sitede Gör">
                          <Eye size={14}/>
                        </a>
                        <button onClick={()=>deletePost(a.id)} style={{ padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {articles.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Henüz makale yok.</p>}
              </div>
            </div>
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="admin-posts-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 40, alignItems: 'start' }}>
            {/* New Video Form */}
            <div className="admin-card-inner" style={{ background: 'white', padding: 32, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(10,22,40,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                <Video size={20} color="var(--gold-dim)"/> <h2 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--navy)' }}>Yeni Video Ekle</h2>
              </div>
              <form onSubmit={handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Başlık</label><input required className="input-field" value={videoForm.title} onChange={e=>setVideoForm({...videoForm, title: e.target.value})} placeholder="Video Başlığı"/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kategori</label><input className="input-field" value={videoForm.category} onChange={e=>setVideoForm({...videoForm, category: e.target.value})} placeholder="Örn: Soru-Cevap"/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Video Dosyası (Yerel)</label><input type="file" accept="video/*" required className="input-field" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 120 }}><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Süre (Örn: 12:40)</label><input className="input-field" value={videoForm.dur} onChange={e=>setVideoForm({...videoForm, dur: e.target.value})}/></div>
                  <div style={{ flex: 1, minWidth: 120 }}><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Yaklaşık Görüntülenme</label><input className="input-field" value={videoForm.views} onChange={e=>setVideoForm({...videoForm, views: e.target.value})} placeholder="1.2B"/></div>
                </div>
                <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Açıklama</label><textarea className="input-field" style={{ minHeight: 80 }} value={videoForm.desc} onChange={e=>setVideoForm({...videoForm, desc: e.target.value})} placeholder="Kısaca videodan bahsedin"/></div>
                {uploadProgress > 0 && <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 8 }}><div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.2s' }}/></div>}
                <button disabled={submitting} type="submit" className="btn-gold justify-center mt-4"><Plus size={16}/> {submitting ? `Yükleniyor %${Math.round(uploadProgress)}` : 'Videoyu Yayına Al'}</button>
              </form>
            </div>

            {/* Existing Videos */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--navy)', marginBottom: 24 }}>Sitedeki Videolar</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {videos.map(v => (
                  <div key={v.id} style={{ background: 'white', padding: 20, borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold-dim)', fontWeight: 700, textTransform: 'uppercase' }}>{v.category}</span>
                      <h3 style={{ fontWeight: 700, color: 'var(--navy)', marginTop: 4 }}>{v.title}</h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{v.dur} • Video yüklendi</div>
                    </div>
                    <button onClick={() => deleteVideo(v.id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}><Trash2 size={16}/></button>
                  </div>
                ))}
                {videos.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Henüz video eklenmedi.</div>}
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Henüz mesaj gönderilmedi.</div>}
              {messages.map(msg => (
                <div key={msg.id} style={{ background: 'white', borderRadius: 8, border: msg.status === 'unread' ? '2px solid var(--gold)' : '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '1rem' }}>{msg.name}</span>
                        {msg.status === 'unread' && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>YENİ</span>}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{msg.email} • {msg.subject}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {msg.status === 'unread' && (
                        <button onClick={() => updateDoc(doc(db, 'messages', msg.id), { status: 'read' })} title="Okundu işaretle"
                          style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={14}/> Okundu
                        </button>
                      )}
                      <button onClick={() => { setEditingMsg(msg.id); setEditMsgText(msg.message); }} title="Düzenle"
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit3 size={14}/> Düzenle
                      </button>
                      <button onClick={async () => { if (confirm('Bu mesajı silmek istediğinize emin misiniz?')) { await deleteDoc(doc(db, 'messages', msg.id)); toast.success('Silindi'); } }}
                        style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                  {editingMsg === msg.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea value={editMsgText} onChange={e => setEditMsgText(e.target.value)}
                        style={{ width: '100%', minHeight: 100, border: '1.5px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', fontSize: '0.92rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}/>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingMsg(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><X size={13}/> İptal</button>
                        <button onClick={async () => { await updateDoc(doc(db, 'messages', msg.id), { message: editMsgText }); setEditingMsg(null); toast.success('Güncellendi!'); }}
                          style={{ background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Save size={13}/> Kaydet</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#334155', fontSize: '0.93rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, padding: '12px 0 0' }}>{msg.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
