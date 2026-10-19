'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck } from 'lucide-react';
import { DM_RULES, acceptRules, hasAccepted } from './data';

/** Mesajlaşmayı ilk kez açan kişi kuralları tek tek onaylamadan mesajlaşamaz */
export default function DmRulesGate({ uid, children }: { uid: string; children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'ask' | 'ok'>('loading');
  const [checked, setChecked] = useState<boolean[]>(() => DM_RULES.map(() => false));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let on = true;
    hasAccepted(uid).then(ok => on && setState(ok ? 'ok' : 'ask')).catch(() => on && setState('ask'));
    return () => { on = false; };
  }, [uid]);

  if (state === 'ok') return <>{children}</>;
  if (state === 'loading') return <div className="fx-end">Yükleniyor…</div>;

  const all = checked.every(Boolean);
  const accept = async () => {
    if (!all) return;
    setSaving(true);
    try {
      await acceptRules(uid);
      setState('ok');
    } catch {
      toast.error('Onayın kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="dm-rules">
      <span className="dm-rules-ic"><ShieldCheck size={26} /></span>
      <h2>Mesajlaşma kuralları</h2>
      <p>Mesajlaşmaya başlamadan önce aşağıdaki kuralların her birini okuyup onaylaman gerekiyor.</p>
      <ul>
        {DM_RULES.map((r, i) => (
          <li key={i}>
            <label className={checked[i] ? 'is-on' : ''}>
              <input type="checkbox" checked={checked[i]} onChange={e => setChecked(prev => prev.map((v, j) => (j === i ? e.target.checked : v)))} />
              <span>{r}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="dm-rules-private"><Lock size={14} /> Mesajlarını yalnızca sen ve yazıştığın kişi okuyabilir; site yöneticilerinin mesajlara erişimi yoktur. Bir mesajı şikayet edersen yalnızca o mesaj yöneticilere iletilir.</p>
      <button type="button" className="fx-btn fx-btn-primary" disabled={!all || saving} onClick={accept}>
        {saving ? 'Kaydediliyor…' : all ? 'Kabul ediyorum, devam et' : `Devam etmek için tüm maddeleri onayla (${checked.filter(Boolean).length}/${DM_RULES.length})`}
      </button>
    </section>
  );
}
