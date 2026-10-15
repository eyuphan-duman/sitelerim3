'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { X as CloseIcon, Loader, Award, FileText, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TermsModal from './TermsModal';
import { sanitizeUsername, getUsernameValidationError } from '@/lib/usernameUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export default function AuthModal({ isOpen, onClose, isDark }: Props) {
  const { signIn, signUp, signInWithGoogle, signUpWithGoogle, signInAsGuest, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [detectedDark, setDetectedDark] = useState(false);

  useEffect(() => {
    if (typeof isDark === 'boolean') {
      setDetectedDark(isDark);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('forum_theme');
      setDetectedDark(saved === 'dark' || document.documentElement.classList.contains('forum-dark'));
    }
  }, [isDark, isOpen]);

  const dark = isDark ?? detectedDark;

  // Modal fade animation
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      setResetSentEmail(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && !termsAccepted) {
      toast.error('Lütfen kayıt sözleşmesini ve KVKK aydınlatma metnini onaylayın.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const identifier = form.username.trim() || form.email.trim();
        const cred: any = await signIn(identifier, form.password);
        if (cred?.user && !cred.user.emailVerified) {
          toast('Giriş başarılı! Ancak e-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki onay linkine tıklayın.', { icon: '✉️', duration: 7000 });
        } else {
          toast.success('Giriş başarılı, hoş geldin!');
        }
        onClose();
      } else if (mode === 'signup') {
        const uError = getUsernameValidationError(form.username);
        if (uError) {
          toast.error(uError);
          setLoading(false);
          return;
        }
        const cleanUname = sanitizeUsername(form.username);
        await signUp(cleanUname, form.email.trim(), form.password);
        toast.success('Hesabın oluşturuldu! Forumda paylaşım ve etkileşim yapabilmek için lütfen e-postana gönderdiğimiz doğrulama linkine tıkla.', { duration: 8000 });
        onClose();
      } else if (mode === 'forgot') {
        const identifier = form.username.trim() || form.email.trim();
        if (!identifier) {
          toast.error('Lütfen kullanıcı adınızı veya e-posta adresinizi girin.');
          setLoading(false);
          return;
        }
        const sentEmail = await resetPassword(identifier);
        setResetSentEmail(sentEmail);
        toast.success('Şifre sıfırlama bağlantısı gönderildi!');
      }
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      let msg = err.message || 'Bir hata oluştu.';
      if (err.code === 'auth/user-not-found') {
        msg = 'Bu kullanıcı adına veya e-posta adresine ait hesap bulunamadı.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Geçersiz bir e-posta adresi girildi.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'Hatalı şifre girdiniz.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithGoogle();
        toast.success('Giriş başarılı, hoş geldin!');
        onClose();
      } else {
        // mode === 'signup'
        if (!termsAccepted) {
          toast.error('Lütfen kayıt sözleşmesini ve KVKK aydınlatma metnini onaylayın.');
          setLoading(false);
          return;
        }
        if (!form.username.trim()) {
          toast.error('Lütfen forumda kullanacağınız bir kullanıcı adı belirleyin.');
          setLoading(false);
          return;
        }
        const uError = getUsernameValidationError(form.username);
        if (uError) {
          toast.error(uError);
          setLoading(false);
          return;
        }
        await signUpWithGoogle(form.username, termsAccepted);
        toast.success('Hesabın oluşturuldu! E-postana gönderdiğimiz doğrulama linkine tıklayarak hesabını onaylayabilirsin.', { duration: 8000 });
        onClose();
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err.code === 'auth/user-not-registered') {
        // User has NOT created an account yet! Switch to signup mode & prefill
        setMode('signup');
        const suggestedName = sanitizeUsername(err.displayName || err.email?.split('@')[0] || '');
        setForm((prev) => ({
          ...prev,
          email: err.email || prev.email,
          username: prev.username || suggestedName,
        }));
        toast('Bu Google hesabıyla henüz bir kayıt bulunmuyor. Lütfen kullanıcı adınızı belirleyin, sözleşmeyi onaylayın ve Google ile kaydolun.', {
          icon: 'ℹ️',
          duration: 7000,
        });
        return;
      }
      let msg = err.message || 'Google işlemi başarısız.';
      if (err.code === 'auth/unauthorized-domain') {
        msg = 'Bu alan adı Firebase Yetkili Alan Adları listesinde tanımlı değil. (Firebase Console -> Auth -> Settings -> Authorized Domains).';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Firebase Konsolunda Google ile giriş sağlayıcısı henüz aktif edilmemiş.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        msg = 'Bu e-posta adresi ile zaten farklı bir yöntemle kayıt olunmuş. Lütfen şifrenizle giriş yapın.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Tarayıcınız açılır pencereyi engelledi. Yönlendirme deneniyor...';
      }
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      toast.success('Misafir olarak giriş yapıldı!');
      onClose();
    } catch {
      toast.error('Misafir girişi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[3000] flex items-center justify-center p-4 transition-all duration-200 ${
        show ? 'bg-black/60' : 'bg-transparent'
      }`} 
      onClick={onClose}
    >
      
      {/* Container simulating X's rigid strict modal shape */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: dark ? '#000000' : '#ffffff',
          color: dark ? '#e7e9ea' : '#0f172a',
          border: dark ? '1px solid #2f3336' : 'none',
        }}
        className={`relative w-full max-h-full sm:w-[600px] sm:min-h-[650px] rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-out overflow-y-auto ${
          show ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.98] opacity-0 translate-y-4'
        }`}
      >
        
        {/* Header - Perfect Symmetry */}
        <div 
          style={{
            background: dark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            borderBottom: `1px solid ${dark ? '#2f3336' : '#f1f5f9'}`
          }}
          className="flex items-center justify-between px-4 py-3 sticky top-0 backdrop-blur-sm z-20"
        >
          <button 
            onClick={onClose} 
            style={{ color: dark ? '#e7e9ea' : '#000000' }}
            className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"
            aria-label="Kapat"
          >
            <CloseIcon size={20} strokeWidth={2}/>
          </button>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <img 
              src="/forum-logo.png" 
              alt="Manav Forum" 
              style={{ 
                height: 30, 
                width: 'auto', 
                objectFit: 'contain',
                filter: dark ? 'drop-shadow(0 0 10px rgba(29, 155, 240, 0.45)) brightness(1.05)' : 'none'
              }} 
            />
          </div>
          
          <div className="w-9" /> {/* Spacer to preserve absolute center balance */}
        </div>

        {/* Form Body - Constrained Center Block */}
        <div className="flex-1 flex flex-col items-center pt-2 pb-10">
          
          <div className="w-full max-w-[400px] px-3 sm:px-0 flex flex-col">
            
            <h1 
              style={{ color: dark ? '#e7e9ea' : '#0f172a' }}
              className="text-[31px] font-bold mt-2 mb-6 tracking-[-0.03em] leading-snug"
            >
              {mode === 'signin' ? "Manavplatform'a giriş yap" : mode === 'signup' ? "Manavplatform'a katıl" : "Şifreni mi unuttun?"}
            </h1>

            {/* Forgot Password Flow */}
            {mode === 'forgot' ? (
              <div className="flex flex-col gap-4 mt-1">
                {resetSentEmail ? (
                  <div 
                    style={{
                      background: dark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
                      borderColor: dark ? 'rgba(34, 197, 94, 0.3)' : '#bbf7d0'
                    }}
                    className="p-6 rounded-2xl border flex flex-col items-center text-center gap-3.5 my-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={26} />
                    </div>
                    <div className="text-[18px] font-bold text-emerald-500">
                      Sıfırlama Bağlantısı Gönderildi
                    </div>
                    <p style={{ color: dark ? '#cbd5e1' : '#475569' }} className="text-[14px] leading-relaxed">
                      <span className="font-semibold text-emerald-400">{resetSentEmail}</span> adresine şifre sıfırlama bağlantısı iletildi. Lütfen gelen kutunuzu ve gerekiyorsa spam klasörünüzü kontrol edin.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setResetSentEmail(null); setMode('signin'); }}
                      className="mt-3 w-full h-[48px] rounded-full font-bold text-[15px] bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-98 cursor-pointer"
                    >
                      Giriş Yapmaya Dön
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <p 
                      style={{ color: dark ? '#94a3b8' : '#475569' }} 
                      className="text-[14.5px] leading-relaxed"
                    >
                      Hesabınıza bağlı kullanıcı adınızı veya kayıtlı e-posta adresinizi girin. Şifrenizi güvenle yenilemeniz için size bir bağlantı göndereceğiz.
                    </p>

                    <div 
                      style={{
                        background: dark ? '#16181c' : '#ffffff',
                        borderColor: dark ? '#2f3336' : '#d1d5db'
                      }}
                      className="relative group rounded border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px]"
                    >
                      <input
                        type="text"
                        id="x_forgot_username"
                        style={{ color: dark ? '#e7e9ea' : '#000000' }}
                        className="block px-2 pt-6 w-full h-full text-[17px] bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                        placeholder=" "
                        required
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                      />
                      <label
                        htmlFor="x_forgot_username"
                        style={{ color: dark ? '#71767b' : '#6b7280' }}
                        className="absolute text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] scale-[0.8] -translate-y-3 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                      >
                        Kullanıcı Adı veya E-posta
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: dark ? '#ffffff' : '#000000',
                        color: dark ? '#000000' : '#ffffff'
                      }}
                      className="w-full h-[50px] rounded-full disabled:opacity-40 font-bold text-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99] mt-2"
                    >
                      {loading && <Loader size={18} className="animate-spin" />}
                      Sıfırlama Bağlantısı Gönder
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="w-full mt-2 py-2 text-[14px] font-semibold text-[#1d9bf0] hover:underline flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                      <span>Giriş yapmaya geri dön</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                {/* Psychologist Registration Prompt */}
                {mode === 'signup' && (
                  <div 
                    style={{
                      background: dark 
                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(20, 24, 33, 0.95) 100%)' 
                        : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      borderColor: dark ? 'rgba(212, 175, 55, 0.35)' : '#fde68a',
                      boxShadow: dark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(245, 158, 11, 0.1)'
                    }}
                    className="mb-6 p-4 rounded-2xl border flex flex-col gap-3.5 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        style={{ background: dark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(245, 158, 11, 0.18)' }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <Award size={20} className={dark ? "text-[#facc15]" : "text-[#b45309]"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          style={{ color: dark ? '#facc15' : '#92400e' }}
                          className="text-[15px] font-bold tracking-tight"
                        >
                          Psikolog musunuz?
                        </div>
                        <p 
                          style={{ color: dark ? '#94a3b8' : '#475569' }}
                          className="text-[13px] mt-0.5 leading-snug"
                        >
                          Diploma ve belgelerinizle uzman rozetli hesap açın.
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/kayit/psikolog"
                      onClick={onClose}
                      className="w-full h-[40px] rounded-xl font-bold text-[13.5px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01] active:scale-98"
                      style={{
                        background: dark ? 'linear-gradient(135deg, #d4af37, #f6e05e)' : '#f59e0b',
                        color: '#0f172a',
                      }}
                    >
                      <span>Uzman Kaydı Yap</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}

                {/* Social Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    style={{
                      background: dark ? '#16181c' : '#ffffff',
                      borderColor: dark ? '#2f3336' : '#d1d5db',
                      color: dark ? '#e7e9ea' : '#000000'
                    }}
                    className="w-full h-[40px] flex items-center justify-center gap-2 rounded-full border transition-colors text-[15px] font-semibold outline-none relative cursor-pointer"
                  >
                    <div className="absolute left-4">
                      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <span>{mode === 'signin' ? 'Google ile giriş yap' : 'Google ile kaydol'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGuest}
                    disabled={loading}
                    style={{
                      background: dark ? '#16181c' : '#ffffff',
                      borderColor: dark ? '#2f3336' : '#d1d5db',
                      color: dark ? '#e7e9ea' : '#000000'
                    }}
                    className="w-full h-[40px] flex items-center justify-center rounded-full border transition-colors text-[15px] font-semibold outline-none cursor-pointer"
                  >
                    Misafir olarak göz at
                  </button>
                </div>

                <div className="flex items-center gap-2 my-2 mt-4">
                  <div style={{ background: dark ? '#2f3336' : '#e5e7eb' }} className="flex-1 h-px" />
                  <span style={{ color: dark ? '#71767b' : '#6b7280' }} className="text-[15px] font-normal">veya</span>
                  <div style={{ background: dark ? '#2f3336' : '#e5e7eb' }} className="flex-1 h-px" />
                </div>

                {/* Inputs aligned exactly like X floating inputs */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
                  
                  {/* --- USERNAME FIELD --- (Always shown) */}
                  <div 
                    style={{
                      background: dark ? '#16181c' : '#ffffff',
                      borderColor: dark ? '#2f3336' : '#d1d5db'
                    }}
                    className="relative group rounded border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px]"
                  >
                    <input
                      type="text"
                      id="x_username"
                      style={{ color: dark ? '#e7e9ea' : '#000000' }}
                      className="block px-2 pt-6 w-full h-full text-[17px] bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                      placeholder=" "
                      required
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                    <label
                      htmlFor="x_username"
                      style={{ color: dark ? '#71767b' : '#6b7280' }}
                      className="absolute text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] scale-[0.8] -translate-y-3 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                    >
                      {mode === 'signin' ? 'Kullanıcı Adı veya E-posta' : 'Kullanıcı Adı belirle (@kullaniciadi)'}
                    </label>
                  </div>
                  {mode === 'signup' && (
                    <div style={{ fontSize: '0.75rem', color: dark ? '#94a3b8' : '#64748b', marginTop: -8, paddingLeft: 4 }}>
                      Yalnızca sade İngilizce harfler (a-z), rakamlar (0-9) ve alt çizgi (_) kullanılabilir.
                    </div>
                  )}

                  {/* --- EMAIL FIELD --- (Only for signup) */}
                  {mode === 'signup' && (
                    <div 
                      style={{
                        background: dark ? '#16181c' : '#ffffff',
                        borderColor: dark ? '#2f3336' : '#d1d5db'
                      }}
                      className="relative group rounded border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px]"
                    >
                      <input
                        type="email"
                        id="x_email"
                        style={{ color: dark ? '#e7e9ea' : '#000000' }}
                        className="block px-2 pt-6 w-full h-full text-[17px] bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                        placeholder=" "
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                      <label
                        htmlFor="x_email"
                        style={{ color: dark ? '#71767b' : '#6b7280' }}
                        className="absolute text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] scale-[0.8] -translate-y-3 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                      >
                        E-posta bağla
                      </label>
                    </div>
                  )}
                  
                  <div 
                    style={{
                      background: dark ? '#16181c' : '#ffffff',
                      borderColor: dark ? '#2f3336' : '#d1d5db'
                    }}
                    className="relative group rounded border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px]"
                  >
                    <input
                      type="password"
                      id="x_password"
                      style={{ color: dark ? '#e7e9ea' : '#000000' }}
                      className="block px-2 pt-6 w-full h-full text-[17px] bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                      placeholder=" "
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <label
                      htmlFor="x_password"
                      style={{ color: dark ? '#71767b' : '#6b7280' }}
                      className="absolute text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] scale-[0.8] -translate-y-3 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                    >
                      Şifre gir
                    </label>
                  </div>

                  {/* Forgot Password Link in Signin mode */}
                  {mode === 'signin' && (
                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setResetSentEmail(null);
                        }}
                        className="text-[13.5px] font-semibold text-[#1d9bf0] hover:underline cursor-pointer"
                      >
                        Şifreni mi unuttun?
                      </button>
                    </div>
                  )}

                  {/* Registration Terms & KVKK Checkbox & Document Buttons */}
                  {mode === 'signup' && (
                    <div 
                      style={{
                        background: dark 
                          ? (termsAccepted ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.05)')
                          : (termsAccepted ? '#fefce8' : '#f8fafc'),
                        borderColor: dark 
                          ? (termsAccepted ? '#eab308' : 'rgba(255, 255, 255, 0.15)')
                          : (termsAccepted ? '#ca8a04' : '#cbd5e1'),
                        boxShadow: termsAccepted ? '0 0 20px rgba(212, 175, 55, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                      className="rounded-2xl border p-4 sm:p-5 my-3 flex flex-col gap-3.5 transition-all text-left"
                    >
                      {/* Two large, clearly visible buttons to open legal docs */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setTermsModalOpen(true)}
                          className="flex-1 min-h-[46px] py-2.5 px-3.5 rounded-xl text-[13.5px] sm:text-[14px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                          style={{
                            background: dark ? 'rgba(212, 175, 55, 0.15)' : '#fef3c7',
                            color: dark ? '#facc15' : '#854d0e',
                            border: dark ? '1.5px solid rgba(212, 175, 55, 0.4)' : '1.5px solid #fde047',
                          }}
                        >
                          <FileText size={17} className={dark ? "text-amber-400" : "text-amber-600"} />
                          <span>Sözleşmeyi Oku</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTermsModalOpen(true)}
                          className="flex-1 min-h-[46px] py-2.5 px-3.5 rounded-xl text-[13.5px] sm:text-[14px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                          style={{
                            background: dark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                            color: dark ? '#93c5fd' : '#1e40af',
                            border: dark ? '1.5px solid rgba(59, 130, 246, 0.4)' : '1.5px solid #bfdbfe',
                          }}
                        >
                          <ShieldCheck size={17} className={dark ? "text-blue-400" : "text-blue-600"} />
                          <span>KVKK Metni</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div 
                        style={{ 
                          height: 1, 
                          background: dark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0', 
                          margin: '2px 0' 
                        }} 
                      />

                      {/* Big Checkable Row */}
                      <div 
                        onClick={() => setTermsAccepted(!termsAccepted)}
                        className="flex items-center gap-3.5 cursor-pointer select-none py-1"
                      >
                        <input
                          type="checkbox"
                          id="auth_terms_checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-[22px] h-[22px] rounded-md cursor-pointer shrink-0 accent-[#b8965a]"
                          required
                        />
                        <label
                          htmlFor="auth_terms_checkbox"
                          className="text-[14px] sm:text-[15px] font-bold leading-snug cursor-pointer select-none"
                          style={{ color: dark ? '#ffffff' : '#0f172a' }}
                        >
                          Kullanıcı Sözleşmesini ve KVKK Metnini Okudum, Onaylıyorum.
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Generous spacing above Kaydol / Giriş button */}
                  <div className="mt-5 flex flex-col gap-6">
                    <button
                      type="submit"
                      disabled={loading || (mode === 'signup' && !termsAccepted)}
                      style={{
                        background: dark ? '#ffffff' : '#000000',
                        color: dark ? '#000000' : '#ffffff'
                      }}
                      className="w-full h-[54px] rounded-full disabled:opacity-40 font-extrabold text-[17px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
                    >
                      {loading && <Loader size={18} className="animate-spin" />}
                      {mode === 'signin' ? 'Giriş Yap' : 'Kaydol'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {mode !== 'forgot' && (
              <div style={{ color: dark ? '#71767b' : '#6b7280' }} className="mt-8 text-[15px] font-normal">
                {mode === 'signin' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
                {' '}
                <button
                  type="button"
                  className="text-[#1d9bf0] hover:underline cursor-pointer font-semibold ml-1"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                >
                  {mode === 'signin' ? 'Kaydol' : 'Giriş yap'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Legal Terms & KVKK Modal */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => setTermsAccepted(true)}
        isDark={dark}
      />
    </div>
  );
}
