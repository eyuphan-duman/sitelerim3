'use client';

import React, { useEffect, useRef } from 'react';

/** reCAPTCHA v2 ("Ben robot değilim") kutusu. Doğrulanınca onToken çağrılır; süresi dolunca boş değer gelir. */
type Grecaptcha = {
  ready: (cb: () => void) => void;
  render: (el: HTMLElement, opts: Record<string, unknown>) => number;
  reset: (id?: number) => void;
};
declare global {
  interface Window { grecaptcha?: Grecaptcha; __logosRecaptchaLoad?: Promise<void> }
}

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

function loadScript(): Promise<void> {
  if (window.__logosRecaptchaLoad) return window.__logosRecaptchaLoad;
  window.__logosRecaptchaLoad = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=tr';
    s.async = true;
    s.defer = true;
    s.onload = () => window.grecaptcha?.ready(() => resolve());
    s.onerror = () => { window.__logosRecaptchaLoad = undefined; reject(new Error('recaptcha')); };
    document.head.appendChild(s);
  });
  return window.__logosRecaptchaLoad;
}

export default function Recaptcha({ onToken, dark = false }: { onToken: (token: string) => void; dark?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  useEffect(() => { cb.current = onToken; }, [onToken]);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !box.current) return;
    let cancelled = false;
    const el = box.current;
    loadScript().then(() => {
      if (cancelled || !window.grecaptcha || el.childElementCount) return;
      window.grecaptcha.render(el, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: dark ? 'dark' : 'light',
        callback: (t: string) => cb.current(t),
        'expired-callback': () => cb.current(''),
        'error-callback': () => cb.current(''),
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [dark]);

  if (!RECAPTCHA_SITE_KEY) return null;
  return <div ref={box} style={{ minHeight: 78, display: 'flex', justifyContent: 'center' }} />;
}
