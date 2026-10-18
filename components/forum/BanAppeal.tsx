'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

type Appeal = { status: 'pending' | 'accepted' | 'rejected'; message: string; adminReply?: string; reviewedAt?: { toMillis?: () => number } };

const DAY = 24 * 3600_000;

function banPeriod(p: { banUntil?: unknown } | null | undefined) {
  const until = p?.banUntil as { toDate?: () => Date } | string | number | null | undefined;
  if (!until) return 'süresiz olarak';
  const d = typeof until === 'object' && typeof until.toDate === 'function' ? until.toDate() : new Date(until as string | number);
  return `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihine kadar`;
}

/**
 * Banlı kullanıcıya gösterilen uyarı ve itiraz: itiraz yöneticiye gider; sonucu ve yöneticinin yanıtı
 * burada görünür. Reddedilen itirazdan 24 saat sonra yeniden itiraz edilebilir.
 */
export default function BanAppeal() {
  const { user, userProfile } = useAuth();
  const [appeal, setAppeal] = useState<Appeal | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  // Bekleme süresi, itiraz kaydı her geldiğinde o anki zamana göre hesaplanır
  const [now, setNow] = useState(0);
  const banned = Boolean(user && userProfile?.isBanned);

  useEffect(() => {
    if (!user || !banned) return;
    return onSnapshot(doc(db, 'ban_appeals', user.uid), s => { setNow(Date.now()); setAppeal(s.exists() ? (s.data() as Appeal) : null); }, () => setAppeal(null));
  }, [user, banned]);

  if (!banned || !user) return null;

  const reviewedAt = appeal?.reviewedAt?.toMillis?.() || 0;
  const waitLeft = appeal?.status === 'rejected' ? Math.max(0, reviewedAt + DAY - now) : 0;
  // Daha önce kabul edilmiş bir itiraz varsa (yeniden banlanmış) yeni itiraz açılabilir
  const canAppeal = appeal === null || appeal?.status === 'accepted' || (appeal?.status === 'rejected' && waitLeft === 0);
  const len = text.trim().length;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (len < 10) return toast.error('İtirazını en az birkaç cümleyle açıkla.');
    setBusy(true);
    try {
      await setDoc(doc(db, 'ban_appeals', user.uid), {
        uid: user.uid,
        username: userProfile?.username || '',
        displayName: userProfile?.displayName || '',
        message: text.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setOpen(false);
      setText('');
      toast.success('İtirazın gönderildi. Sonucu burada görebilirsin.');
    } catch {
      toast.error('İtiraz gönderilemedi. Lütfen biraz sonra tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fx-alert fx-ban" role="status">
      <div>
        <b>Hesabın yönetici tarafından {banPeriod(userProfile)} askıya alındı.</b> Gönderi paylaşamaz, yanıt yazamaz ve etkileşimde bulunamazsın.
      </div>

      {appeal?.status === 'pending' && (
        <div className="fx-ban-state">İtirazın alındı ve inceleniyor. Sonuç burada görünecek.</div>
      )}
      {appeal?.status === 'rejected' && (
        <div className="fx-ban-state">
          <b>İtirazın reddedildi.</b>
          {appeal.adminReply ? <> Yönetici yanıtı: “{appeal.adminReply}”</> : null}
          {waitLeft > 0 ? <> {Math.ceil(waitLeft / 3600_000)} saat sonra yeniden itiraz edebilirsin.</> : null}
        </div>
      )}

      {canAppeal && !open && (
        <button type="button" className="fx-btn fx-btn-primary fx-btn-sm fx-ban-btn" onClick={() => setOpen(true)}>
          {appeal?.status === 'rejected' ? 'Yeniden itiraz et' : 'Bana itiraz et'}
        </button>
      )}

      {open && (
        <form className="fx-ban-form" onSubmit={send}>
          <label htmlFor="ban_appeal_text">Banın neden kaldırılması gerektiğini düşünüyorsun?</label>
          <textarea
            id="ban_appeal_text"
            className="fx-field"
            value={text}
            maxLength={2000}
            autoFocus
            onChange={e => setText(e.target.value)}
            placeholder="Örneğin: Paylaşımım yanlış anlaşıldı; şu bağlamda yazmıştım…"
          />
          <div className="fx-ban-foot">
            <span>{len}/2000</span>
            <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => setOpen(false)}>Vazgeç</button>
            <button type="submit" className="fx-btn fx-btn-primary fx-btn-sm" disabled={busy || len < 10}>{busy ? 'Gönderiliyor…' : 'İtirazı gönder'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
