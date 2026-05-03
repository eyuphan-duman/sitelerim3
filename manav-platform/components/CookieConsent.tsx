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
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShowConsent(false);
  };

  if (!mounted || !showConsent) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-32px)] max-w-3xl fade-up">
      <div className="bg-[#0a1628] border border-[rgba(201,169,110,0.4)] rounded-lg p-6 shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 text-[0.9rem] leading-relaxed text-[#fcf9f5] font-medium text-center md:text-left">
          <span className="text-[#c9a96e] font-bold block mb-1 tracking-wider uppercase text-[0.7rem]">Çerez Politikası</span>
          Deneyiminizi geliştirmek ve site trafiğini analiz etmek için çerezleri kullanıyoruz. 
          Sitemizi kullanarak çerez kullanımını kabul etmiş olursunuz.
        </div>
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={acceptCookies}
            className="w-full md:w-auto px-8 py-3 bg-[#c9a96e] hover:bg-[#e0c28a] text-[#0a1628] text-[0.75rem] font-bold uppercase tracking-wider rounded transition-all duration-300 shadow-lg"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}

