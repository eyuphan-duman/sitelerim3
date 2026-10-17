'use client';

import React from 'react';
import { scorePassword, STRENGTH_LABEL, passwordTip } from '@/lib/passwordUtils';

const COLORS = { weak: '#dc2626', medium: '#d97706', strong: '#16a34a', empty: 'transparent' } as const;

/** Şifre gücü göstergesi: üç bölmeli çubuk + Zayıf/Orta/Güçlü + öneri */
export default function PasswordStrengthMeter({ password, mutedColor = '#64748b' }: { password: string; mutedColor?: string }) {
  const s = scorePassword(password);
  if (s.strength === 'empty') return null;
  const filled = s.strength === 'weak' ? 1 : s.strength === 'medium' ? 2 : 3;
  const color = COLORS[s.strength];
  return (
    <div aria-live="polite" style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
        {[0, 1, 2].map(i => (
          <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < filled ? color : 'rgba(148,163,184,.3)', transition: 'background-color .2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 5, fontSize: '.78rem', lineHeight: 1.35 }}>
        <span style={{ color: mutedColor }}>{passwordTip(password)}</span>
        <b style={{ color, flexShrink: 0 }}>{STRENGTH_LABEL[s.strength]}</b>
      </div>
    </div>
  );
}
