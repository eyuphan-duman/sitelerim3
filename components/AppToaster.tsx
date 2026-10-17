'use client';

/**
 * Site geneli bildirimler: X / Threads / Instagram'daki gibi alt-ortada,
 * koyu zeminli sade bir şerit. Büyük ikon ve emoji yok; durum küçük bir işaretle belirtilir.
 */
import { Toaster } from 'react-hot-toast';

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#c9a96e" />
    <path d="m7.5 12.4 3 3 6-6.4" fill="none" stroke="#0a1628" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Alert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#f97066" />
    <path d="M12 7v6.2" stroke="#0a1628" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="12" cy="16.8" r="1.4" fill="#0a1628" />
  </svg>
);

const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="app-toast-spin">
    <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2.6" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      gutter={8}
      containerClassName="app-toaster"
      toastOptions={{
        duration: 3200,
        className: 'app-toast',
        style: {
          background: '#0e1726',
          color: '#ffffff',
          borderRadius: 12,
          padding: '11px 16px',
          fontFamily: 'var(--font-inter), -apple-system, "Segoe UI", sans-serif',
          fontSize: '0.94rem',
          fontWeight: 500,
          lineHeight: 1.35,
          maxWidth: 'min(92vw, 460px)',
          boxShadow: '0 10px 30px rgba(8, 14, 26, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        },
        success: { icon: <Check /> },
        error: { icon: <Alert />, duration: 4800 },
        loading: { icon: <Spinner /> },
      }}
    />
  );
}
