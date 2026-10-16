'use client';

import React from 'react';
import { X } from 'lucide-react';

export function Avatar({ src, name, size = 40 }: { src?: string | null; name?: string | null; size?: number }) {
  const initial = (name || '').trim()[0]?.toLocaleUpperCase('tr-TR');
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  return (
    <span className="fx-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : initial ? (
        initial
      ) : (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="8" r="4.2" />
          <path d="M3.5 21c.9-4.4 4.3-7 8.5-7s7.6 2.6 8.5 7z" />
        </svg>
      )}
    </span>
  );
}

/** Onaylı psikolog işareti — altın rozet */
export function VerifiedMark({ size = 17 }: { size?: number }) {
  return (
    <span className="fx-verified" title="Onaylı psikolog" aria-label="Onaylı psikolog">
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        />
        <path fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" d="m8.2 12.3 2.6 2.6 5-5.4" />
      </svg>
    </span>
  );
}

/** X tarzı karakter sayacı halkası */
export function CharRing({ length, limit }: { length: number; limit: number }) {
  const r = 9.5;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(length / limit, 1);
  const left = limit - length;
  const warn = left <= 20;
  const color = left <= 0 ? 'var(--fx-danger)' : warn ? 'var(--fx-save)' : 'var(--fx-link)';
  if (length === 0) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {warn && <span className={`fx-ring-num ${left <= 0 ? 'is-over' : ''}`}>{left}</span>}
      <svg className="fx-ring" viewBox="0 0 24 24" aria-label={`${left} karakter kaldı`}>
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--fx-line-strong)" strokeWidth="2.2" />
        <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} />
      </svg>
    </span>
  );
}

/** Sıfır olan sayıları gizler, büyükleri kısaltır (1,2 B) */
export function compactCount(n: number): string {
  if (!n) return '';
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace('.', ',').replace(',0', '')} B`;
  return `${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} Mn`;
}

export function ReportDialog({ reason, setReason, submitting, onClose, onSubmit, title = 'Gönderiyi şikayet et' }: {
  reason: string;
  setReason: (v: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title?: string;
}) {
  return (
    <div className="fx-modal-scrim" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="fx-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="fx-modal-head">
          <button type="button" className="fx-icon-btn" onClick={onClose} aria-label="Kapat"><X size={20} /></button>
          <div className="fx-modal-title">{title}</div>
        </div>
        <form className="fx-modal-body" onSubmit={onSubmit}>
          <p>Neyin topluluk kurallarına aykırı olduğunu kısaca yaz. Şikayetini yalnızca yöneticiler görür.</p>
          <textarea
            autoFocus
            required
            className="fx-field"
            value={reason}
            maxLength={2000}
            onChange={e => setReason(e.target.value)}
            placeholder="Örneğin: spam, hakaret, yanıltıcı bilgi"
          />
          <div className="fx-modal-foot">
            <button type="button" className="fx-btn fx-btn-outline" onClick={onClose}>Vazgeç</button>
            <button type="submit" className="fx-btn fx-btn-danger" disabled={submitting || !reason.trim()}>
              {submitting ? 'Gönderiliyor…' : 'Şikayet et'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
