'use client';

import React from 'react';
import { Award, ExternalLink, GraduationCap, Link as LinkIcon, PenLine, ArrowRight } from 'lucide-react';
import { renderTextWithMentions } from '@/components/forum/ThreadView';
import {
  BrandIcon, SOCIALS, formatGpa, safeUrl, socialUrl, yearsOf,
  type Certificate, type Education, type Socials,
} from './profileExtras';

type ProfileData = { bio?: string; headline?: string; website?: string; education?: unknown; certificates?: unknown; socials?: Socials };

type Props = {
  pd: ProfileData;
  isOwn: boolean;
  postCount: number;
  preview: React.ReactNode;
  onShowAll: () => void;
  onEdit: () => void;
};

/**
 * Profilin özgeçmiş görünümü: Hakkında, Eğitim, Sertifikalar, Bağlantılar ve son paylaşımlar.
 * Tüm paylaşımlar "Tüm paylaşımları gör" ile açılan sekmeli görünümdedir.
 */
export default function ProfileOverview({ pd, isOwn, postCount, preview, onShowAll, onEdit }: Props) {
  const education: Education[] = Array.isArray(pd.education) ? (pd.education as Education[]).filter(e => e?.school) : [];
  const certificates: Certificate[] = Array.isArray(pd.certificates) ? (pd.certificates as Certificate[]).filter(c => c?.name) : [];
  const socials: Socials = pd.socials || {};
  const socialList = SOCIALS.filter(s => socials[s.key]);
  const website = safeUrl(pd.website);

  // Kendi profilinde eksik bölümler için tamamlama kartı
  const steps = [
    { done: Boolean(pd.headline), label: 'Başlık' },
    { done: Boolean(pd.bio), label: 'Hakkında' },
    { done: education.length > 0, label: 'Eğitim' },
    { done: certificates.length > 0, label: 'Sertifikalar' },
    { done: socialList.length > 0 || Boolean(website), label: 'Bağlantılar' },
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="fx-cv">
      {isOwn && doneCount < steps.length && (
        <section className="fx-cv-card fx-cv-complete">
          <div className="fx-cv-complete-top">
            <h3>Profilini tamamla</h3>
            <span>{doneCount}/{steps.length}</span>
          </div>
          <div className="fx-cv-progress" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount}>
            <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <p>Eksik bölümler: {steps.filter(s => !s.done).map(s => s.label).join(', ')}. Bu bilgiler yalnızca sen eklersen görünür.</p>
          <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={onEdit}><PenLine size={15} /> Profili düzenle</button>
        </section>
      )}

      {pd.bio && (
        <section className="fx-cv-card">
          <h3 className="fx-cv-title">Hakkında</h3>
          <p className="fx-cv-about">{renderTextWithMentions(pd.bio)}</p>
        </section>
      )}

      {education.length > 0 && (
        <section className="fx-cv-card">
          <h3 className="fx-cv-title">Eğitim</h3>
          <ul className="fx-cv-list">
            {education.map((e, i) => (
              <li key={i} className="fx-cv-item">
                <span className="fx-cv-ic"><GraduationCap size={20} /></span>
                <div>
                  <b>{e.school}</b>
                  {(e.department || e.degree) && <div className="fx-cv-sub">{[e.department, e.degree].filter(Boolean).join(' · ')}</div>}
                  <div className="fx-cv-meta">{[yearsOf(e), formatGpa(e)].filter(Boolean).join(' · ')}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {certificates.length > 0 && (
        <section className="fx-cv-card">
          <h3 className="fx-cv-title">Sertifikalar</h3>
          <ul className="fx-cv-list">
            {certificates.map((c, i) => {
              const url = safeUrl(c.url);
              return (
                <li key={i} className="fx-cv-item">
                  <span className="fx-cv-ic"><Award size={20} /></span>
                  <div>
                    <b>{c.name}</b>
                    {(c.issuer || c.year) && <div className="fx-cv-sub">{[c.issuer, c.year].filter(Boolean).join(' · ')}</div>}
                    {url && <a className="fx-cv-link" href={url} target="_blank" rel="noopener noreferrer nofollow">Belgeyi gör <ExternalLink size={13} /></a>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(socialList.length > 0 || website) && (
        <section className="fx-cv-card">
          <h3 className="fx-cv-title">Bağlantılar</h3>
          <div className="fx-cv-socials">
            {socialList.map(s => (
              <a key={s.key} className="fx-cv-social" data-net={s.key} href={socialUrl(s.key, socials[s.key]!)} target="_blank" rel="noopener noreferrer nofollow">
                <BrandIcon name={s.key} />
                <span>{s.label}</span>
                <em>@{socials[s.key]}</em>
              </a>
            ))}
            {website && (
              <a className="fx-cv-social" href={website} target="_blank" rel="noopener noreferrer nofollow">
                <LinkIcon size={18} />
                <span>Web sitesi</span>
                <em>{website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</em>
              </a>
            )}
          </div>
        </section>
      )}

      <section className="fx-cv-card fx-cv-posts">
        <div className="fx-cv-posts-head">
          <h3 className="fx-cv-title">Paylaşımlar</h3>
          <span>{postCount} gönderi</span>
        </div>
        <div className="fx-cv-preview">{preview}</div>
        {postCount > 0 && (
          <button type="button" className="fx-cv-all" onClick={onShowAll}>
            {postCount > 3 ? `Tüm paylaşımları gör (${postCount})` : 'Paylaşımlar, yanıtlar ve beğeniler'} <ArrowRight size={16} />
          </button>
        )}
      </section>
    </div>
  );
}
