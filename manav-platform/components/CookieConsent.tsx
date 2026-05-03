'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Çerez onayını kontrol et
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShowConsent(true), 1500); // Sayfa açıldıktan biraz sonra göster
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (accepted: boolean) => {
    localStorage.setItem('cookie-consent', accepted ? 'true' : 'false');
    setShowConsent(false);
  };

  if (!mounted || !showConsent) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-40px)] max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div 
        style={{ 
          background: 'rgba(10, 22, 40, 0.85)', 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(201, 169, 110, 0.2)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }} 
        className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8"
      >
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
            <span style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Gizlilik ve Çerezler</span>
          </div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Size daha iyi bir deneyim sunmak istiyoruz</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '600px' }}>
            Deneyiminizi kişiselleştirmek ve site trafiğimizi analiz etmek için çerezleri kullanıyoruz. 
            Ayarlarınızı dilediğiniz zaman değiştirebilirsiniz.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={() => handleChoice(false)}
            className="px-6 py-3 border border-white/10 hover:border-white/30 text-white text-[0.75rem] font-bold uppercase tracking-wider rounded-lg transition-all duration-300"
          >
            Reddet
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="btn-gold"
            style={{ padding: '12px 32px', fontSize: '0.75rem' }}
          >
            Hepsini Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}

