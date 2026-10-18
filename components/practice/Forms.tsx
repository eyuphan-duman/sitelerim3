'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  MODE_LABEL, RISK_LABEL, SESSION_LABEL, STATUS_LABEL, addDays, planSessions, saveClient, saveNote, startOfDay,
  type Client, type ClientStatus, type Mode, type Note, type Risk, type SessionStatus,
} from './data';

function Modal({ title, onClose, onSave, saving, saveLabel = 'Kaydet', children }: {
  title: string; onClose: () => void; onSave: () => void; saving: boolean; saveLabel?: string; children: React.ReactNode;
}) {
  return (
    <div className="fx-modal-scrim" onClick={onClose}>
      <div className="fx-modal fx-modal-lg" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="fx-modal-head">
          <button type="button" className="fx-icon-btn" onClick={onClose} aria-label="Kapat" style={{ color: 'var(--fx-ink)' }}><X size={20} /></button>
          <div className="fx-modal-title">{title}</div>
          <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={onSave} disabled={saving}>{saving ? 'Kaydediliyor…' : saveLabel}</button>
        </div>
        <div className="fx-modal-scroll"><div className="fx-form pr-form">{children}</div></div>
      </div>
    </div>
  );
}

const Field = ({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) => (
  <label className="fx-input" style={wide ? { gridColumn: '1 / -1' } : undefined}>
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
);

function Choice<T extends string>({ value, options, onChange }: { value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="pr-choice" role="radiogroup">
      {(Object.keys(options) as T[]).map(k => (
        <button key={k} type="button" role="radio" aria-checked={value === k} className={value === k ? 'is-on' : ''} onClick={() => onChange(k)}>{options[k]}</button>
      ))}
    </div>
  );
}

/** Sayısal ya da metin seçenekler için çip satırı (uygulamadaki Chip dizisiyle aynı) */
export function ChipRow<T extends string | number>({ value, options, onChange, scroll, label }: {
  value: T; options: [T, string][]; onChange: (v: T) => void; scroll?: boolean; label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Fareyle kullananlar için: yatay satırda dikey tekerlek hareketi satırı kaydırır (uçlara gelince sayfa kayar)
  useEffect(() => {
    const el = ref.current;
    if (!scroll || !el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scroll]);
  return (
    <div ref={ref} className={`pr-choice ${scroll ? 'pr-choice-scroll' : ''}`} role="radiogroup" aria-label={label}>
      {options.map(([k, l]) => (
        <button key={String(k)} type="button" role="radio" aria-checked={value === k} className={value === k ? 'is-on' : ''} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

/** Seans durumu: renkli çip, dokununca durum listesi açılır */
export function StatusSelect({ status, onChange }: { status: SessionStatus; onChange: (s: SessionStatus) => void }) {
  return (
    <span className={`pr-status is-${status}`}>
      <select aria-label="Seans durumu" value={status} onChange={e => onChange(e.target.value as SessionStatus)}>
        {(Object.keys(SESSION_LABEL) as SessionStatus[]).map(k => <option key={k} value={k}>{SESSION_LABEL[k]}</option>)}
      </select>
    </span>
  );
}

/** Seans tarihi ve saati: önümüzdeki 60 gün ve 07:00–22:45 arası 15 dakikalık aralıklar */
function DateTimePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const days = useMemo(() => Array.from({ length: 61 }, (_, i) => addDays(startOfDay(), i)), []);
  const dayKey = (d: Date) => d.toDateString();
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const at = (y: Date, h: number, m: number) => new Date(y.getFullYear(), y.getMonth(), y.getDate(), h, m);
  return (
    <div className="pr-dt">
      <b>{value.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })} · {String(value.getHours()).padStart(2, '0')}:{String(value.getMinutes()).padStart(2, '0')}</b>
      <ChipRow scroll label="Gün" value={dayKey(value)} onChange={k => { const d = days.find(x => dayKey(x) === k)!; onChange(at(d, value.getHours(), value.getMinutes())); }}
        options={days.map((d, i) => [dayKey(d), i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })])} />
      <ChipRow scroll label="Saat" value={value.getHours()} onChange={h => onChange(at(value, h, value.getMinutes()))}
        options={hours.map(h => [h, `${String(h).padStart(2, '0')}:00`])} />
      <ChipRow label="Dakika" value={value.getMinutes()} onChange={m => onChange(at(value, value.getHours(), m))}
        options={[0, 15, 30, 45].map(m => [m, `:${String(m).padStart(2, '0')}`])} />
    </div>
  );
}

/* ── Danışan dosyası ── */
export function ClientForm({ uid, client, onClose, onSaved }: { uid: string; client?: Client | null; onClose: () => void; onSaved: (id: string) => void }) {
  const [c, setC] = useState<Omit<Client, 'id'> & { id?: string }>(client || {
    name: '', risk: 'none', status: 'active', duration: 50, mode: 'face', fee: null,
    birthYear: null, phone: '', email: '', emergency: '', reason: '', goals: '', medication: '', referral: '', riskNote: '', location: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (p: Partial<Client>) => setC(prev => ({ ...prev, ...p }));

  const save = async () => {
    if (!c.name.trim()) return toast.error('Danışanın adını ya da kodunu yaz.');
    setSaving(true);
    try {
      const id = await saveClient(uid, { ...c, name: c.name.trim().slice(0, 80) });
      toast.success(client ? 'Danışan dosyası güncellendi' : 'Danışan eklendi');
      onSaved(id);
    } catch {
      toast.error('Kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={client ? 'Danışan dosyasını düzenle' : 'Yeni danışan'} onClose={onClose} onSave={save} saving={saving}>
      <p className="pr-hint" style={{ gridColumn: '1 / -1' }}>Bu bilgileri yalnızca sen görürsün. Danışanının açık rızasını almadan kimlik ya da sağlık bilgisi kaydetme; istersen ad yerine bir kod (örn. D-014) kullanabilirsin.</p>
      <Field label="Ad soyad ya da kod" wide><input value={c.name} maxLength={80} autoFocus onChange={e => set({ name: e.target.value })} /></Field>
      <Field label="Doğum yılı"><input inputMode="numeric" maxLength={4} value={c.birthYear ?? ''} onChange={e => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); set({ birthYear: Number.isFinite(n) ? n : null }); }} /></Field>
      <Field label="Durum"><Choice<ClientStatus> value={c.status} options={STATUS_LABEL} onChange={v => set({ status: v })} /></Field>
      <Field label="Telefon"><input inputMode="tel" value={c.phone || ''} maxLength={30} onChange={e => set({ phone: e.target.value })} /></Field>
      <Field label="E-posta"><input inputMode="email" value={c.email || ''} maxLength={120} onChange={e => set({ email: e.target.value })} /></Field>
      <Field label="Acil durumda ulaşılacak kişi" wide><input value={c.emergency || ''} maxLength={120} placeholder="Ad, yakınlık, telefon" onChange={e => set({ emergency: e.target.value })} /></Field>

      <h4 className="pr-sec">Klinik bilgiler</h4>
      <Field label="Başvuru nedeni" wide><textarea rows={3} maxLength={2000} value={c.reason || ''} onChange={e => set({ reason: e.target.value })} /></Field>
      <Field label="Terapi hedefleri" wide><textarea rows={3} maxLength={2000} value={c.goals || ''} onChange={e => set({ goals: e.target.value })} /></Field>
      <Field label="İlaç kullanımı"><input value={c.medication || ''} maxLength={200} onChange={e => set({ medication: e.target.value })} /></Field>
      <Field label="Yönlendiren"><input value={c.referral || ''} maxLength={120} onChange={e => set({ referral: e.target.value })} /></Field>
      <Field label="Risk değerlendirmesi" wide><Choice<Risk> value={c.risk} options={RISK_LABEL} onChange={v => set({ risk: v })} /></Field>
      {c.risk !== 'none' && <Field label="Risk notu" wide><textarea rows={2} maxLength={1000} value={c.riskNote || ''} placeholder="Ne gözlemlendi, hangi önlem alındı?" onChange={e => set({ riskNote: e.target.value })} /></Field>}

      <h4 className="pr-sec">Seans düzeni</h4>
      <Field label="Seans süresi (dk)"><input inputMode="numeric" value={c.duration} maxLength={3} onChange={e => set({ duration: Math.min(240, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0) })} /></Field>
      <Field label="Seans ücreti (₺)"><input inputMode="numeric" value={c.fee ?? ''} maxLength={7} onChange={e => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); set({ fee: Number.isFinite(n) ? n : null }); }} /></Field>
      <Field label="Görüşme biçimi"><Choice<Mode> value={c.mode} options={MODE_LABEL} onChange={v => set({ mode: v })} /></Field>
      <Field label={c.mode === 'online' ? 'Görüşme bağlantısı' : 'Yer'}><input value={c.location || ''} maxLength={200} onChange={e => set({ location: e.target.value })} /></Field>
    </Modal>
  );
}

/* ── Seans planla ── */

export function SessionForm({ uid, clients, clientId, onClose, onSaved }: {
  uid: string; clients: Client[]; clientId?: string; onClose: () => void; onSaved: () => void;
}) {
  const first = clients.find(x => x.id === clientId) || clients.find(x => x.status === 'active') || clients[0];
  const [cid, setCid] = useState(first?.id || '');
  const sel = clients.find(x => x.id === cid);
  const [when, setWhen] = useState(() => { const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1); return d; });
  const [duration, setDuration] = useState(sel?.duration || 50);
  const [mode, setMode] = useState<Mode>(sel?.mode || 'face');
  const [fee, setFee] = useState<number | null>(sel?.fee ?? null);
  const [repeat, setRepeat] = useState(1);
  const [saving, setSaving] = useState(false);

  const pick = (id: string) => {
    setCid(id);
    const c = clients.find(x => x.id === id);
    if (c) { setDuration(c.duration || 50); setMode(c.mode || 'face'); setFee(c.fee ?? null); }
  };

  const save = async () => {
    if (!sel) return toast.error('Önce bir danışan seç.');
    setSaving(true);
    try {
      await planSessions(uid, { clientId: sel.id, clientName: sel.name, start: when, duration: duration || 50, mode, fee, repeatWeeks: repeat });
      toast.success(repeat > 1 ? `${repeat} seans planlandı` : 'Seans planlandı');
      onSaved();
    } catch {
      toast.error('Seans planlanamadı.');
    } finally {
      setSaving(false);
    }
  };

  if (!clients.length) {
    return <Modal title="Seans planla" onClose={onClose} onSave={onClose} saving={false} saveLabel="Kapat"><p className="pr-hint">Seans planlamak için önce bir danışan ekle.</p></Modal>;
  }
  return (
    <Modal title="Seans planla" onClose={onClose} onSave={save} saving={saving} saveLabel="Planla">
      <div className="fx-input" style={{ gridColumn: '1 / -1' }}>
        <span>Danışan</span>
        <ChipRow label="Danışan" value={cid} onChange={pick} options={clients.filter(x => x.status !== 'ended' || x.id === cid).map(x => [x.id, x.name])} />
      </div>
      <div className="fx-input" style={{ gridColumn: '1 / -1' }}>
        <span>Tarih ve saat</span>
        <DateTimePicker value={when} onChange={setWhen} />
      </div>
      <Field label="Süre (dk)"><input inputMode="numeric" value={duration} maxLength={3} onChange={e => setDuration(Math.min(240, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0))} /></Field>
      <Field label="Görüşme biçimi"><Choice<Mode> value={mode} options={MODE_LABEL} onChange={setMode} /></Field>
      <Field label="Ücret (₺)"><input inputMode="numeric" value={fee ?? ''} maxLength={7} onChange={e => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); setFee(Number.isFinite(n) ? n : null); }} /></Field>
      <div className="fx-input" style={{ gridColumn: '1 / -1' }}>
        <span>Haftalık tekrarla</span>
        <ChipRow label="Haftalık tekrarla" value={repeat} onChange={setRepeat} options={[1, 2, 4, 6, 8, 12, 16, 24].map(n => [n, n === 1 ? 'Tekrarlama' : `${n} hafta`])} />
        {repeat > 1 && <small>Aynı gün ve saatte {repeat} hafta boyunca seans oluşturulur.</small>}
      </div>
    </Modal>
  );
}

/* ── Seans notu ── */
export function NoteForm({ uid, clientId, sessionId, sessionDate, note, onClose, onSaved }: {
  uid: string; clientId: string; sessionId?: string | null; sessionDate?: Date; note?: Note | null; onClose: () => void; onSaved: () => void;
}) {
  const [n, setN] = useState({
    observations: note?.observations || '', discussed: note?.discussed || '', intervention: note?.intervention || '',
    homework: note?.homework || '', plan: note?.plan || '', mood: note?.mood ?? null as number | null, risk: Boolean(note?.risk),
  });
  const [saving, setSaving] = useState(false);
  const set = (p: Partial<typeof n>) => setN(prev => ({ ...prev, ...p }));

  const save = async () => {
    if (![n.observations, n.discussed, n.intervention, n.homework, n.plan].some(x => x.trim())) return toast.error('Notun en az bir bölümünü doldur.');
    setSaving(true);
    try {
      await saveNote(uid, {
        id: note?.id, clientId, sessionId: note?.sessionId ?? sessionId ?? null,
        date: note ? note.date.toDate() : sessionDate || new Date(),
        observations: n.observations.trim(), discussed: n.discussed.trim(), intervention: n.intervention.trim(),
        homework: n.homework.trim(), plan: n.plan.trim(), mood: n.mood, risk: n.risk,
      });
      toast.success('Not kaydedildi');
      onSaved();
    } catch {
      toast.error('Not kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const area = (key: 'observations' | 'discussed' | 'intervention' | 'homework' | 'plan', label: string, ph: string) => (
    <Field label={label} wide><textarea rows={3} maxLength={4000} value={n[key]} placeholder={ph} onChange={e => set({ [key]: e.target.value } as Partial<typeof n>)} /></Field>
  );

  return (
    <Modal title={note ? 'Notu düzenle' : 'Seans notu'} onClose={onClose} onSave={save} saving={saving}>
      {area('observations', 'Gözlemler', 'Duygu durumu, görünüm, seansa katılım…')}
      {area('discussed', 'Konuşulanlar', 'Seansta gündeme gelen konular')}
      {area('intervention', 'Uygulanan müdahale', 'Teknik, egzersiz, psikoeğitim…')}
      {area('homework', 'Ödev', 'Bir sonraki seansa kadar')}
      {area('plan', 'Sonraki seans planı', 'Nereden devam edilecek?')}
      <Field label={`Ruh hali (danışanın değerlendirmesi)${n.mood ? `: ${n.mood}/10` : ''}`} wide>
        <div className="pr-mood" role="radiogroup" aria-label="Ruh hali 1-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
            <button key={v} type="button" role="radio" aria-checked={n.mood === v} className={n.mood === v ? 'is-on' : ''} onClick={() => set({ mood: n.mood === v ? null : v })}>{v}</button>
          ))}
        </div>
      </Field>
      <label className="pr-check" style={{ gridColumn: '1 / -1' }}>
        <input type="checkbox" checked={n.risk} onChange={e => set({ risk: e.target.checked })} />
        <span>Bu seansta risk belirtisi gözlemlendi</span>
      </label>
    </Modal>
  );
}
