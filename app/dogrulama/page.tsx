'use client';

import React, { useState } from 'react';
import Recaptcha, { RECAPTCHA_SITE_KEY } from '@/components/Recaptcha';

/**
 * Logos uygulaması için güvenlik doğrulaması: uygulama bu sayfayı açar, kullanıcı "Ben robot değilim"
 * kutusunu işaretleyince sayfa doğrulama anahtarıyla uygulamaya geri döner (logos://captcha).
 * Dönüş adresi sabittir; başka bir adrese yönlendirme yapılmaz.
 */
export default function CaptchaPage() {
  const [done, setDone] = useState(false);

  const onToken = (token: string) => {
    if (!token) return;
    setDone(true);
    window.location.href = `logos://captcha?token=${encodeURIComponent(token)}`;
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#fff', color: '#0e1726', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 380, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.3rem', margin: 0 }}>Güvenlik doğrulaması</h1>
        {!RECAPTCHA_SITE_KEY ? (
          <p style={{ margin: 0, color: '#56657a' }}>Doğrulama şu an kullanılamıyor. Lütfen biraz sonra tekrar dene.</p>
        ) : done ? (
          <p style={{ margin: 0, color: '#56657a' }}>Doğrulandı. Uygulamaya dönülüyor…</p>
        ) : (
          <>
            <p style={{ margin: 0, color: '#56657a', lineHeight: 1.5 }}>Hesabına art arda hatalı giriş denendi. Devam etmek için aşağıdaki kutuyu işaretle.</p>
            <Recaptcha onToken={onToken} />
          </>
        )}
      </div>
    </main>
  );
}
