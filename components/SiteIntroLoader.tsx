'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ADMIN_PATH } from '@/lib/adminPath';

export default function SiteIntroLoader() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<'active' | 'lifting' | 'done'>('active');

  const isExcluded =
    Boolean(pathname?.startsWith('/forum')) ||
    Boolean(pathname?.startsWith('/bildirimler')) ||
    Boolean(pathname?.startsWith('/dogrulama')) ||
    Boolean(pathname?.startsWith(ADMIN_PATH));

  useEffect(() => {
    if (isExcluded) {
      setPhase('done');
      return;
    }

    const liftTimer = setTimeout(() => {
      setPhase('lifting');
    }, 1250);

    const doneTimer = setTimeout(() => {
      setPhase('done');
    }, 2000);

    return () => {
      clearTimeout(liftTimer);
      clearTimeout(doneTimer);
    };
  }, [isExcluded]);

  if (isExcluded || phase === 'done') {
    return null;
  }

  return (
    <div
      className={`site-intro-loader ${phase === 'lifting' ? 'is-lifting' : ''}`}
      aria-hidden="true"
    >
      <div className="site-intro-grain" />

      <div className="site-intro-inner">
        {/* Mimari Monogram Mührü (FM) */}
        <div className="site-intro-emblem">
          <svg viewBox="0 0 72 72" width="68" height="68" fill="none">
            <rect
              x="3"
              y="3"
              width="66"
              height="66"
              rx="6"
              stroke="rgba(158, 192, 230, 0.24)"
              strokeWidth="1"
            />
            <rect
              className="site-intro-frame-draw"
              x="7"
              y="7"
              width="58"
              height="58"
              rx="4"
              stroke="#8eb4db"
              strokeWidth="1.2"
            />
            {/* Köşe Kadraj Çizgileri */}
            <path d="M11 17V11H17" stroke="#b8d0eb" strokeWidth="1.3" />
            <path d="M61 55V61H55" stroke="#b8d0eb" strokeWidth="1.3" />

            {/* F Harfi */}
            <path
              className="site-intro-monogram-f"
              d="M15.2 22.5H29.4V26.2H27.7C27.2 24.7 26.3 24.3 24.2 24.3H20.8V33.5H23.8C25.4 33.5 26.0 32.9 26.3 31.4H27.9V37.4H26.3C26.0 35.9 25.4 35.3 23.8 35.3H20.8V44.5C20.8 45.9 21.3 46.3 23.0 46.3V47.8H15.2V46.3C16.7 46.3 17.2 45.9 17.2 44.5V25.8C17.2 24.4 16.7 24 15.2 24V22.5Z"
              fill="#F8FAFD"
            />
            {/* M Harfi */}
            <path
              className="site-intro-monogram-m"
              d="M32.2 46.3C33.5 46.3 34.0 45.8 34.0 44.3V25.8C34.0 24.4 33.5 24 32.2 24V22.5H38.2L43.8 39.9L49.4 22.5H55.2V24C53.8 24 53.3 24.4 53.3 25.8V44.5C53.3 45.9 53.8 46.3 55.2 46.3V47.8H48.0V46.3C49.3 46.3 49.8 45.9 49.8 44.5V27.8L43.3 47.8H42.0L35.7 28.1V44.3C35.7 45.8 36.2 46.3 37.6 46.3V47.8H32.2V46.3Z"
              fill="#9EC0E6"
            />
          </svg>
        </div>

        {/* İsim & Uzmanlık */}
        <div className="site-intro-text">
          <div className="site-intro-name">Psikolog Furkan Manav</div>
          <div className="site-intro-sub">Varoluşçu · Psikanalitik Psikoterapi</div>
        </div>

        {/* İnce Mimari İlerleme Çizgisi */}
        <div className="site-intro-track">
          <span className="site-intro-bar" />
        </div>
      </div>
    </div>
  );
}
