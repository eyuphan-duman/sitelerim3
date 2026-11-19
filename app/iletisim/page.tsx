'use client';
import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);

export default function IletisimPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'messages'), { ...form, createdAt: serverTimestamp(), status: 'unread' });

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          console.warn('E-posta bildirimi gönderilemedi, ancak mesaj veritabanına başarıyla kaydedildi.');
        }
      } catch (emailError) {
        console.error('E-posta API çağrısı sırasında hata oluştu:', emailError);
      }

      setSent(true);
      toast.success('Mesajınız gönderildi!');

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ads_conversion_Ki_i_1');
      }

      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Mesaj veritabanına kaydedilirken hata oluştu:', error);
      toast.error('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const infos = [
    { no: '01', icon: <Phone size={16} />, label: 'Telefon & Doğrudan Arama', val: '+90 507 875 15 03', href: 'tel:+905078751503' },
    { no: '02', icon: <Mail size={16} />, label: 'E-posta Adresi', val: 'pskfurkan.manav@gmail.com', href: 'mailto:pskfurkan.manav@gmail.com' },
    { no: '03', icon: <MapPin size={16} />, label: 'Yüz Yüze Görüşme Lokasyonları', val: 'Çankaya / Ankara  ·  Polatlı / Ankara', href: undefined },
    { no: '04', icon: <Clock size={16} />, label: 'Çalışma Saatleri', val: 'Pazartesi – Cuma: 09:00 – 18:00\nCumartesi: 10:00 – 14:00', href: undefined },
  ];

  return (
    <div className="ed-page">
      {/* ── ÜST KAPAK (MASTHEAD) ── */}
      <header className="ed-hero">
        <div className="hx-grain" aria-hidden="true" />
        <div className="hm-wrap">
          <div className="ed-hero-bar">
            <span className="ed-hero-eyebrow">Yüz Yüze & Online Psikoterapi</span>
            <span className="ed-hero-rule" aria-hidden="true" />
            <span className="ed-hero-place">Çankaya · Polatlı · Online</span>
          </div>

          <div className="ed-hero-grid">
            <div>
              <h1 className="ed-hero-title">İletişim</h1>
              <p className="ed-hero-sub">
                Yüz yüze veya online seans süreçleri hakkında bilgi almak, ön görüşme planlamak ya da sorularınızı iletmek için ulaşabilirsiniz.
              </p>
            </div>
            <div className="ed-hero-actions">
              <a href="tel:+905078751503" className="hx-btn">
                <Phone size={15} strokeWidth={1.7} />
                <span>+90 507 875 15 03</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── İLETİŞİM GÖVDESİ (1480px 2 SÜTUN) ── */}
      <div className="hm-wrap ed-body">
        <div className="il-layout">
          {/* Sol Sütun: İletişim Fihristi & Hızlı Arama Notu */}
          <div className="il-left">
            <div className="il-direct-box">
              <div className="il-direct-head">
                <span>ÖNCELİKLİ İLETİŞİM NOTU</span>
                <span>DOĞRUDAN HAT</span>
              </div>
              <h3>Randevu ve seans planlaması için en hızlı yöntem</h3>
              <p>
                Randevu oluşturmak veya acil bilgi almak için telefon üzerinden doğrudan arama yapmak (<strong>+90 507 875 15 03</strong>) en hızlı ve etkili iletişim yöntemidir.
              </p>
              <a href="tel:+905078751503" className="il-direct-cta">
                <span>Telefonla Hemen Ara</span>
                <ArrowUpRight size={15} strokeWidth={1.6} />
              </a>
            </div>

            <div className="il-ledger">
              <div className="il-ledger-head">
                <span>İLETİŞİM BİLGİLERİ</span>
                <span>01 — 04</span>
              </div>
              {infos.map(item => (
                <div key={item.label} className="il-ledger-row">
                  <span className="il-ledger-no">{item.no}</span>
                  <div className="il-ledger-content">
                    <span className="il-ledger-label">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.href ? (
                      <a href={item.href} className="il-ledger-val is-link">{item.val}</a>
                    ) : (
                      <p className="il-ledger-val">{item.val}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="il-social-box">
              <span className="il-social-title">Sosyal Medya & Dijital Kanallar</span>
              <div className="il-social-links">
                {[
                  { label: 'Instagram', icon: <InstagramIcon />, href: 'https://www.instagram.com/pskfurkanmanav/' },
                  { label: 'YouTube', icon: <YoutubeIcon />, href: 'https://www.youtube.com/@pskfurkanmanav' },
                  { label: 'LinkedIn', icon: <LinkedInIcon />, href: 'https://www.linkedin.com/in/pskfurkanmanav/' },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="il-social-btn"
                  >
                    <span>{s.icon} {s.label}</span>
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Sütun: Editoryal Mesaj Formu */}
          <div className="il-form-card">
            {sent ? (
              <div className="il-sent-box">
                <div className="il-sent-icon">
                  <CheckCircle size={28} strokeWidth={1.6} />
                </div>
                <h3>Mesajınız Kaydedildi</h3>
                <p>
                  İletiniz başarıyla alındı. En geç 24 saat içinde belirttiğiniz e-posta adresi üzerinden size dönüş yapılacaktır.
                </p>
                <button type="button" onClick={() => setSent(false)} className="hm-btn-outline">
                  Yeni Mesaj Gönder
                </button>
              </div>
            ) : (
              <>
                <div className="il-form-head">
                  <span className="il-form-eyebrow">Yazılı İletişim Formu</span>
                  <h2>Mesaj Gönderin</h2>
                  <p>Gönderdiğiniz tüm iletilere en geç 24 saat içinde yanıt verilmektedir.</p>
                </div>

                <form onSubmit={submit} className="il-form">
                  <div className="il-form-row">
                    <div>
                      <label htmlFor="il-name">Adınız Soyadınız</label>
                      <input
                        id="il-name"
                        type="text"
                        className="il-input"
                        placeholder="Adınız Soyadınız"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="il-email">E-posta Adresiniz</label>
                      <input
                        id="il-email"
                        type="email"
                        className="il-input"
                        placeholder="ornek@mail.com"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="il-subject">Konu</label>
                    <input
                      id="il-subject"
                      type="text"
                      className="il-input"
                      placeholder="Örn: Ön görüşme talebi, seans bilgisi..."
                      required
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="il-message">Mesajınız</label>
                    <textarea
                      id="il-message"
                      className="il-input il-textarea"
                      placeholder="Sormak veya paylaşmak istediğiniz konuyu buraya yazabilirsiniz..."
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  <div className="il-form-foot">
                    <p className="il-privacy-note">
                      Gönderilen tüm iletiler mesleki gizlilik ilkeleri çerçevesinde korunur.
                    </p>
                    <button type="submit" disabled={submitting} className="hm-btn-dark">
                      <Send size={14} />
                      <span>{submitting ? 'Gönderiliyor...' : 'Mesajı İlet'}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
