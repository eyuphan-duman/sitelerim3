'use client';

/** Çevrimdışı sayfası için service worker'ı kaydeder (yalnızca canlı sitede) */
import { useEffect } from 'react';

export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
