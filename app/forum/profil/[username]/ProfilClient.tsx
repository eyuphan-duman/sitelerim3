'use client';
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Camera, MapPin, Link as LinkIcon, Calendar, MessageCircle, Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Post { id: string; body: string; authorName: string; uid: string; createdAt: any; commentCount: number; reactionsData?: Record<string, string>; category?: string; }
const ADMIN = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

function Empty({ icon, text }: { icon: string; text: string }) {
  return <div style={{ padding:'60px 20px', textAlign:'center', color:'#94a3b8' }}><div style={{ fontSize:'2.5rem', marginBottom:12 }}>{icon}</div><p style={{ fontWeight:700 }}>{text}</p></div>;
}

function PostCard({ p, pd, isOwn, userEmail, onDelete }: { p: Post; pd: any; isOwn: boolean; userEmail: string; onDelete: (id: string) => void }) {
  return (
    <div style={{ display:'flex', gap:12, padding:'16px 20px', borderBottom:'1px solid #f1f5f9' }}>
      <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800 }}>
        {pd.photoURL ? <img key={pd.photoURL} src={pd.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (pd.displayName||'U')[0].toUpperCase()}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
          <span style={{ fontWeight:700, color:'#0f172a', fontSize:'0.92rem' }}>{pd.displayName||pd.username}</span>
          <span style={{ color:'#94a3b8', fontSize:'0.82rem' }}>@{pd.username}</span>
          <span style={{ color:'#94a3b8', fontSize:'0.8rem' }}>· {p.createdAt?.toLocaleDateString?.('tr-TR')}</span>
          {p.category && <span style={{ background:'#f1f5f9', color:'#64748b', fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:999, textTransform:'uppercase' }}>{p.category}</span>}
        </div>
        <p style={{ color:'#334155', fontSize:'0.95rem', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>{p.body}</p>
        <div style={{ display:'flex', gap:16, marginTop:10, color:'#94a3b8', fontSize:'0.82rem' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><MessageCircle size={14}/>{p.commentCount}</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Heart size={14}/>{Object.keys(p.reactionsData||{}).length}</span>
          {(isOwn || ADMIN.includes(userEmail)) && (
            <button onClick={() => onDelete(p.id)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', padding:'2px 6px', borderRadius:4 }} onMouseOver={e=>{e.currentTarget.style.color='#ef4444'}} onMouseOut={e=>{e.currentTarget.style.color='#94a3b8'}}>
              <Trash2 size={13}/>Sil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilClient({ username }: { username: string }) {
  const { user, userProfile } = useAuth();
  const [pd, setPd] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [likes, setLikes] = useState<Post[]>([]);
  const [tab, setTab] = useState<'posts'|'replies'|'likes'>('posts');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followings, setFollowings] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [ed, setEd] = useState({ displayName:'', bio:'', location:'', website:'' });
  const [saving, setSaving] = useState(false);
  const [upPhoto, setUpPhoto] = useState(false);
  const [upCover, setUpCover] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let data: any = null;
        const strats = [
          () => getDocs(query(collection(db,'users'), where('username','==',username))),
          () => getDocs(query(collection(db,'users'), where('username','==',username.toLowerCase()))),
          () => getDocs(query(collection(db,'users'), where('displayName','==',username))),
        ];
        for (const s of strats) { try { const snap = await s(); if (!snap.empty) { data = snap.docs[0].data(); break; } } catch {} }
        if (!data) { try { const d = await getDoc(doc(db,'users',username)); if (d.exists()) data = d.data(); } catch {} }
        if (data) {
          setPd(data);
          setEd({ displayName: data.displayName||'', bio: data.bio||'', location: data.location||'', website: data.website||'' });
          try {
            const ps = await getDocs(query(collection(db,'forum'), where('uid','==',data.uid)));
            const pList = ps.docs.map(d => ({ id:d.id, ...d.data(), createdAt: d.data().createdAt?.toDate()||new Date() })) as Post[];
            setPosts(pList.sort((a,b) => b.createdAt - a.createdAt));
          } catch (e) { console.error('Posts fetch error:', e); }
          try {
            const all = await getDocs(collection(db,'forum'));
            setLikes(all.docs.filter(d => d.data().reactionsData?.[data.uid]).map(d => ({ id:d.id, ...d.data(), createdAt: d.data().createdAt?.toDate()||new Date() })) as Post[]);
            const rList: any[] = [];
            for (const p of all.docs) {
              try {
                const cs = await getDocs(query(collection(db,'forum',p.id,'comments'), where('uid','==',data.uid)));
                cs.docs.forEach(c => rList.push({ ...c.data(), id:c.id, postId:p.id, postBody:p.data().body?.slice(0,60), createdAt:c.data().createdAt?.toDate()||new Date() }));
              } catch {}
            }
            setReplies(rList.sort((a,b) => b.createdAt - a.createdAt));
          } catch (e) { console.error('Likes/replies fetch error:', e); }
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  useEffect(() => {
    if (!pd) return;
    const u1 = onSnapshot(query(collection(db,'follows'), where('followingId','==',pd.uid)), s => setFollowers(s.size));
    const u2 = onSnapshot(query(collection(db,'follows'), where('followerId','==',pd.uid)), s => setFollowings(s.size));
    if (user && !user.isAnonymous) getDoc(doc(db,'follows',`${user.uid}_${pd.uid}`)).then(d => setFollowing(d.exists()));
    return () => { u1(); u2(); };
  }, [pd, user]);

  const uploadImg = async (file: File, path: string): Promise<string> => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', `manav-platform/${path.split('/')[0]}`);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) return data.url;
    } catch (e) {
      console.warn('Cloudinary upload fallback to Firebase storage:', e);
    }
    const r = storageRef(storage, path);
    const t = uploadBytesResumable(r, file);
    return new Promise((res, rej) => {
      t.on('state_changed', null, rej, async () => res(await getDownloadURL(t.snapshot.ref)));
    });
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !user) return;
    setUpPhoto(true);
    try { const url = await uploadImg(f, `avatars/${user.uid}`); await updateDoc(doc(db,'users',user.uid), { photoURL:url }); setPd((p: any) => ({ ...p, photoURL:url })); toast.success('Fotoğraf güncellendi!'); }
    catch { toast.error('Yükleme hatası.'); } finally { setUpPhoto(false); }
  };

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !user) return;
    setUpCover(true);
    try { const url = await uploadImg(f, `covers/${user.uid}`); await updateDoc(doc(db,'users',user.uid), { coverURL:url }); setPd((p: any) => ({ ...p, coverURL:url })); toast.success('Kapak güncellendi!'); }
    catch { toast.error('Yükleme hatası.'); } finally { setUpCover(false); }
  };

  const toggleFollow = async () => {
    if (!user || user.isAnonymous || !pd) return toast.error('Giriş gerekli.');
    const fid = `${user.uid}_${pd.uid}`;
    if (following) { await deleteDoc(doc(db,'follows',fid)); setFollowing(false); }
    else { await setDoc(doc(db,'follows',fid), { followerId:user.uid, followingId:pd.uid, createdAt:serverTimestamp() }); setFollowing(true); }
  };

  const saveProfile = async () => {
    if (!user || !pd) return; setSaving(true);
    try { await updateDoc(doc(db,'users',user.uid), ed); setPd((p: any) => ({ ...p, ...ed })); setEditOpen(false); toast.success('Profil güncellendi!'); }
    catch { toast.error('Hata.'); } finally { setSaving(false); }
  };

  const delPost = async (id: string) => {
    if (!confirm('Silmek istediğine emin misin?')) return;
    await deleteDoc(doc(db,'forum',id)); setPosts(p => p.filter(x => x.id !== id)); toast.success('Silindi.');
  };

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'white' }}><div style={{ width:36, height:36, border:'3px solid #e2e8f0', borderTopColor:'#0f172a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (!pd) return <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}><p style={{ fontSize:'1.2rem', marginBottom:16 }}>👤 Hesap bulunamadı</p><Link href="/forum" style={{ color:'#2563eb' }}>← Foruma Dön</Link></div>;

  const isOwn = user?.uid === pd.uid;
  const joined = pd.createdAt?.toDate?.().toLocaleDateString('tr-TR', { month:'long', year:'numeric' }) || '';

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @media(max-width:600px){.profil-tabs button{padding:12px 10px!important;font-size:0.82rem!important}}`}</style>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e2e8f0', padding:'14px 20px', display:'flex', alignItems:'center', gap:16, zIndex:200 }}>
        <Link href="/forum" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', background:'#f1f5f9', textDecoration:'none', color:'#0f172a' }}><ArrowLeft size={18}/></Link>
        <div>
          <div style={{ fontWeight:800, fontSize:'1rem', color:'#0f172a' }}>{pd.displayName||pd.username}</div>
          <div style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{posts.length} gönderi</div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', background:'white', minHeight:'calc(100vh - 60px)' }}>

        {/* Cover */}
        <div style={{ height:200, position:'relative', background: pd.coverURL ? 'transparent' : 'linear-gradient(135deg,#667eea,#764ba2)', backgroundImage: pd.coverURL ? `url(${pd.coverURL})` : undefined, backgroundSize:'cover', backgroundPosition:'center' }}>
          <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleCover} />
          {isOwn && (
            <button onClick={() => coverRef.current?.click()} style={{ position:'absolute', inset:0, border:'none', background:'rgba(0,0,0,0)', cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:'0.9rem', fontWeight:600, transition:'background 0.2s' }} onMouseOver={e=>{e.currentTarget.style.background='rgba(0,0,0,0.4)'}} onMouseOut={e=>{e.currentTarget.style.background='rgba(0,0,0,0)'}}>
              <Camera size={20}/>{upCover ? 'Yükleniyor...' : 'Kapak Değiştir'}
            </button>
          )}
        </div>

        {/* Avatar + Action row */}
        <div style={{ padding:'0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:-52, marginBottom:16 }}>
          <div style={{ position:'relative' }}>
            <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />
            <div style={{ width:100, height:100, borderRadius:'50%', border:'4px solid white', background:'linear-gradient(135deg,#667eea,#764ba2)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
              {pd.photoURL ? <img key={pd.photoURL} src={pd.photoURL} alt="pp" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (pd.displayName||'U')[0].toUpperCase()}
            </div>
            {isOwn && (
              <button onClick={() => photoRef.current?.click()} disabled={upPhoto} style={{ position:'absolute', bottom:4, right:4, width:30, height:30, borderRadius:'50%', border:'2px solid white', background: upPhoto ? '#64748b' : '#0f172a', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Camera size={13}/>
              </button>
            )}
          </div>
          <div>
            {isOwn
              ? <button onClick={() => setEditOpen(true)} style={{ border:'1.5px solid #e2e8f0', background:'white', color:'#0f172a', borderRadius:999, padding:'9px 20px', fontWeight:700, cursor:'pointer', fontSize:'0.88rem' }}>Profili Düzenle</button>
              : <button onClick={toggleFollow} style={{ background: following ? 'white' : '#0f172a', color: following ? '#0f172a' : 'white', border: following ? '1.5px solid #e2e8f0' : 'none', borderRadius:999, padding:'9px 20px', fontWeight:700, cursor:'pointer', fontSize:'0.88rem' }}>{following ? 'Takip Ediliyor' : 'Takip Et'}</button>
            }
          </div>
        </div>

        {/* Profile info */}
        <div style={{ padding:'0 20px 20px' }}>
          <h1 style={{ fontSize:'1.3rem', fontWeight:800, color:'#0f172a', margin:0 }}>{pd.displayName||pd.username}</h1>
          <p style={{ color:'#94a3b8', fontSize:'0.88rem', margin:'2px 0 12px' }}>@{pd.username}</p>
          {pd.bio && <p style={{ fontSize:'0.97rem', color:'#334155', lineHeight:1.6, marginBottom:12 }}>{pd.bio}</p>}
          <div style={{ display:'flex', flexWrap:'wrap', gap:16, color:'#64748b', fontSize:'0.85rem', marginBottom:16 }}>
            {pd.location && <span style={{ display:'flex', alignItems:'center', gap:5 }}><MapPin size={14}/>{pd.location}</span>}
            {pd.website && <a href={pd.website.startsWith('http') ? pd.website : `https://${pd.website}`} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, color:'#2563eb', textDecoration:'none' }}><LinkIcon size={14}/>{pd.website}</a>}
            {joined && <span style={{ display:'flex', alignItems:'center', gap:5 }}><Calendar size={14}/>Katıldı: {joined}</span>}
          </div>
          <div style={{ display:'flex', gap:24, fontSize:'0.9rem' }}>
            <span><strong style={{ color:'#0f172a' }}>{followings}</strong> <span style={{ color:'#94a3b8' }}>Takip edilen</span></span>
            <span><strong style={{ color:'#0f172a' }}>{followers}</strong> <span style={{ color:'#94a3b8' }}>Takipçi</span></span>
          </div>
        </div>

        {/* Tabs */}
        <div className="profil-tabs" style={{ display:'flex', borderBottom:'1px solid #e2e8f0', borderTop:'1px solid #f1f5f9', position:'sticky', top:60, background:'white', zIndex:100 }}>
          {[['posts','Gönderiler'],['replies','Yanıtlar'],['likes','Beğeniler']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)} style={{ flex:1, padding:'14px 12px', border:'none', background:'none', cursor:'pointer', fontWeight:700, fontSize:'0.88rem', color: tab===k ? '#0f172a' : '#94a3b8', borderBottom: tab===k ? '3px solid #0f172a' : '3px solid transparent', transition:'all 0.2s', whiteSpace:'nowrap' }}>{l}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'posts' && (posts.length === 0 ? <Empty icon="📝" text="Henüz gönderi yok" /> : posts.map(p => <PostCard key={p.id} p={p} pd={pd} isOwn={isOwn} userEmail={user?.email||''} onDelete={delPost} />))}
        {tab === 'replies' && (replies.length === 0 ? <Empty icon="💬" text="Henüz yanıt yok" /> : replies.map((r,i) => (
          <div key={i} style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:'0.78rem', color:'#94a3b8', marginBottom:8 }}>Yanıtladı: <em>"{r.postBody}..."</em></p>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800 }}>
                {pd.photoURL ? <img key={pd.photoURL} src={pd.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (pd.displayName||'U')[0].toUpperCase()}
              </div>
              <div>
                <span style={{ fontWeight:700, fontSize:'0.88rem', color:'#0f172a' }}>{pd.displayName}</span>
                <span style={{ color:'#94a3b8', fontSize:'0.8rem', marginLeft:8 }}>· {r.createdAt?.toLocaleDateString?.('tr-TR')}</span>
                <p style={{ margin:'4px 0 0', fontSize:'0.93rem', color:'#334155', lineHeight:1.6 }}>{r.text}</p>
              </div>
            </div>
          </div>
        )))}
        {tab === 'likes' && (likes.length === 0 ? <Empty icon="❤️" text="Henüz beğeni yok" /> : likes.map(p => (
          <div key={p.id} style={{ display:'flex', gap:12, padding:'16px 20px', borderBottom:'1px solid #f1f5f9' }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800 }}>{(p.authorName||'U')[0].toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                <span style={{ fontWeight:700, color:'#0f172a', fontSize:'0.92rem' }}>{p.authorName}</span>
                <span style={{ color:'#94a3b8', fontSize:'0.8rem' }}>· {p.createdAt?.toLocaleDateString?.('tr-TR')}</span>
              </div>
              <p style={{ color:'#334155', fontSize:'0.95rem', lineHeight:1.6, margin:0, wordBreak:'break-word' }}>{p.body}</p>
              <div style={{ display:'flex', gap:16, marginTop:8, color:'#94a3b8', fontSize:'0.82rem' }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><MessageCircle size={14}/>{p.commentCount}</span>
                <span style={{ display:'flex', alignItems:'center', gap:4, color:'#ef4444' }}><Heart size={14} fill="#ef4444"/>{Object.keys(p.reactionsData||{}).length}</span>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(15,23,42,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setEditOpen(false)}>
          <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:480, padding:28, boxShadow:'0 25px 50px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight:800, fontSize:'1.2rem', color:'#0f172a', marginBottom:24 }}>Profili Düzenle</h2>
            {([['displayName','Ad Soyad','text','Adınız'],['bio','Hakkımda','textarea','Kendinizden bahsedin...'],['location','Konum','text','Şehir, Ülke'],['website','Web Sitesi','text','ornek.com']] as const).map(([k,l,t,ph]) => (
              <div key={k} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{l}</label>
                {t === 'textarea'
                  ? <textarea rows={3} placeholder={ph} value={ed[k as keyof typeof ed]} onChange={e => setEd({...ed,[k]:e.target.value})} style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'11px 14px', fontSize:'0.93rem', outline:'none', resize:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                  : <input type="text" placeholder={ph} value={ed[k as keyof typeof ed]} onChange={e => setEd({...ed,[k]:e.target.value})} style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'11px 14px', fontSize:'0.93rem', outline:'none', boxSizing:'border-box' }} />
                }
              </div>
            ))}
            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              <button onClick={() => setEditOpen(false)} style={{ flex:1, border:'1.5px solid #e2e8f0', borderRadius:999, padding:'12px', fontWeight:700, cursor:'pointer', background:'white', color:'#0f172a' }}>İptal</button>
              <button onClick={saveProfile} disabled={saving} style={{ flex:1, background:'#0f172a', color:'white', border:'none', borderRadius:999, padding:'12px', fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>{saving?'Kaydediliyor...':'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
