'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShowConsent(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (accepted: boolean) => {
    localStorage.setItem('cookie-consent', accepted ? 'true' : 'false');
    setShowConsent(false);
  };

  if (!mounted || !showConsent) return null;

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-24px)] md:w-[calc(100%-40px)] max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div 
        style={{ 
          background: 'rgba(10, 22, 40, 0.9)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(201, 169, 110, 0.2)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)'
        }} 
        className="rounded-xl md:rounded-2xl p-5 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8"
      >
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
            <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Gizlilik</span>
          </div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'white', fontSize: '1.1rem', md: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Çerez Bilgilendirmesi</h3>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', md: '0.9rem', lineHeight: 1.5, maxWidth: '600px' }}>
            Size daha iyi bir deneyim sunmak için çerezleri kullanıyoruz. 
            Ayarlarınızı dilediğiniz zaman değiştirebilirsiniz.
          </p>
        </div>
        
        <div className="flex flex-row gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => handleChoice(false)}
            className="flex-1 md:flex-none px-5 py-2.5 border border-white/10 hover:border-white/30 text-white text-[0.7rem] font-bold uppercase tracking-wider rounded-lg transition-all duration-300"
          >
            Reddet
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="flex-1 md:flex-none bg-[#c9a96e] hover:bg-[#d4b982] text-[#0a1628] px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 shadow-md"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}

