'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  MODE_LABEL, RISK_LABEL, STATUS_LABEL, planSessions, saveClient, saveNote,
  type Client, type ClientStatus, type Mode, type Note, type Risk,
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
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function SessionForm({ uid, clients, clientId, onClose, onSaved }: {
  uid: string; clients: Client[]; clientId?: string; onClose: () => void; onSaved: () => void;
}) {
  const first = clients.find(x => x.id === clientId) || clients.find(x => x.status === 'active') || clients[0];
  const next = new Date(); next.setMinutes(0, 0, 0); next.setHours(next.getHours() + 1);
  const [cid, setCid] = useState(first?.id || '');
  const sel = clients.find(x => x.id === cid);
  const [when, setWhen] = useState(toLocalInput(next));
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
    const start = new Date(when);
    if (Number.isNaN(start.getTime())) return toast.error('Tarih ve saat seç.');
    setSaving(true);
    try {
      await planSessions(uid, { clientId: sel.id, clientName: sel.name, start, duration: duration || 50, mode, fee, repeatWeeks: repeat });
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
      <Field label="Danışan" wide>
        <select value={cid} onChange={e => pick(e.target.value)}>
          {clients.filter(x => x.status !== 'ended' || x.id === cid).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </Field>
      <Field label="Tarih ve saat"><input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} /></Field>
      <Field label="Süre (dk)"><input inputMode="numeric" value={duration} maxLength={3} onChange={e => setDuration(Math.min(240, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0))} /></Field>
      <Field label="Görüşme biçimi"><Choice<Mode> value={mode} options={MODE_LABEL} onChange={setMode} /></Field>
      <Field label="Ücret (₺)"><input inputMode="numeric" value={fee ?? ''} maxLength={7} onChange={e => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); setFee(Number.isFinite(n) ? n : null); }} /></Field>
      <Field label="Haftalık tekrarla" hint={repeat > 1 ? `Aynı gün ve saatte ${repeat} hafta boyunca seans oluşturulur.` : 'Tek seans'} wide>
        <select value={repeat} onChange={e => setRepeat(parseInt(e.target.value, 10))}>
          {[1, 2, 4, 6, 8, 12, 16, 24].map(n => <option key={n} value={n}>{n === 1 ? 'Tekrarlama' : `${n} hafta`}</option>)}
        </select>
      </Field>
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
