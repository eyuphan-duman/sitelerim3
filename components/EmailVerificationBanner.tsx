'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, RefreshCw, CheckCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

export default function EmailVerificationBanner({ isDark = false }: { isDark?: boolean }) {
  const { user, userProfile, emailVerified, resendVerificationEmail, refreshEmailVerification } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!user || user.isAnonymous) return null;
  if (emailVerified || Boolean(user.emailVerified)) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      toast.success('Doğrulama e-postası tekrar gönderildi! Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.');
    } catch (err: any) {
      toast.error(err.message || 'Doğrulama e-postası gönderilemedi.');
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const verified = await refreshEmailVerification();
      if (verified) {
        toast.success('Harika! E-posta adresiniz başarıyla doğrulandı.');
      } else {
        toast.error('E-posta adresiniz henüz doğrulanmamış görünüyor. Lütfen e-postanızdaki bağlantıya tıklayın.');
      }
    } catch (err: any) {
      toast.error('Doğrulama durumu kontrol edilemedi: ' + (err.message || ''));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(180, 83, 9, 0.22) 100%)'
          : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        borderBottom: `1.5px solid ${isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a'}`,
        color: isDark ? '#fef3c7' : '#92400e',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        fontSize: '0.88rem',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        zIndex: 40,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 320px', minWidth: 260 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.2)',
            color: isDark ? '#facc15' : '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Mail size={18} />
        </div>
        <div style={{ lineHeight: 1.45 }}>
          <strong style={{ color: isDark ? '#fbbf24' : '#78350f', display: 'block', fontSize: '0.92rem' }}>
            E-posta Doğrulaması Gerekli
          </strong>
          <span>
            Hesabınızı aktif kullanabilmek için <u>{user.email}</u> adresine gönderilen linke tıklamalısınız.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isDark ? '#d97706' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '7px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: resending ? 'wait' : 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          <Send size={13} />
          <span>{resending ? 'Gönderiliyor...' : 'Tekrar Gönder'}</span>
        </button>

        <button
          type="button"
          onClick={handleCheck}
          disabled={checking}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'white',
            color: isDark ? '#fef3c7' : '#92400e',
            border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.35)' : '#fcd34d'}`,
            borderRadius: 999,
            padding: '7px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: checking ? 'wait' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
          <span>{checking ? 'Kontrol Ediliyor...' : 'Doğruladım'}</span>
        </button>
      </div>
    </div>
  );
}
