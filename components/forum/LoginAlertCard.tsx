'use client';

import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';

type Props = {
  id: string;
  device?: string;
  when: string;
  answered?: 'yes' | 'no' | null;
  unread: boolean;
};

/**
 * "Hesabına giriş yapmaya çalışan sen misin?" bildirimi. Hayır'a basılırsa hesap askıya alınır,
 * tüm oturumlar kapanır ve şifre sıfırlama bağlantısı e-postaya gönderilir.
 */
export default function LoginAlertCard({ id, device, when, answered, unread }: Props) {
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);
  const [done, setDone] = useState<'yes' | 'no' | null>(answered || null);

  const answer = async (a: 'yes' | 'no') => {
    if (a === 'no' && !confirm('Hesabın hemen askıya alınacak ve tüm cihazlardaki oturumların kapatılacak. Şifreni sıfırlaman için e-posta adresine bir bağlantı göndereceğiz. Devam edilsin mi?')) return;
    setBusy(a);
    try {
      const token = await auth.currentUser?.getIdToken();
      const r = await fetch('/api/auth/login-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, answer: a }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error();
      setDone(a);
      if (a === 'no') {
        toast.success(`Hesabın koruma altına alındı.${d.resetSent ? ' Şifre sıfırlama bağlantısını e-posta adresine gönderdik.' : ''}`, { duration: 10000 });
        await signOut(auth).catch(() => {});
      } else {
        toast.success('Teşekkürler, kaydettik.');
      }
    } catch {
      toast.error('Yanıt kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className={`fx-notif fx-notif-alert ${unread ? 'is-unread' : ''}`}>
      <span className="fx-notif-ic" style={{ color: 'var(--fx-danger)' }}><ShieldAlert size={22} strokeWidth={2.2} /></span>
      <div className="fx-notif-body">
        <div className="fx-notif-top">
          <b>Logos Güvenlik</b>
          <time className="fx-time">{when}</time>
        </div>
        <p className="fx-notif-text">Hesabına art arda yanlış şifreyle giriş yapılmaya çalışıldı. <b>Bu sen misin?</b></p>
        {device && <p className="fx-notif-excerpt">{device}</p>}
        {done === 'yes' && <p className="fx-notif-excerpt">“Evet, bendim” dedin.</p>}
        {done === 'no' && <p className="fx-notif-excerpt">Hesabın askıya alındı; şifreni değiştirdiğinde askı kalkar.</p>}
        {!done && (
          <div className="fx-alert-actions">
            <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" disabled={Boolean(busy)} onClick={() => answer('yes')}>
              {busy === 'yes' ? 'Kaydediliyor…' : 'Evet, bendim'}
            </button>
            <button type="button" className="fx-btn fx-btn-danger fx-btn-sm" disabled={Boolean(busy)} onClick={() => answer('no')}>
              {busy === 'no' ? 'Koruma altına alınıyor…' : 'Hayır, ben değilim'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
