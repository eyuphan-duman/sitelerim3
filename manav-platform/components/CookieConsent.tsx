'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
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

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-32px)] max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-[#0a1628] border border-[rgba(201,169,110,0.25)] rounded-lg p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col md:flex-row items-center gap-5">
        <div className="flex-1 text-[0.88rem] leading-relaxed text-[#fcf9f5]/90 font-medium text-center md:text-left">
          <span className="text-[#c9a96e] font-bold block mb-1 tracking-wider uppercase text-[0.65rem]">Çerez Bilgilendirmesi</span>
          Deneyiminizi kişiselleştirmek ve site trafiğini analiz etmek için çerezleri kullanıyoruz. 
          Sitemizi kullanmaya devam ederek çerez kullanımına izin vermiş olursunuz.
        </div>
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={acceptCookies}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-br from-[#c9a96e] to-[#e0c28a] text-[#0a1628] text-[0.75rem] font-bold uppercase tracking-wider rounded transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#c9a96e]/20"
          >
            Kabul Ediyorum
          </button>
        </div>
      </div>
    </div>
  );
}
