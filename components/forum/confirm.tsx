'use client';

/**
 * Forum içi onay penceresi (X tarzı). Her yerden `await confirmDialog({...})` ile çağrılır;
 * pencereyi ForumShell içindeki <ConfirmHost /> çizer.
 */
import React, { useEffect, useState } from 'react';

type Opts = { title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
type Req = Opts & { resolve: (v: boolean) => void };

const EVENT = 'forum:confirm';

export function confirmDialog(opts: Opts): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(false);
    window.dispatchEvent(new CustomEvent<Req>(EVENT, { detail: { ...opts, resolve } }));
  });
}

export const confirmUnfollow = (handle: string) =>
  confirmDialog({
    title: `@${handle} adlı kişiyi takip etmeyi bırak?`,
    body: 'Gönderileri artık "Takip ettiklerin" akışında görünmez. Profilini yine de ziyaret edebilirsin.',
    confirmLabel: 'Takibi bırak',
  });

export function ConfirmHost() {
  const [req, setReq] = useState<Req | null>(null);

  useEffect(() => {
    const on = (e: Event) => setReq((e as CustomEvent<Req>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  useEffect(() => {
    if (!req) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  if (!req) return null;
  const close = (v: boolean) => { req.resolve(v); setReq(null); };

  return (
    <div className="fx-confirm-scrim" onClick={() => close(false)}>
      <div className="fx-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="fx-confirm-title" onClick={e => e.stopPropagation()}>
        <h2 id="fx-confirm-title">{req.title}</h2>
        {req.body && <p>{req.body}</p>}
        <button type="button" autoFocus className={`fx-btn ${req.danger === false ? 'fx-btn-primary' : 'fx-btn-confirm'}`} onClick={() => close(true)}>
          {req.confirmLabel || 'Onayla'}
        </button>
        <button type="button" className="fx-btn fx-btn-outline" onClick={() => close(false)}>
          {req.cancelLabel || 'Vazgeç'}
        </button>
      </div>
    </div>
  );
}
