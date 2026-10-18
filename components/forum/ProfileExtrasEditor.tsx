'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BrandIcon, DEGREES, SOCIALS, cleanHandle, type Certificate, type Education, type Socials } from './profileExtras';

export type Extras = { headline: string; education: Education[]; certificates: Certificate[]; socials: Socials };

const THIS_YEAR = new Date().getFullYear();
const yearNum = (v: unknown) => {
  const n = parseInt(String(v ?? '').replace(/\D/g, '').slice(0, 4), 10);
  return Number.isFinite(n) && n >= 1950 && n <= THIS_YEAR + 8 ? n : null;
};

/** "Profili düzenle" penceresindeki özgeçmiş bölümleri (hepsi isteğe bağlı) */
export default function ProfileExtrasEditor({ value, onChange }: { value: Extras; onChange: (v: Extras) => void }) {
  const set = (patch: Partial<Extras>) => onChange({ ...value, ...patch });
  const setEdu = (i: number, patch: Partial<Education>) => set({ education: value.education.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const setCert = (i: number, patch: Partial<Certificate>) => set({ certificates: value.certificates.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  return (
    <div className="fx-form fx-cv-editor">
      <label className="fx-input">
        <span>Başlık</span>
        <input value={value.headline} maxLength={80} placeholder="Örn. Klinik Psikolog · Bilişsel Davranışçı Terapi" onChange={e => set({ headline: e.target.value })} />
        <small>Adının altında görünen kısa tanım. {value.headline.length}/80</small>
      </label>

      <div className="fx-cv-edit-sec">
        <div className="fx-cv-edit-head">
          <h4>Eğitim</h4>
          {value.education.length < 6 && (
            <button type="button" className="fx-text-btn" onClick={() => set({ education: [...value.education, { school: '', department: '', degree: 'Lisans', startYear: null, endYear: null, gpa: '', gpaScale: '4' }] })}>
              <Plus size={15} /> Ekle
            </button>
          )}
        </div>
        {value.education.length === 0 && <p className="fx-cv-edit-empty">Üniversite, bölüm ve not ortalamanı ekleyebilirsin.</p>}
        {value.education.map((e, i) => (
          <div key={i} className="fx-cv-edit-item">
            <div className="fx-cv-edit-row">
              <label className="fx-input" style={{ flex: 2 }}><span>Okul / üniversite</span><input value={e.school} maxLength={80} onChange={ev => setEdu(i, { school: ev.target.value })} /></label>
              <button type="button" className="fx-icon-btn" aria-label="Bu eğitimi kaldır" onClick={() => set({ education: value.education.filter((_, j) => j !== i) })}><Trash2 size={17} /></button>
            </div>
            <div className="fx-cv-edit-row">
              <label className="fx-input" style={{ flex: 2 }}><span>Bölüm</span><input value={e.department || ''} maxLength={80} onChange={ev => setEdu(i, { department: ev.target.value })} /></label>
              <label className="fx-input" style={{ flex: 1 }}>
                <span>Derece</span>
                <select value={e.degree || 'Lisans'} onChange={ev => setEdu(i, { degree: ev.target.value })}>{DEGREES.map(d => <option key={d}>{d}</option>)}</select>
              </label>
            </div>
            <div className="fx-cv-edit-row">
              <label className="fx-input"><span>Başlangıç yılı</span><input inputMode="numeric" value={e.startYear ?? ''} maxLength={4} onChange={ev => setEdu(i, { startYear: ev.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
              <label className="fx-input"><span>Bitiş yılı</span><input inputMode="numeric" value={e.endYear ?? ''} maxLength={4} placeholder="Devam ediyor" onChange={ev => setEdu(i, { endYear: ev.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
              <label className="fx-input"><span>Not ortalaması</span><input inputMode="decimal" value={e.gpa || ''} maxLength={6} placeholder={e.gpaScale === '100' ? '85' : '3,42'} onChange={ev => setEdu(i, { gpa: ev.target.value.replace(/[^0-9.,]/g, '') })} /></label>
              <label className="fx-input">
                <span>Ölçek</span>
                <select value={e.gpaScale || '4'} onChange={ev => setEdu(i, { gpaScale: ev.target.value as '4' | '100' })}><option value="4">4,00</option><option value="100">100</option></select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="fx-cv-edit-sec">
        <div className="fx-cv-edit-head">
          <h4>Sertifikalar</h4>
          {value.certificates.length < 20 && (
            <button type="button" className="fx-text-btn" onClick={() => set({ certificates: [...value.certificates, { name: '', issuer: '', year: null, url: '' }] })}>
              <Plus size={15} /> Ekle
            </button>
          )}
        </div>
        {value.certificates.length === 0 && <p className="fx-cv-edit-empty">Aldığın eğitim ve sertifikaları ekleyebilirsin.</p>}
        {value.certificates.map((c, i) => (
          <div key={i} className="fx-cv-edit-item">
            <div className="fx-cv-edit-row">
              <label className="fx-input" style={{ flex: 2 }}><span>Sertifika adı</span><input value={c.name} maxLength={100} onChange={ev => setCert(i, { name: ev.target.value })} /></label>
              <button type="button" className="fx-icon-btn" aria-label="Bu sertifikayı kaldır" onClick={() => set({ certificates: value.certificates.filter((_, j) => j !== i) })}><Trash2 size={17} /></button>
            </div>
            <div className="fx-cv-edit-row">
              <label className="fx-input" style={{ flex: 2 }}><span>Veren kurum</span><input value={c.issuer || ''} maxLength={80} onChange={ev => setCert(i, { issuer: ev.target.value })} /></label>
              <label className="fx-input" style={{ flex: 1 }}><span>Yıl</span><input inputMode="numeric" value={c.year ?? ''} maxLength={4} onChange={ev => setCert(i, { year: ev.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
            </div>
            <label className="fx-input"><span>Belge bağlantısı (isteğe bağlı)</span><input value={c.url || ''} maxLength={200} inputMode="url" placeholder="https://" onChange={ev => setCert(i, { url: ev.target.value })} /></label>
          </div>
        ))}
      </div>

      <div className="fx-cv-edit-sec">
        <div className="fx-cv-edit-head"><h4>Sosyal medya</h4></div>
        {SOCIALS.map(s => (
          <label key={s.key} className="fx-input">
            <span className="fx-cv-edit-net"><BrandIcon name={s.key} size={15} /> {s.label}</span>
            <div className="fx-input-prefix"><em>{s.prefix}</em><input value={value.socials[s.key] || ''} maxLength={60} placeholder="kullanıcı adı"
              onChange={e => set({ socials: { ...value.socials, [s.key]: cleanHandle(e.target.value) } })} /></div>
          </label>
        ))}
      </div>
    </div>
  );
}

/** Kaydetmeden önce boş kayıtlar atılır ve alanlar kırpılır */
export function cleanExtras(v: Extras) {
  const education = v.education
    .filter(e => e.school.trim())
    .map(e => ({
      school: e.school.trim().slice(0, 80),
      department: (e.department || '').trim().slice(0, 80),
      degree: e.degree || '',
      startYear: yearNum(e.startYear),
      endYear: yearNum(e.endYear),
      gpa: (e.gpa || '').replace(',', '.').slice(0, 6),
      gpaScale: e.gpaScale === '100' ? '100' : '4',
    }));
  const certificates = v.certificates
    .filter(c => c.name.trim())
    .map(c => ({ name: c.name.trim().slice(0, 100), issuer: (c.issuer || '').trim().slice(0, 80), year: yearNum(c.year), url: (c.url || '').trim().slice(0, 200) }));
  const socials: Socials = {};
  SOCIALS.forEach(s => { const h = cleanHandle(v.socials[s.key] || ''); if (h) socials[s.key] = h; });
  return { headline: v.headline.trim().slice(0, 80), education, certificates, socials };
}
