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
    <div className="fixed bottom-4 md:bottom-8 left-4 md:left-8 z-[10000] w-[calc(100%-32px)] md:w-auto md:max-w-[320px] animate-in fade-in slide-in-from-left-10 duration-700">
      <div 
        style={{ 
          background: 'rgba(10, 22, 40, 0.95)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(201, 169, 110, 0.25)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }} 
        className="rounded-xl md:rounded-2xl p-6 md:p-7 flex flex-col gap-6"
      >
        <div className="text-left">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
            <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Gizlilik Ayarları</span>
          </div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'white', fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>Çerez Kullanımı</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Size en iyi deneyimi sunmak için çerezleri kullanıyoruz. Sitemizde gezinmeye devam ederek çerez kullanımını kabul etmiş olursunuz.
          </p>
        </div>
        
        <div className="flex flex-row md:flex-col gap-3 w-full">
          <button
            onClick={() => handleChoice(false)}
            className="flex-1 px-5 py-3 border border-white/10 hover:border-white/30 text-white text-[0.7rem] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 order-2 md:order-1"
          >
            Reddet
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="flex-1 bg-[#c9a96e] hover:bg-[#d4b982] text-[#0a1628] px-5 py-3 text-[0.7rem] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 shadow-md order-1 md:order-2"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}

