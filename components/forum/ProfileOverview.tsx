'use client';

import React from 'react';
import { Award, ChevronRight, ExternalLink, GraduationCap, Link as LinkIcon, X } from 'lucide-react';
import { renderTextWithMentions } from '@/components/forum/ThreadView';
import {
  BrandIcon, SOCIALS, formatGpa, safeUrl, socialUrl, yearsOf,
  type Certificate, type Education, type Socials,
} from './profileExtras';

type ProfileData = { bio?: string; headline?: string; website?: string; education?: unknown; certificates?: unknown; socials?: Socials };

function extras(pd: ProfileData) {
  const education: Education[] = Array.isArray(pd.education) ? (pd.education as Education[]).filter(e => e?.school) : [];
  const certificates: Certificate[] = Array.isArray(pd.certificates) ? (pd.certificates as Certificate[]).filter(c => c?.name) : [];
  const socials: Socials = pd.socials || {};
  const socialList = SOCIALS.filter(s => socials[s.key]);
  const website = safeUrl(pd.website);
  return { education, certificates, socials, socialList, website };
}

/**
 * Künyenin altındaki kısa özgeçmiş şeridi: ilk eğitim, sertifika sayısı ve sosyal medya simgeleri.
 * Dokununca özgeçmişin tamamı açılır pencerede gösterilir. Kendi profilinde eksikler için tamamlama satırı.
 */
export function ProfileSummary({ pd, isOwn, onOpen, onEdit }: { pd: ProfileData; isOwn: boolean; onOpen: () => void; onEdit: () => void }) {
  const { education, certificates, socials, socialList, website } = extras(pd);
  const steps = [Boolean(pd.headline), Boolean(pd.bio), education.length > 0, certificates.length > 0, socialList.length > 0 || Boolean(website)];
  const labels = ['başlık', 'hakkında', 'eğitim', 'sertifika', 'bağlantı'];
  const done = steps.filter(Boolean).length;
  const hasCv = education.length > 0 || certificates.length > 0;
  const first = education[0];
  if (!hasCv && !socialList.length && !(isOwn && done < steps.length)) return null;

  return (
    <div className="fx-cvs">
      {hasCv && (
        <button type="button" className="fx-cvs-card" onClick={onOpen} aria-label="Özgeçmişin tamamını gör">
          {first && (
            <span className="fx-cvs-line">
              <GraduationCap size={17} />
              <span><b>{first.school}</b>{first.department ? ` · ${first.department}` : ''}</span>
              {education.length > 1 && <em>+{education.length - 1}</em>}
            </span>
          )}
          {certificates.length > 0 && (
            <span className="fx-cvs-line">
              <Award size={17} />
              <span>{certificates.length === 1 ? certificates[0].name : `${certificates.length} sertifika`}</span>
            </span>
          )}
          <span className="fx-cvs-more">Özgeçmiş <ChevronRight size={16} /></span>
        </button>
      )}
      {socialList.length > 0 && (
        <div className="fx-cvs-socials">
          {socialList.map(s => (
            <a key={s.key} href={socialUrl(s.key, socials[s.key]!)} data-net={s.key} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${s.label}: @${socials[s.key]}`} title={`${s.label} · @${socials[s.key]}`}>
              <BrandIcon name={s.key} />
            </a>
          ))}
        </div>
      )}
      {isOwn && done < steps.length && (
        <button type="button" className="fx-cvs-complete" onClick={onEdit}>
          <span className="fx-cvs-complete-top"><b>Profilini tamamla</b><span>{done}/{steps.length}</span></span>
          <span className="fx-cv-progress"><span style={{ width: `${(done / steps.length) * 100}%` }} /></span>
          <small>Eksik: {labels.filter((_, i) => !steps[i]).join(', ')}</small>
        </button>
      )}
    </div>
  );
}

/** Özgeçmişin tamamı: Hakkında, Eğitim, Sertifikalar, Bağlantılar */
export function ProfileCVModal({ pd, name, onClose }: { pd: ProfileData; name: string; onClose: () => void }) {
  const { education, certificates, socials, socialList, website } = extras(pd);
  return (
    <div className="fx-modal-scrim" onClick={onClose}>
      <div className="fx-modal fx-modal-lg" role="dialog" aria-modal="true" aria-label={`${name} özgeçmiş`} onClick={e => e.stopPropagation()}>
        <div className="fx-modal-head">
          <button type="button" className="fx-icon-btn" onClick={onClose} aria-label="Kapat" style={{ color: 'var(--fx-ink)' }}><X size={20} /></button>
          <div className="fx-modal-title">Özgeçmiş</div>
        </div>
        <div className="fx-modal-scroll">
          <div className="fx-cv fx-cv-modal">
            {pd.headline && <p className="fx-cv-headline">{pd.headline}</p>}
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
          </div>
        </div>
      </div>
    </div>
  );
}
