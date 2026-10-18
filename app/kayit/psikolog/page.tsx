'use client';

import { uploadFetch } from '@/lib/notify';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Award, Upload, CheckCircle2, ShieldCheck, ArrowLeft, ArrowRight, Loader, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import TermsModal from '@/components/TermsModal';
import { sanitizeUsername, getUsernameValidationError } from '@/lib/usernameUtils';
import { calculateAge, getMaxBirthDateFor18, getBirthDateValidationError } from '@/lib/ageUtils';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { getPasswordError } from '@/lib/passwordUtils';

export default function PsychologistRegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    birthDate: '',
    username: '',
    email: '',
    password: '',
    title: 'Psikolog',
    university: '',
    diplomaUrl: '',
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [diplomaFileName, setDiplomaFileName] = useState('');
  const [uploadingDiploma, setUploadingDiploma] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDiplomaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDiplomaFileName(file.name);
    setUploadingDiploma(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'manav-platform/diplomas');

      const res = await uploadFetch({
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Yükleme başarısız');

      setForm(prev => ({ ...prev, diplomaUrl: data.url }));
      toast.success('Mezun belgesi yüklendi');
    } catch (err: any) {
      toast.error('Belge yüklenirken hata: ' + (err.message || ''));
      setDiplomaFileName('');
    } finally {
      setUploadingDiploma(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.username.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const pwError = getPasswordError(form.password);
    if (pwError) {
      toast.error(pwError);
      return;
    }

    if (!form.birthDate) {
      toast.error('Lütfen doğum tarihinizi girin.');
      return;
    }

    const ageError = getBirthDateValidationError(form.birthDate);
    if (ageError) {
      toast.error(ageError);
      return;
    }

    if (!form.diplomaUrl) {
      toast.error('Lütfen psikolog doğrulaması için e-Devlet mezun belgenizi yükleyin.');
      return;
    }

    if (!termsAccepted) {
      toast.error('Lütfen kayıt sözleşmesini ve KVKK aydınlatma metnini onaylayın.');
      return;
    }

    const uError = getUsernameValidationError(form.username);
    if (uError) {
      toast.error(uError);
      return;
    }
    const cleanUsername = sanitizeUsername(form.username);

    setSubmitting(true);
    try {
      await signUp(
        cleanUsername,
        form.email,
        form.password,
        {
          isPsychologist: true,
          role: 'psychologist',
          title: form.title || 'Psikolog',
          university: form.university,
          diplomaUrl: form.diplomaUrl,
          fullName: form.fullName,
          birthDate: form.birthDate,
        }
      );

      toast.success(
        'Psikolog başvurunuz ve kaydınız başarıyla alındı! Üyeliğinizi tamamlamak için ' + form.email + ' adresine onay bağlantısı gönderdik. Lütfen gelen kutunuzu ve SPAM (gereksiz) klasörünüzü kontrol ediniz; e-postanızı onayladıktan sonra giriş yapabilirsiniz.',
        { duration: 12000 }
      );
      router.push(`/forum/profil/${encodeURIComponent(cleanUsername)}`);
    } catch (err: any) {
      toast.error('Kayıt oluşturulamadı: ' + (err.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #070e1b 0%, #0d1e38 100%)', color: 'white', display: 'flex', flexDirection: 'column', padding: '120px 16px 60px', boxSizing: 'border-box' }}>
      {/* Top back bar */}
      <div style={{ maxWidth: 640, width: '100%', margin: '0 auto 20px', display: 'flex', alignItems: 'center' }}>
        <Link
          href="/forum"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#facc15',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '8px 16px',
            borderRadius: 999,
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.22)';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
          }}
        >
          <ArrowLeft size={16} /> Topluluğa Dön
        </Link>
      </div>

      {/* Main card */}
      <div
        style={{
          maxWidth: 640,
          width: '100%',
          margin: '0 auto',
          background: 'rgba(10, 22, 40, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(212, 175, 55, 0.12)',
          borderRadius: 20,
          padding: '36px 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(201, 169, 110, 0.15)',
              border: '1px solid rgba(201, 169, 110, 0.4)',
              padding: '6px 16px',
              borderRadius: 999,
              color: 'var(--gold-light)',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            <Award size={15} color="var(--gold)" />
            <span>Uzman & Psikolog Doğrulama Kaydı</span>
          </div>

          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 4vw, 2.3rem)', fontWeight: 800, margin: '0 0 12px', color: 'white' }}>
            Psikolog Olarak Katılın
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Diploma veya mezuniyet belgeniz ile kayıt olun; forumda ve paylaşımlarınızda adınızın yanında resmi <strong>Psikolog</strong> rozeti yer alsın.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Ad Soyad & Doğum Tarihi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                Ad Soyad *
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="Örn: Psk. Ahmet Yılmaz"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                Doğum Tarihi * (18 Yaş ve Üzeri)
              </label>
              <input
                type="date"
                required
                max={getMaxBirthDateFor18()}
                value={form.birthDate}
                onChange={e => setForm({ ...form, birthDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: form.birthDate && getBirthDateValidationError(form.birthDate) ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
              />
              {form.birthDate && getBirthDateValidationError(form.birthDate) && (
                <div style={{ fontSize: '0.74rem', color: '#f87171', marginTop: 4 }}>
                  {getBirthDateValidationError(form.birthDate)}
                </div>
              )}
              {form.birthDate && !getBirthDateValidationError(form.birthDate) && (
                <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600, marginTop: 4 }}>
                  Yaş doğrulaması onaylandı ({calculateAge(form.birthDate)} yaşındasınız).
                </div>
              )}
              {!form.birthDate && (
                <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  Platforma yalnızca 18 yaş ve üzeri kişiler kayıt olabilir.
                </div>
              )}
            </div>
          </div>

          {/* Kullanıcı Adı */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
              Kullanıcı Adı *
            </label>
            <input
              type="text"
              required
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value.replace(/^@+/, '') })}
              placeholder="Örn: ahmetyilmaz"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              Başına @ koymanıza gerek yoktur, profilinizde sistem otomatik ekler. Yalnızca harf (a-z), rakam ve alt çizgi (_).
            </div>
            {form.username && (
              <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, marginTop: 3 }}>
                Profil adınız: @{sanitizeUsername(form.username)}
              </div>
            )}
          </div>

          {/* E-posta & Şifre */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                E-posta Adresi *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="psikolog@ornek.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                Şifre * (En az 6 karakter ve bir rakam)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <PasswordStrengthMeter password={form.password} mutedColor="rgba(255,255,255,0.65)" />
            </div>
          </div>

          {/* Mesleki Unvan & Üniversite */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                Mesleki Unvan
              </label>
              <select
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: '#0d1e38',
                  color: 'white',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Psikolog">Psikolog</option>
                <option value="Klinik Psikolog">Klinik Psikolog</option>
                <option value="Uzman Psikolog">Uzman Psikolog</option>
                <option value="Varoluşçu Psikoterapist">Varoluşçu Psikoterapist</option>
                <option value="Psikolojik Danışman (PDR)">Psikolojik Danışman (PDR)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                Mezun Olunan Üniversite & Bölüm
              </label>
              <input
                type="text"
                value={form.university}
                onChange={e => setForm({ ...form, university: e.target.value })}
                placeholder="Örn: Hacettepe Üniversitesi Psikoloji"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Diploma Yükleme Alanı */}
          <div
            style={{
              padding: '20px',
              borderRadius: 12,
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1.5px dashed rgba(212, 175, 55, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 12,
            }}
          >
            <ShieldCheck size={32} color="var(--gold)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'white', marginBottom: 4 }}>
                e-Devlet Mezun Belgesi *
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', maxWidth: 440 }}>
                e-Devlet'teki "Yükseköğretim Mezun Belgesi Sorgulama" hizmetinden aldığın barkodlu belgeyi yükle (PDF, JPG veya PNG). Belge yalnızca yönetici tarafından, başvurunu doğrulamak için incelenir. Kontrol edildikten sonra belgeniz otomatik olarak sistem tarafından silinir.
              </div>
            </div>

            {form.diplomaUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#166534', color: '#bbf7d0', padding: '8px 18px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Belge Başarıyla Yüklendi
                </div>
                {diplomaFileName && (
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} color="var(--gold)" />
                    <span>{diplomaFileName}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <a
                    href={form.diplomaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--gold)',
                      background: 'rgba(212, 175, 55, 0.15)',
                      padding: '6px 14px',
                      borderRadius: 6,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={13} /> Belgeyi Görüntüle
                  </a>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'white',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '6px 14px',
                      borderRadius: 6,
                      cursor: uploadingDiploma ? 'wait' : 'pointer',
                    }}
                  >
                    <RefreshCw size={13} /> Farklı Dosya Yükle
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingDiploma}
                      style={{ display: 'none' }}
                      onChange={handleDiplomaUpload}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--gold)',
                  color: 'var(--navy)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  padding: '10px 22px',
                  borderRadius: 8,
                  cursor: uploadingDiploma ? 'wait' : 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
                }}
              >
                {uploadingDiploma ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Belge Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Mezun Belgesi Seç ve Yükle</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={uploadingDiploma}
                  style={{ display: 'none' }}
                  onChange={handleDiplomaUpload}
                />
              </label>
            )}
          </div>

          {/* Terms & Conditions Checkbox & Document Buttons */}
          <div 
            style={{
              background: termsAccepted ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: termsAccepted ? '#eab308' : 'rgba(255, 255, 255, 0.15)',
              boxShadow: termsAccepted ? '0 0 20px rgba(212, 175, 55, 0.25)' : 'none',
            }}
            className="rounded-2xl border p-4 sm:p-5 my-4 flex flex-col gap-3.5 transition-all text-left"
          >
            {/* Two large, clearly visible buttons to open legal docs */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTermsModalOpen(true)}
                className="flex-1 min-h-[46px] py-2.5 px-3.5 rounded-xl text-[13.5px] sm:text-[14px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  color: '#facc15',
                  border: '1.5px solid rgba(212, 175, 55, 0.4)',
                }}
              >
                <FileText size={17} className="text-amber-400" />
                <span>Sözleşmeyi Oku</span>
              </button>

              <button
                type="button"
                onClick={() => setTermsModalOpen(true)}
                className="flex-1 min-h-[46px] py-2.5 px-3.5 rounded-xl text-[13.5px] sm:text-[14px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#93c5fd',
                  border: '1.5px solid rgba(59, 130, 246, 0.4)',
                }}
              >
                <ShieldCheck size={17} className="text-blue-400" />
                <span>KVKK Metni</span>
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', margin: '2px 0' }} />

            {/* Big Checkable Row */}
            <div 
              onClick={() => setTermsAccepted(!termsAccepted)}
              className="flex items-center gap-3.5 cursor-pointer select-none py-1"
            >
              <input
                type="checkbox"
                id="psych_terms_checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-[22px] h-[22px] rounded-md cursor-pointer shrink-0 accent-[#b8965a]"
                required
              />
              <label
                htmlFor="psych_terms_checkbox"
                className="text-[14px] sm:text-[15px] font-bold leading-snug text-white cursor-pointer select-none"
              >
                Kullanıcı Sözleşmesini ve KVKK Metnini Okudum, Onaylıyorum.
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || uploadingDiploma || !termsAccepted}
            className="btn-gold"
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: 12,
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: submitting ? 'wait' : 'pointer',
              opacity: !termsAccepted ? 0.45 : 1,
              marginTop: 16,
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)'
            }}
          >
            {submitting ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span>Kaydınız Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <span>Psikolog Hesabımı Oluştur</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
          Normal danışan veya üye misiniz?{' '}
          <Link href="/forum" style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'none' }}>
            Standart Kayıt Yapın
          </Link>
        </div>
      </div>

      {/* Legal Terms & KVKK Modal */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => setTermsAccepted(true)}
        isDark={true}
      />
    </div>
  );
}
