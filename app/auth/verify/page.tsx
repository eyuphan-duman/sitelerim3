'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CheckCircle2, AlertTriangle, ArrowRight, Home, LogIn, RefreshCw, Mail } from 'lucide-react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function handleVerification() {
      // 1. If no oobCode or not verifyEmail, check if current user is already verified
      if (!oobCode || (mode && mode !== 'verifyEmail')) {
        if (auth.currentUser) {
          try {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
              if (isMounted) {
                setVerifiedEmail(auth.currentUser.email || '');
                setStatus('success');
              }
              return;
            }
          } catch {}
        }
        if (isMounted) {
          setStatus('already');
        }
        return;
      }

      // 2. Validate and apply the action code from Firebase
      try {
        // Optional check for extra info
        try {
          const info = await checkActionCode(auth, oobCode);
          if (info?.data?.email && isMounted) {
            setVerifiedEmail(info.data.email);
          }
        } catch {}

        await applyActionCode(auth, oobCode);

        if (auth.currentUser) {
          try {
            await auth.currentUser.reload();
            await auth.currentUser.getIdToken(true);
          } catch {}
        }

        if (isMounted) {
          setStatus('success');
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        if (!isMounted) return;

        if (err.code === 'auth/invalid-action-code') {
          // The code may have already been consumed
          setStatus('already');
          setErrorMessage('Bu doğrulama bağlantısı daha önce kullanılmış veya süresi dolmuş.');
        } else if (err.code === 'auth/expired-action-code') {
          setStatus('error');
          setErrorMessage('Doğrulama bağlantısının geçerlilik süresi dolmuş. Lütfen giriş ekranından yeni bir bağlantı talep edin.');
        } else {
          setStatus('error');
          setErrorMessage(err.message || 'E-posta doğrulanırken bir hata oluştu.');
        }
      }
    }

    handleVerification();

    return () => {
      isMounted = false;
    };
  }, [mode, oobCode]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0f1f38 0%, #070e1b 60%, #030710 100%)',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: 540,
        width: '100%',
        background: 'rgba(13, 25, 48, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(212, 175, 55, 0.3)',
        borderRadius: 24,
        padding: '44px 32px',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(212, 175, 55, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient Top Glow */}
        <div style={{
          position: 'absolute',
          top: -80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 260,
          height: 160,
          background: status === 'error'
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* LOADING STATE */}
        {status === 'loading' && (
          <div>
            {/* Animated Graphic */}
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 28px' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '3px dashed rgba(212, 175, 55, 0.4)',
                animation: 'spin 8s linear infinite',
              }} />
              <div style={{
                position: 'absolute',
                inset: 12,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(16, 185, 129, 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RefreshCw size={44} color="#d4af37" style={{ animation: 'spin 2s linear infinite' }} />
              </div>
            </div>

            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 12px',
            }}>
              E-posta Doğrulanıyor...
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: 420,
            }}>
              Doğrulama bağlantınız kontrol ediliyor. Lütfen birkaç saniye bekleyiniz.
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div>
            {/* Custom Premium SVG Graphic */}
            <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 28px' }}>
              <svg viewBox="0 0 160 160" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Glow rings */}
                <circle cx="80" cy="80" r="72" stroke="rgba(212, 175, 55, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="80" cy="80" r="62" fill="url(#goldGradient)" fillOpacity="0.12" />
                
                {/* Envelope base */}
                <g filter="drop-shadow(0 8px 16px rgba(0,0,0,0.4))">
                  <rect x="36" y="52" width="88" height="60" rx="10" fill="#0d1e38" stroke="#d4af37" strokeWidth="2" />
                  {/* Flap open */}
                  <path d="M38 54L80 84L122 54" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M38 110L68 84" stroke="rgba(212, 175, 55, 0.5)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M122 110L92 84" stroke="rgba(212, 175, 55, 0.5)" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Floating Check Shield */}
                <g filter="drop-shadow(0 6px 14px rgba(16, 185, 129, 0.45))">
                  <circle cx="112" cy="50" r="24" fill="#10b981" />
                  <circle cx="112" cy="50" r="22" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.3" />
                  <path d="M104 50L110 56L121 44" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Sparkling stars */}
                <path d="M42 36L44 42L50 44L44 46L42 52L40 46L34 44L40 42L42 36Z" fill="#d4af37" />
                <path d="M128 120L129.5 124L134 125.5L129.5 127L128 131L126.5 127L122 125.5L126.5 124L128 120Z" fill="#10b981" />

                <defs>
                  <linearGradient id="goldGradient" x1="18" y1="18" x2="142" y2="142" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#d4af37" />
                    <stop offset="1" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: 16,
            }}>
              <CheckCircle2 size={16} />
              <span>Doğrulama Başarılı</span>
            </div>

            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(1.7rem, 4vw, 2.1rem)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 12px',
              letterSpacing: '-0.01em',
            }}>
              E-posta Adresiniz Onaylandı!
            </h1>

            <p style={{
              color: 'rgba(255, 255, 255, 0.82)',
              fontSize: '1rem',
              lineHeight: 1.65,
              margin: '0 auto 28px',
              maxWidth: 440,
            }}>
              {verifiedEmail && (
                <strong style={{ color: '#facc15', display: 'block', marginBottom: 6 }}>
                  {verifiedEmail}
                </strong>
              )}
              Logos üyeliğiniz başarıyla tamamlandı. Artık kullanıcı adınız veya e-posta adresiniz ve şifreniz ile giriş yapabilir, topluluğa katılabilirsiniz.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                href="/forum?login=1"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                  color: '#070e1b',
                  padding: '14px 28px',
                  borderRadius: 12,
                  fontSize: '1rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <LogIn size={18} />
                <span>Giriş Yap ve Başla</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/forum"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.2s ease',
                }}
              >
                <span>Forumu Ziyaret Et</span>
              </Link>
            </div>
          </div>
        )}

        {/* ALREADY VERIFIED / LINK USED STATE */}
        {status === 'already' && (
          <div>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
              <div style={{
                width: 120,
                height: 120,
                margin: '10px auto',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '2px solid rgba(212, 175, 55, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Mail size={52} color="#d4af37" />
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#facc15',
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: 16,
            }}>
              <span>İşlem Bilgisi</span>
            </div>

            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(1.6rem, 4vw, 1.9rem)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 12px',
            }}>
              Hesabınız Kullanıma Hazır
            </h1>

            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              margin: '0 auto 28px',
              maxWidth: 420,
            }}>
              {errorMessage || 'Bu doğrulama bağlantısı daha önce kullanılmış veya hesabınız zaten doğrulanmış. Kullanıcı adı veya e-posta ve şifrenizle doğrudan giriş yapabilirsiniz.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                href="/forum?login=1"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                  color: '#070e1b',
                  padding: '14px 28px',
                  borderRadius: 12,
                  fontSize: '1rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <LogIn size={18} />
                <span>Giriş Yap</span>
              </Link>

              <Link
                href="/forum"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Home size={16} />
                <span>Topluluk Ana Sayfası</span>
              </Link>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div>
            <div style={{
              width: 100,
              height: 100,
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={48} color="#ef4444" />
            </div>

            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 12px',
            }}>
              Doğrulama Yapılamadı
            </h1>

            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              margin: '0 auto 28px',
              maxWidth: 420,
            }}>
              {errorMessage || 'Doğrulama bağlantısı geçersiz veya süresi dolmuş olabilir.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                href="/forum?login=1"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                  color: '#070e1b',
                  padding: '14px 28px',
                  borderRadius: 12,
                  fontSize: '1rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <LogIn size={18} />
                <span>Giriş Yapmayı Dene</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#070e1b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Yükleniyor...
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
