'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ForumError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Forum hatası:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#e2e8f0',
      padding: '24px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '50%',
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
      }}>
        <AlertCircle size={32} color="#ef4444" />
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
        Bir Sorun Oluştu
      </h2>

      <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: 380, lineHeight: 1.6, marginBottom: 24 }}>
        Forum sayfası yüklenirken bir sorun meydana geldi. Lütfen yeniden deneyin.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'white',
            color: '#0f172a',
            border: 'none',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'opacity 0.15s'
          }}
        >
          <RefreshCw size={15} /> Yeniden Dene
        </button>

        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: '0.9rem',
            textDecoration: 'none',
            transition: 'background 0.15s'
          }}
        >
          <Home size={15} /> Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
