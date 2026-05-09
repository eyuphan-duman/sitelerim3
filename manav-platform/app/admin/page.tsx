'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Calendar, Clock, CheckCircle, XCircle, FileText, Video, Trash2, Plus, PenTool, LayoutDashboard, LogOut, Mail, Eye, Edit3, Save, X, Home } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { useRouter } from 'next/navigation';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);

  const [articles, setArticles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'appointments' | 'posts' | 'videos' | 'messages'>('appointments');
  const [subTab, setSubTab] = useState<'pending' | 'approved'>('pending');
  const [messages, setMessages] = useState<any[]>([]);
  const [editingMsg, setEditingMsg] = useState<string | null>(null);
  const [editMsgText, setEditMsgText] = useState('');

  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

  // Forms
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

    return () => { u1(); u2(); u3(); u4(); };
  }, [user]);

  const updateAppointment = async (id: string, newStatus: string) => {
    try { await updateDoc(doc(db, 'appointments', id), { status: newStatus }); toast.success('Randevu ' + newStatus); }
    catch { toast.error('İşlem başarısız.'); }
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
      await addDoc(collection(db, 'articles'), { ...postForm, excerpt, createdAt: serverTimestamp() });
      setPostForm({ title: '', category: '', featuredImage: '', content: '' });
      toast.success('Makale yayımlandı!');
    } catch { toast.error('Hata oluştu.'); }
    finally { setSubmitting(false); }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Makaleyi silmek istediğinize emin misiniz?')) return;
    await deleteDoc(doc(db, 'articles', id));
    toast.success('Silindi.');
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!videoFile) { toast.error('Lütfen bir video dosyası seçin'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', videoFile);

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
      toast.success('Video eklendi!');
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
    { id: 'appointments', label: 'Randevular', icon: <Calendar size={18}/> },
    { id: 'posts', label: 'Yazılarım', icon: <FileText size={18}/> },
    { id: 'videos', label: 'Videolarım', icon: <Video size={18}/> },
    { id: 'messages', label: 'Mesajlar', icon: <Mail size={18}/> },
  ] as const;

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      
      {/* 20% SIDEBAR */}
      <aside className="admin-sidebar" style={{ width: 280, background: 'var(--navy)', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
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
            <button key={m.id} onClick={() => setActiveTab(m.id as any)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
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
          <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: '10px 16px', transition: 'all 0.2s', width: '100%' }}>
            <Home size={16}/> Ana Sayfa
          </button>
          <button onClick={() => { logout(); router.push('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
            <LogOut size={16}/> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* 80% MAIN CONTENT */}
      <main className="admin-main" style={{ flex: 1, padding: '48px 64px', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 40, borderBottom: '2px solid #e2e8f0', paddingBottom: 24 }}>
          {MENUS.find(m => m.id === activeTab)?.label} Yönetimi
        </h1>

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setSubTab('pending')} style={{ padding: '8px 20px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', border: subTab === 'pending' ? '1px solid var(--navy)' : '1px solid transparent', background: subTab === 'pending' ? 'var(--navy)' : '#e2e8f0', color: subTab === 'pending' ? 'white' : '#475569' }}>
                Onay Bekleyenler ({appointments.filter(a => a.status === 'pending').length})
              </button>
              <button onClick={() => setSubTab('approved')} style={{ padding: '8px 20px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', border: subTab === 'approved' ? '1px solid var(--navy)' : '1px solid transparent', background: subTab === 'approved' ? 'var(--navy)' : '#e2e8f0', color: subTab === 'approved' ? 'white' : '#475569' }}>
                Onaylanmış Seanslar
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: 6, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
            <div style={{ background: 'white', padding: 32, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                <PenTool size={20} color="var(--gold-dim)"/>
                <h2 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--navy)' }}>Yeni Makale Yayımla</h2>
              </div>
              <form onSubmit={handleAddPost} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                  <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Başlık</label><input required className="input-field" value={postForm.title} onChange={e=>setPostForm({...postForm, title: e.target.value})} placeholder="Makale başlığı…"/></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kategori</label><input className="input-field" value={postForm.category} onChange={e=>setPostForm({...postForm, category: e.target.value})} placeholder="Örn: Psikoloji"/></div>
                </div>
                <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kapak Görseli URL (opsiyonel)</label><input className="input-field" value={postForm.featuredImage} onChange={e=>setPostForm({...postForm, featuredImage: e.target.value})} placeholder="https://…"/></div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">İçerik Editörü</label>
                  <div className="yz-editor-quill" style={{ minHeight: 400 }}>
                    <ReactQuill theme="snow" value={postForm.content} onChange={val=>setPostForm({...postForm, content: val})} modules={{ toolbar: [[{header:[2,3,4,false]}],[{font:[]},{size:['small',false,'large','huge']}],['bold','italic','underline','strike'],[{color:[]},{background:[]}],[{list:'ordered'},{list:'bullet'}],[{align:['','center']}],['blockquote','link','image'],['clean']] }} formats={['header','font','size','bold','italic','underline','strike','color','background','list','bullet','align','blockquote','link','image']}/>
                  </div>
                </div>
                <button disabled={submitting} type="submit" className="btn-gold justify-center mt-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16}/> {submitting ? 'Yayımlanıyor…' : 'Makaleyi Yayımla'}</button>
              </form>
            </div>

            {/* Published Articles */}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--navy)', marginBottom: 20 }}>Yayımlanan Makaleler</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {articles.map(a => (
                  <div key={a.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {a.featuredImage && <img src={a.featuredImage} alt={a.title} style={{ width: '100%', height: 140, objectFit: 'cover' }}/>}
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      {a.category && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{a.category}</span>}
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.35 }}>{a.title}</h3>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
                        <a href={`/yazilarim/${a.id}`} target="_blank" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>
                          <Edit3 size={13}/> Düzenle
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
            <div style={{ background: 'white', padding: 32, borderRadius: 6, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(10,22,40,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                <Video size={20} color="var(--gold-dim)"/> <h2 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--navy)' }}>Yeni Video Ekle</h2>
              </div>
              <form onSubmit={handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Başlık</label><input required className="input-field" value={videoForm.title} onChange={e=>setVideoForm({...videoForm, title: e.target.value})} placeholder="Video Başlığı"/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kategori</label><input className="input-field" value={videoForm.category} onChange={e=>setVideoForm({...videoForm, category: e.target.value})} placeholder="Örn: Soru-Cevap"/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Video Dosyası (Yerel)</label><input type="file" accept="video/*" required className="input-field" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Süre (Örn: 12:40)</label><input className="input-field" value={videoForm.dur} onChange={e=>setVideoForm({...videoForm, dur: e.target.value})}/></div>
                  <div style={{ flex: 1 }}><label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Yaklaşık Görüntülenme</label><input className="input-field" value={videoForm.views} onChange={e=>setVideoForm({...videoForm, views: e.target.value})} placeholder="1.2B"/></div>
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
