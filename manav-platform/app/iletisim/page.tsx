'use client';
import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LinkedInIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function IletisimPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      // 1. Veritabanına kaydet (Asıl işlem)
      await addDoc(collection(db, 'messages'), { ...form, createdAt: serverTimestamp(), status: 'unread' });
      
      // 2. E-posta bildirimini tetikle (Yardımcı işlem - hata oluşursa ana akışı bozmaz)
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (!res.ok) {
          console.warn('E-posta bildirimi gönderilemedi, ancak mesaj veritabanına başarıyla kaydedildi.');
        }
      } catch (emailError) {
        console.error('E-posta API çağrısı sırasında hata oluştu:', emailError);
      }

      // Mesaj Firestore'a başarıyla kaydedildiği için kullanıcıya başarı mesajı gösteriyoruz
      setSent(true); 
      toast.success('Mesajınız gönderildi!');

      // Google Ads Conversion Tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ads_conversion_Ki_i_1');
      }

      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Mesaj veritabanına kaydedilirken hata oluştu:', error);
      toast.error('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    }
    finally { setSubmitting(false); }
  };

  const infos = [
    { icon: <MapPin size={18} color="var(--gold)"/>, label: 'Adres', val: 'Polatlı/ANKARA\nÇankaya/ANKARA', href: undefined },
    { icon: <Phone size={18} color="var(--gold)"/>, label: 'Telefon', val: '+90 507 875 15 03', href: 'tel:+905078751503' },
    { icon: <Mail size={18} color="var(--gold)"/>, label: 'E-posta', val: 'pskfurkan.manav@gmail.com', href: 'mailto:pskfurkan.manav@gmail.com' },
    { icon: <Clock size={18} color="var(--gold)"/>, label: 'Çalışma Saatleri', val: 'Pzt–Cuma: 09:00–18:00\nCumartesi: 10:00–14:00', href: undefined },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sand-light)' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div className="eyebrow" style={{ marginBottom: 20 }}>Ankara & Online</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.8rem,5vw,4.5rem)', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: 24 }}>
            İletişim
          </h1>
          <div className="gold-line" style={{ marginBottom: 24 }}/>
          <p className="crimson" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.1rem', maxWidth: 520 }}>
            Sorularınız veya herhangi bir konuda iletişime geçebilirsiniz. En geç 24 saat içinde dönüş yapılır.
          </p>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 64, paddingBottom: 80 }}>
        <div className="iletisim-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40, alignItems: 'start' }}>

          {/* Left column */}
          <div>
            {/* Hızlı İletişim Uyarı Bannerı */}
            <div style={{ 
              background: 'rgba(201, 169, 110, 0.08)', 
              border: '1px solid rgba(201, 169, 110, 0.25)', 
              borderRadius: 4, 
              padding: '16px 20px', 
              marginBottom: 24, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 14 
            }}>
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚡</div>
              <p style={{ color: 'var(--navy)', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: 'var(--gold-dim)' }}>En Hızlı İletişim Yöntemi:</strong> Randevu ve acil konular için telefon üzerinden doğrudan arama yapmak (+90 507 875 15 03) kullanıcılarımız için en hızlı ve etkili iletişim yöntemidir.
              </p>
            </div>

            {/* Contact cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {infos.map(item => (
                <div key={item.label} className="contact-row">
                  <div style={{ width: 40, height: 40, borderRadius: 3, background: 'rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>{item.label}</div>
                    {item.href ? (
                      <a href={item.href} style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none' }}>{item.val}</a>
                    ) : (
                      <p style={{ color: 'var(--navy)', fontWeight: 500, fontSize: '0.88rem', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{item.val}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div style={{ background: 'white', borderRadius: 4, padding: '20px 24px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(10,22,40,0.04)', marginBottom: 28 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>Sosyal Medya</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'Instagram', icon: '📸', href: 'https://www.instagram.com/pskfurkanmanav/' },
                  { label: 'YouTube', icon: '▶️', href: 'https://www.youtube.com/@pskfurkanmanav' },
                  { label: 'LinkedIn', icon: <LinkedInIcon/>, href: 'https://www.linkedin.com/in/pskfurkanmanav/' },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold-dim)'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}>
                    {s.icon} {s.label}
                  </a>
                ))}
              </div>
            </div>

          </div>

          {/* Right column — Form */}
          <div style={{ background: 'white', borderRadius: 4, padding: 'clamp(24px, 4vw, 44px) clamp(20px, 4vw, 40px)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(10,22,40,0.07)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid #86efac', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={28} color="#22c55e"/>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Mesajınız Alındı!</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 28, lineHeight: 1.6 }}>
                  En geç 24 saat içinde size dönüş yapılacaktır. E-postanızı kontrol etmeyi unutmayın.
                </p>
                <button onClick={() => setSent(false)} className="btn-dark-outline">
                  Yeni Mesaj Gönder
                </button>
              </div>
            ) : (
              <>
                <div className="gold-line" style={{ marginBottom: 24 }}/>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                  Mesaj Gönderin
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 32 }}>
                  Tüm mesajlara 24 saat içinde yanıt verilmektedir.
                </p>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="iletisim-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[{k:'name',lbl:'Adınız',ph:'Adınız Soyadınız',t:'text'},{k:'email',lbl:'E-posta',ph:'ornek@mail.com',t:'email'}].map(f => (
                      <div key={f.k}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>{f.lbl}</label>
                        <input type={f.t} className="input-field" placeholder={f.ph} required value={(form as Record<string,string>)[f.k]} onChange={e => setForm({...form, [f.k]: e.target.value})}/>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Konu</label>
                    <input className="input-field" placeholder="Mesajınızın konusu" required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}/>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Mesajınız</label>
                    <textarea className="input-field" style={{ minHeight: 160, resize: 'none' }} placeholder="Mesajınızı buraya yazın..." required value={form.message} onChange={e => setForm({...form, message: e.target.value})}/>
                  </div>
                  <button type="submit" disabled={submitting} className="btn-gold" style={{ justifyContent: 'center' }}>
                    <Send size={14}/> {submitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#ccc' }}>
                    Gönderilen mesajlar gizlilik politikamız çerçevesinde işlenir.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}