'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('cookie-consent');
    
    if (consent) {
      // Daha önce bir seçim yapılmışsa onu Google'a bildir
      applyConsent(consent === 'true');
    } else {
      // Seçim yoksa pencereyi göster
      const timer = setTimeout(() => setShowConsent(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const applyConsent = (accepted: boolean) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': accepted ? 'granted' : 'denied',
        'ad_storage': accepted ? 'granted' : 'denied'
      });
    }
  };

  const handleChoice = (accepted: boolean) => {
    localStorage.setItem('cookie-consent', accepted ? 'true' : 'false');
    applyConsent(accepted);
    setShowConsent(false);
  };

  if (!mounted || !showConsent) return null;

  return (
    <div className="fixed bottom-4 md:bottom-10 left-4 md:left-10 z-[10000] w-[calc(100%-32px)] md:w-auto md:max-w-[380px] animate-in fade-in slide-in-from-left-10 duration-700">
      <div 
        style={{ 
          background: 'rgba(10, 22, 40, 0.96)', 
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(201, 169, 110, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)'
        }} 
        className="rounded-xl md:rounded-2xl p-6 md:p-8 flex flex-col gap-6 md:gap-7"
      >
        <div className="text-left">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
            <span 
              style={{ color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}
              className="text-[0.65rem] md:text-[0.7rem]"
            >
              Gizlilik Ayarları
            </span>
          </div>
          <h3 
            style={{ fontFamily: 'Playfair Display, serif', color: 'white', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}
            className="text-[1.2rem] md:text-[1.4rem]"
          >
            Çerez Kullanımı
          </h3>
          <p 
            style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}
            className="text-[0.85rem] md:text-[0.95rem]"
          >
            Size en iyi deneyimi sunmak için çerezleri kullanıyoruz. Kabul etmediğiniz takdirde sadece teknik çerezler kullanılacaktır.
          </p>
        </div>
        
        <div className="flex flex-row md:flex-col gap-3.5 w-full">
          <button
            onClick={() => handleChoice(false)}
            className="flex-1 px-5 py-4 md:py-3.5 border border-white/10 hover:border-white/30 text-white text-[0.85rem] md:text-[0.8rem] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 order-2 md:order-1"
          >
            Reddet
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="flex-1 bg-[#c9a96e] hover:bg-[#d4b982] text-[#0a1628] px-5 py-4 md:py-3.5 text-[0.85rem] md:text-[0.8rem] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 shadow-md order-1 md:order-2"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}

