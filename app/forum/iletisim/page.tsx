'use client';

import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import ForumShell from '@/components/forum/ForumShell';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

const CATEGORIES = [
  { id: 'istek', label: 'İstek' },
  { id: 'oneri', label: 'Öneri' },
  { id: 'sikayet', label: 'Şikayet' },
  { id: 'diger', label: 'Diğer' },
] as const;
type Category = (typeof CATEGORIES)[number]['id'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Logos iletişim: istek, öneri ve şikayetler yönetim panelindeki Mesajlar bölümüne düşer */
export default function ForumContactPage() {
  const { user, userProfile } = useAuth();
  const member = Boolean(user && !user.isAnonymous);
  const [category, setCategory] = useState<Category>('oneri');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Üyenin adı ve e-postası ilk açılışta önerilir; e-posta alanı yine de zorunludur ve değiştirilebilir
  const shownName = name || (member ? userProfile?.displayName || '' : '');
  const shownEmail = email || (member ? user?.email || '' : '');
  const emailOk = EMAIL_RE.test(shownEmail.trim());
  const label = CATEGORIES.find(c => c.id === category)!.label;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailOk) return toast.error('Sana geri dönebilmemiz için geçerli bir e-posta adresi yaz.');
    if (!message.trim()) return toast.error('Mesajını yaz.');
    setBusy(true);
    const data = {
      name: (shownName.trim() || 'Logos üyesi').slice(0, 100),
      email: shownEmail.trim().toLowerCase(),
      subject: (subject.trim() || label).slice(0, 200),
      message: message.trim().slice(0, 5000),
      category,
      source: 'forum',
      status: 'unread',
      createdAt: serverTimestamp(),
      ...(member && user ? { uid: user.uid, username: userProfile?.username || '' } : {}),
    };
    try {
      await addDoc(collection(db, 'messages'), data);
      // Yöneticiye e-posta bildirimi (başarısız olsa da mesaj kaydedildi)
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, subject: `Logos · ${label}: ${data.subject}`, message: data.message }),
      }).catch(() => {});
      setSentTo(data.email);
    } catch {
      toast.error('Mesaj gönderilemedi. Lütfen biraz sonra tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ForumShell active="contact">
      {() => (
        <>
          <div className="fx-head">
            <div className="fx-thead fx-thead-flat">
              <h2 style={{ flex: 1 }}>İletişim</h2>
            </div>
          </div>

          {sentTo ? (
            <div className="fx-contact-done">
              <CheckCircle2 size={40} />
              <h3>Mesajın bize ulaştı</h3>
              <p>En kısa sürede <b>{sentTo}</b> adresine dönüş yapacağız.</p>
              <button type="button" className="fx-btn fx-btn-outline" onClick={() => { setSentTo(null); setMessage(''); setSubject(''); setTouched(false); }}>
                Yeni mesaj yaz
              </button>
            </div>
          ) : (
            <form className="fx-contact" onSubmit={submit} noValidate>
              <p className="fx-contact-intro">İsteklerini, önerilerini ve şikayetlerini buraya yazabilirsin. Mesajını yalnızca yöneticiler okur.</p>

              <div className="fx-contact-label" id="contact_cat">Ne hakkında?</div>
              <div className="fx-contact-cats" role="radiogroup" aria-labelledby="contact_cat">
                {CATEGORIES.map(c => (
                  <button key={c.id} type="button" role="radio" aria-checked={category === c.id}
                    className={`fx-contact-cat ${category === c.id ? 'is-on' : ''}`} onClick={() => setCategory(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>

              <label className="fx-contact-label" htmlFor="contact_name">Adın <small>(isteğe bağlı)</small></label>
              <input id="contact_name" className="fx-contact-input" value={shownName} maxLength={100} onChange={e => setName(e.target.value)} autoComplete="name" />

              <label className="fx-contact-label" htmlFor="contact_email">E-posta adresin <small>(zorunlu)</small></label>
              <input id="contact_email" type="email" className={`fx-contact-input ${touched && !emailOk ? 'is-bad' : ''}`} value={shownEmail} maxLength={200}
                onChange={e => setEmail(e.target.value)} onBlur={() => setTouched(true)} autoComplete="email" required aria-describedby="contact_email_help" />
              <small id="contact_email_help" className={`fx-contact-help ${touched && !emailOk ? 'is-bad' : ''}`}>
                {touched && !emailOk ? 'Geçerli bir e-posta adresi yaz (ör. ad@gmail.com).' : 'Sana yalnızca bu adresten dönüş yapacağız.'}
              </small>

              <label className="fx-contact-label" htmlFor="contact_subject">Konu <small>(isteğe bağlı)</small></label>
              <input id="contact_subject" className="fx-contact-input" value={subject} maxLength={200} onChange={e => setSubject(e.target.value)} placeholder={label} />

              <label className="fx-contact-label" htmlFor="contact_message">Mesajın</label>
              <textarea id="contact_message" className="fx-field" value={message} maxLength={5000} onChange={e => setMessage(e.target.value)} required
                placeholder={category === 'sikayet' ? 'Neyle ilgili şikayetin olduğunu anlat; varsa gönderi ya da kullanıcı adını yaz.' : 'Mesajını yaz…'} />

              <div className="fx-contact-foot">
                <button type="submit" className="fx-btn fx-btn-primary" disabled={busy || !message.trim() || !emailOk}>
                  {busy ? 'Gönderiliyor…' : 'Gönder'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </ForumShell>
  );
}
