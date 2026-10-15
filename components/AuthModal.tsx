'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { X as CloseIcon, Loader, Award, FileText, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import TermsModal from './TermsModal';
import { sanitizeUsername, getUsernameValidationError } from '@/lib/usernameUtils';
import styles from './AuthModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

type Mode = 'signin' | 'signup' | 'google' | 'forgot';

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  invalid?: boolean;
  minLength?: number;
  inputMode?: 'text' | 'email';
}

function Field({ id, label, type = 'text', value, onChange, autoComplete, invalid, minLength, inputMode }: FieldProps) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={styles.field}>
      <input
        id={id}
        name={id}
        type={isPassword && reveal ? 'text' : type}
        inputMode={inputMode}
        className={`${styles.input} ${invalid ? styles.inputInvalid : ''}`}
        placeholder=" "
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <label htmlFor={id} className={styles.label}>{label}</label>
      {isPassword && (
        <button
          type="button"
          className={styles.eye}
          onClick={() => setReveal((r) => !r)}
          aria-label={reveal ? 'Şifreyi gizle' : 'Şifreyi göster'}
          tabIndex={-1}
        >
          {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className={styles.googleIcon} viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose, isDark }: Props) {
  const { signIn, signUp, startGoogleSignup, completeGoogleSignup, cancelGoogleSignup, signInAsGuest, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [detectedDark, setDetectedDark] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof isDark === 'boolean') {
      setDetectedDark(isDark);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('forum_theme');
      setDetectedDark(saved === 'dark' || document.documentElement.classList.contains('forum-dark'));
    }
  }, [isDark, isOpen]);

  const dark = isDark ?? detectedDark;

  // Fade-in + body scroll lock
  useEffect(() => {
    if (!isOpen) {
      setShow(false);
      setResetSentEmail(null);
      return;
    }
    const t = setTimeout(() => setShow(true), 10);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const requestClose = useCallback(() => {
    if (mode === 'google') {
      // Abandoning the Google step: discard the half-finished Google session
      cancelGoogleSignup().catch(() => {});
      setMode('signup');
    }
    setTermsAccepted(false);
    onClose();
  }, [mode, cancelGoogleSignup, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !termsModalOpen) requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, termsModalOpen, requestClose]);

  if (!isOpen) return null;

  const usernameError = username ? getUsernameValidationError(username) : null;
  const usernameOk = Boolean(username) && !getUsernameValidationError(username);
  const passwordOk = password.length >= 6;
  const emailOk = /\S+@\S+\.\S+/.test(email);

  // Terms can only be confirmed last, after every other field is valid
  const signupFieldsReady = usernameOk && emailOk && passwordOk;
  const googleFieldsReady = usernameOk && passwordOk;
  const fieldsReady = mode === 'google' ? googleFieldsReady : signupFieldsReady;

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    setTermsAccepted(false);
    setResetSentEmail(null);
  };

  /* ---------------- Handlers ---------------- */

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id || !password) return;
    setBusy(true);
    try {
      const cred: any = await signIn(id, password);
      if (cred?.user && !cred.user.emailVerified) {
        toast('Giriş başarılı! Ancak e-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki onay linkine tıklayın.', { icon: '✉️', duration: 7000 });
      } else {
        toast.success('Giriş başarılı, hoş geldin!');
      }
      setPassword('');
      onClose();
    } catch (err: any) {
      console.error('Sign in error:', err);
      let msg = err.message || 'Giriş yapılamadı.';
      if (err.code === 'auth/user-not-found') msg = 'Bu kullanıcı adına veya e-posta adresine ait hesap bulunamadı.';
      else if (err.code === 'auth/invalid-email') msg = 'Geçersiz bir e-posta adresi girildi.';
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Kullanıcı adı / e-posta veya şifre hatalı.';
      else if (err.code === 'auth/too-many-requests') msg = 'Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error('Lütfen kullanıcı sözleşmesini ve KVKK metnini onaylayın.');
      return;
    }
    const uError = getUsernameValidationError(username);
    if (uError) {
      toast.error(uError);
      return;
    }
    setBusy(true);
    try {
      await signUp(sanitizeUsername(username), email.trim(), password);
      toast.success('Hesabın oluşturuldu! Forumda paylaşım ve etkileşim yapabilmek için lütfen e-postana gönderdiğimiz doğrulama linkine tıkla.', { duration: 8000 });
      setPassword('');
      setTermsAccepted(false);
      onClose();
    } catch (err: any) {
      console.error('Sign up error:', err);
      toast.error(err.message || 'Kayıt oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  // IMPORTANT: no awaited work before startGoogleSignup(), so the popup opens
  // inside the user gesture immediately instead of being delayed or blocked.
  const handleGoogleStart = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      const info = await startGoogleSignup();
      setGoogleEmail(info.email);
      setUsername((prev) => prev || sanitizeUsername(info.displayName || info.email.split('@')[0] || ''));
      setPassword('');
      setTermsAccepted(false);
      setMode('google');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      console.error('Google signup error:', err);
      let msg = err.message || 'Google ile bağlantı kurulamadı.';
      if (err.code === 'auth/popup-blocked') msg = 'Tarayıcı açılır pencereyi engelledi. Lütfen bu site için açılır pencerelere izin verip tekrar dene.';
      else if (err.code === 'auth/unauthorized-domain') msg = 'Bu alan adı Firebase yetkili alan adları listesinde tanımlı değil.';
      else if (err.code === 'auth/operation-not-allowed') msg = 'Google ile kayıt Firebase konsolunda henüz aktif edilmemiş.';
      else if (err.code === 'auth/account-exists-with-different-credential') msg = 'Bu e-posta ile zaten başka bir yöntemle kayıt olunmuş. Lütfen şifrenle giriş yap.';
      else if (err.code === 'auth/network-request-failed') msg = 'Bağlantı hatası. İnternetini kontrol edip tekrar dene.';
      toast.error(msg, { duration: 6000 });
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleGoogleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error('Lütfen kullanıcı sözleşmesini ve KVKK metnini onaylayın.');
      return;
    }
    setBusy(true);
    try {
      await completeGoogleSignup(username, password, termsAccepted);
      toast.success('Hesabın oluşturuldu! Artık kullanıcı adın veya e-postan ve şifrenle giriş yapabilirsin.', { duration: 7000 });
      setPassword('');
      setTermsAccepted(false);
      setMode('signin');
      onClose();
    } catch (err: any) {
      console.error('Google complete error:', err);
      let msg = err.message || 'Kayıt tamamlanamadı.';
      if (err.code === 'auth/weak-password') msg = 'Şifre en az 6 karakter olmalıdır.';
      else if (err.code === 'auth/requires-recent-login') msg = 'Oturum süresi doldu. Lütfen Google ile kaydı baştan başlat.';
      toast.error(msg, { duration: 6000 });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleCancel = async () => {
    try { await cancelGoogleSignup(); } catch {}
    setPassword('');
    setTermsAccepted(false);
    setMode('signup');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id) {
      toast.error('Lütfen kullanıcı adınızı veya e-posta adresinizi girin.');
      return;
    }
    setBusy(true);
    try {
      const sent = await resetPassword(id);
      setResetSentEmail(sent);
      toast.success('Şifre sıfırlama bağlantısı gönderildi!');
    } catch (err: any) {
      toast.error(err.message || 'Şifre sıfırlama bağlantısı gönderilemedi.');
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = async () => {
    setBusy(true);
    try {
      await signInAsGuest();
      toast.success('Misafir olarak giriş yapıldı!');
      onClose();
    } catch {
      toast.error('Misafir girişi başarısız.');
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- Reusable blocks ---------------- */

  const usernameBlock = (
    <>
      <Field
        id="auth_username"
        label="Kullanıcı adı belirle"
        value={username}
        onChange={(val) => setUsername(val.replace(/^@+/, ''))}
        autoComplete="username"
        invalid={Boolean(usernameError)}
      />
      <p className={`${styles.hint} ${usernameError ? styles.hintError : ''}`}>
        {usernameError || 'Başına @ koymanıza gerek yoktur, profilinizde sistem otomatik ekler. Yalnızca sade İngilizce harfler (a-z), rakamlar (0-9) ve alt çizgi (_).'}
      </p>
      {username && !usernameError && (
        <p className={styles.hint} style={{ color: '#10b981', fontWeight: 600, marginTop: -4 }}>
          Profilinizde görünecek adınız: @{sanitizeUsername(username)}
        </p>
      )}
    </>
  );

  const termsBlock = (
    <div className={`${styles.terms} ${termsAccepted ? styles.termsOn : ''} ${!fieldsReady ? styles.termsLocked : ''}`}>
      <div className={styles.termsDocs}>
        <button type="button" className={`${styles.docBtn} ${styles.docBtnTerms}`} onClick={() => setTermsModalOpen(true)}>
          <FileText size={16} />
          <span>Sözleşmeyi Oku</span>
        </button>
        <button type="button" className={`${styles.docBtn} ${styles.docBtnKvkk}`} onClick={() => setTermsModalOpen(true)}>
          <ShieldCheck size={16} />
          <span>KVKK Metni</span>
        </button>
      </div>
      <label className={styles.termsCheck}>
        <input
          type="checkbox"
          id="auth_terms_checkbox"
          checked={termsAccepted}
          disabled={!fieldsReady}
          onChange={(e) => setTermsAccepted(e.target.checked)}
        />
        <span className={styles.termsText}>Kullanıcı Sözleşmesini ve KVKK Metnini okudum, onaylıyorum.</span>
      </label>
      {!fieldsReady && <p className={styles.termsNote}>Onay kutusu, yukarıdaki bilgileri doldurduktan sonra açılır.</p>}
    </div>
  );

  const title =
    mode === 'signin' ? 'Giriş yap'
    : mode === 'signup' ? "Manavplatform'a katıl"
    : mode === 'google' ? 'Kaydını tamamla'
    : 'Şifreni sıfırla';

  return (
    <div
      className={`${styles.overlay} ${dark ? styles.dark : styles.light} ${show ? styles.overlayShow : ''}`}
      onClick={() => { if (!busy && !googleBusy) requestClose(); }}
    >
      <div
        className={`${styles.modal} ${show ? styles.modalShow : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <button type="button" className={styles.iconBtn} onClick={requestClose} aria-label="Kapat">
            <CloseIcon size={20} />
          </button>
          <div className={styles.logoWrap}>
            <img src="/forum-logo.png" alt="Manav Forum" className={styles.logo} />
          </div>
          <span />
        </div>

        <div className={styles.body}>
          <h2 className={styles.title}>{title}</h2>

          {/* ---------------- SIGN IN ---------------- */}
          {mode === 'signin' && (
            <>
              <form className={styles.form} onSubmit={handleSignin}>
                <Field id="auth_identifier" label="Kullanıcı adı veya e-posta" value={identifier} onChange={setIdentifier} autoComplete="username" />
                <Field id="auth_password" label="Şifre" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
                <div className={styles.linkRow}>
                  <button type="button" className={styles.linkBtn} onClick={() => switchMode('forgot')}>Şifreni mi unuttun?</button>
                </div>
                <button type="submit" className={styles.primary} disabled={busy || !identifier.trim() || !password}>
                  {busy && <Loader size={18} className={styles.spin} />}
                  Giriş Yap
                </button>
              </form>
              <button type="button" className={styles.outline} onClick={handleGuest} disabled={busy}>
                Misafir olarak göz at
              </button>
            </>
          )}

          {/* ---------------- SIGN UP ---------------- */}
          {mode === 'signup' && (
            <>
              <div className={styles.psych}>
                <div className={styles.psychHead}>
                  <span className={styles.psychIcon}><Award size={20} /></span>
                  <div>
                    <div className={styles.psychTitle}>Psikolog musunuz?</div>
                    <div className={styles.psychText}>Diploma ve belgelerinizle uzman rozetli hesap açın.</div>
                  </div>
                </div>
                <Link href="/kayit/psikolog" onClick={requestClose} className={styles.psychBtn}>
                  <span>Uzman Kaydı Yap</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              <button type="button" className={styles.outline} onClick={handleGoogleStart} disabled={googleBusy || busy}>
                {googleBusy ? <Loader size={18} className={styles.spin} /> : <GoogleLogo />}
                <span>{googleBusy ? 'Google penceresi açılıyor...' : 'Google ile kaydol'}</span>
              </button>

              <div className={styles.divider}>veya e-posta ile kaydol</div>

              <form className={styles.form} onSubmit={handleSignup}>
                {usernameBlock}
                <Field id="auth_email" label="E-posta adresi" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="email" />
                <Field id="auth_new_password" label="Şifre (en az 6 karakter)" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} />
                {termsBlock}
                <button type="submit" className={styles.primary} disabled={busy || !termsAccepted || !signupFieldsReady}>
                  {busy && <Loader size={18} className={styles.spin} />}
                  Kaydol
                </button>
              </form>

              <button type="button" className={styles.outline} onClick={handleGuest} disabled={busy}>
                Misafir olarak göz at
              </button>
            </>
          )}

          {/* ---------------- GOOGLE STEP 2 ---------------- */}
          {mode === 'google' && (
            <>
              <p className={styles.subtitle}>Google hesabın bağlandı. Kaydı bitirmek için kullanıcı adı ve şifre belirle, ardından sözleşmeyi onayla.</p>
              <div className={styles.chip}>
                <CheckCircle2 size={18} className={styles.chipIcon} />
                <span>{googleEmail}</span>
              </div>
              <form className={styles.form} onSubmit={handleGoogleComplete}>
                {usernameBlock}
                <Field id="auth_google_password" label="Giriş şifresi belirle (en az 6 karakter)" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} />
                <p className={styles.hint}>Bu şifreyle daha sonra kullanıcı adın veya e-postanla giriş yapacaksın.</p>
                {termsBlock}
                <button type="submit" className={styles.primary} disabled={busy || !termsAccepted || !googleFieldsReady}>
                  {busy && <Loader size={18} className={styles.spin} />}
                  Kaydı Tamamla
                </button>
              </form>
              <button type="button" className={`${styles.linkBtn} ${styles.linkBtnCenter}`} onClick={handleGoogleCancel} disabled={busy}>
                Vazgeç
              </button>
            </>
          )}

          {/* ---------------- FORGOT ---------------- */}
          {mode === 'forgot' && (
            resetSentEmail ? (
              <div className={styles.sentBox}>
                <CheckCircle2 size={34} className={styles.chipIcon} />
                <div className={styles.sentTitle}>Sıfırlama bağlantısı gönderildi</div>
                <p className={styles.sentText}>
                  <strong>{resetSentEmail}</strong> adresine şifre sıfırlama bağlantısı iletildi. Gelen kutunu ve gerekirse spam klasörünü kontrol et.
                </p>
                <button type="button" className={styles.primary} onClick={() => switchMode('signin')}>Giriş yapmaya dön</button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleForgot}>
                <p className={styles.subtitle}>Kullanıcı adını veya kayıtlı e-posta adresini gir. Şifreni yenilemen için bir bağlantı göndereceğiz.</p>
                <Field id="auth_forgot_identifier" label="Kullanıcı adı veya e-posta" value={identifier} onChange={setIdentifier} autoComplete="username" />
                <button type="submit" className={styles.primary} disabled={busy || !identifier.trim()}>
                  {busy && <Loader size={18} className={styles.spin} />}
                  Sıfırlama Bağlantısı Gönder
                </button>
                <button type="button" className={`${styles.linkBtn} ${styles.linkBtnCenter}`} onClick={() => switchMode('signin')}>
                  <ArrowLeft size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Giriş yapmaya geri dön
                </button>
              </form>
            )
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <div className={styles.switchRow}>
              {mode === 'signin' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
              <button type="button" className={styles.linkBtn} onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Kaydol' : 'Giriş yap'}
              </button>
            </div>
          )}
        </div>
      </div>

      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => { if (fieldsReady) setTermsAccepted(true); }}
        isDark={dark}
      />
    </div>
  );
}
