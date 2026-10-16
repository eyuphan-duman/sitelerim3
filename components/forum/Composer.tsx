'use client';

/** Bağımsız gönderi kutusu (profil gibi akış dışı sayfalar için) */
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { notifyMentions } from '@/lib/mentionUtils';
import { Avatar, CharRing } from './ui';

const LIMIT = 140;
const CATEGORIES = ['Psikanaliz', 'Varoluş & Anlam', 'Kaygı & Depresyon', 'İlişkiler', 'Çocukluk & Travma', 'Rüyalar', 'Kimlik & Benlik', 'Kişisel Gelişim'];
const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

export default function Composer({ onPosted }: { onPosted?: (post: any) => void }) {
  const { user, userProfile, emailVerified } = useAuth();
  const [body, setBody] = useState('');
  const [cat, setCat] = useState('Psikanaliz');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  if (!user || user.isAnonymous || userProfile?.isBanned) return null;

  const isPsych = Boolean((userProfile?.isPsychologist && (userProfile?.psychologistStatus === 'approved' || !userProfile?.psychologistStatus)) || userProfile?.role === 'psychologist');
  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
  const photoLimitReached = !isPsych && !isAdmin && (userProfile?.photoUploadsUsed || 0) >= 1;

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (photoLimitReached) return toast.error('Görsel ekleme hakkını kullandın. Psikologlar dışında her üye 1 görsel ekleyebilir.');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'manav-platform/forum');
      const data = await (await fetch('/api/upload', { method: 'POST', body: fd })).json();
      if (!data.success) throw new Error(data.error);
      setImageUrl(data.url);
    } catch (err: any) {
      toast.error('Görsel yüklenemedi: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const post = async () => {
    if (!body.trim() && !imageUrl) return;
    if (!emailVerified) return toast.error('Paylaşım yapabilmek için e-posta adresini doğrulaman gerekiyor.');
    setPosting(true);
    const showBadge = isPsych && !userProfile?.hideBadge;
    try {
      const data = {
        body,
        category: cat,
        imageUrl,
        authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
        authorUsername: userProfile?.username || '',
        authorIsPsychologist: showBadge,
        authorHideBadge: Boolean(userProfile?.hideBadge),
        uid: user.uid,
        commentCount: 0,
        createdAt: serverTimestamp(),
        reactionsData: {},
      };
      const ref = await addDoc(collection(db, 'forum'), data);
      if (imageUrl && !isPsych && !isAdmin) {
        try { await updateDoc(doc(db, 'users', user.uid), { photoUploadsUsed: increment(1) }); } catch {}
      }
      try { await notifyMentions({ text: body, postId: ref.id, currentUser: user, userProfile }); } catch {}
      onPosted?.({ ...data, id: ref.id, createdAt: new Date() });
      setBody(''); setImageUrl('');
      toast.success('Paylaşıldı');
    } catch (err: any) {
      toast.error('Paylaşılamadı: ' + (err.message || ''));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fx-compose">
      <Avatar src={userProfile?.photoURL || user.photoURL} name={userProfile?.displayName || user.displayName} size={40} />
      <div className="fx-compose-body">
        <textarea placeholder="Aklından ne geçiyor?" value={body} maxLength={LIMIT} rows={2} onChange={e => setBody(e.target.value.slice(0, LIMIT))} aria-label="Gönderi metni" />
        {imageUrl && (
          <div className="fx-compose-preview">
            <img src={imageUrl} alt="Eklenen görsel" />
            <button type="button" onClick={() => setImageUrl('')} aria-label="Görseli kaldır"><X size={16} /></button>
          </div>
        )}
        <div className="fx-compose-bar">
          <div className="fx-compose-tools">
            <label className="fx-tool" aria-disabled={photoLimitReached || uploading} title={photoLimitReached ? 'Görsel ekleme hakkını kullandın' : 'Görsel ekle'}>
              {uploading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={19} />}
              <input type="file" accept="image/*" hidden onChange={upload} disabled={uploading || photoLimitReached} />
            </label>
            <select className="fx-select" value={cat} onChange={e => setCat(e.target.value)} aria-label="Konu">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="fx-compose-send">
            <CharRing length={body.length} limit={LIMIT} />
            <button type="button" className="fx-btn fx-btn-primary" disabled={posting || (!body.trim() && !imageUrl)} onClick={post}>
              {posting ? 'Paylaşılıyor…' : 'Paylaş'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
