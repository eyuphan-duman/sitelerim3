'use client';

import React from 'react';

interface Props {
  text?: string;
  isDark?: boolean;
}

export default function ForumLoadingScreen({ text = 'Topluluk Yükleniyor...', isDark = true }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#08111f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes forumLogoPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 20px rgba(29, 155, 240, 0.55)) brightness(1.05);
          }
          50% {
            transform: scale(1.035);
            filter: drop-shadow(0 0 32px rgba(29, 155, 240, 0.85)) brightness(1.15);
          }
        }
        @keyframes forumGlowBreath {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.9); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes forumLoadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Atmospheric Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 380,
          height: 380,
          background: 'radial-gradient(circle, rgba(29, 155, 240, 0.28) 0%, rgba(29, 155, 240, 0.05) 50%, transparent 75%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          animation: 'forumGlowBreath 3s ease-in-out infinite',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 20px',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        {/* Forum Logo */}
        <div
          style={{
            animation: 'forumLogoPulse 2.4s ease-in-out infinite',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/forum-logo.png"
            alt="Manav Forum"
            style={{
              height: 64,
              width: 'auto',
              maxWidth: '82vw',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Subtitle / Status */}
        <div
          style={{
            fontSize: '0.85rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'rgba(231, 233, 234, 0.7)',
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Psikoloji Topluluğu
        </div>

        {/* Minimalist Progress Track */}
        <div
          style={{
            width: 140,
            height: 2.5,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '50%',
              background: 'linear-gradient(90deg, transparent, #1d9bf0, #38bdf8, transparent)',
              borderRadius: 999,
              animation: 'forumLoadingBar 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        </div>

        {text && text !== 'Topluluk Yükleniyor...' && (
          <div
            style={{
              marginTop: 12,
              fontSize: '0.78rem',
              color: 'rgba(148, 163, 184, 0.75)',
              fontWeight: 500,
            }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
}
