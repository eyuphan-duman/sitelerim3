'use client';

/**
 * Haftanın ve ayın birincileri.
 * - Duyuru: hafta (pazartesi 00:00) ya da ay (ayın 1'i) bitince foruma giren herkese bir kez gösterilir;
 *   bir sonraki dönemin birincisi gelince yenisi gösterilir.
 * - Rozet: haftanın birincileri bir sonraki hafta boyunca profil fotoğraflarının üstünde rozet taşır.
 */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, X } from 'lucide-react';
import { championLabel, isCurrentChampion, type Champion } from '@/lib/periods';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, VerifiedMark } from './ui';
import { isApprovedPsychologist, profileHref, useScores, useUsersByIds } from './social';

const seenKey = (key: string) => `logos:champ-seen:${key}`;
const wasSeen = (key: string) => { try { return Boolean(localStorage.getItem(seenKey(key))); } catch { return false; } };

/** Bu hafta rozet taşıyanlar: geçen haftanın birincileri */
export function useWeekChampions() {
  const board = useScores();
  return useMemo(() => {
    const c = board.champions?.week;
    return new Set(isCurrentChampion(c) ? c.winners.map(w => w.uid) : []);
  }, [board]);
}

/** Avatarın köşesindeki küçük kupa (avatarı saran öğe .fx-champ-host olmalı) */
export function ChampMark({ uid }: { uid?: string | null }) {
  const champs = useWeekChampions();
  if (!uid || !champs.has(uid)) return null;
  return <span className="fx-champ-mark" title="Haftanın 1.si" aria-label="Haftanın 1.si"><Trophy size={10} strokeWidth={2.6} /></span>;
}

export function ChampionAnnouncement() {
  const board = useScores();
  const { user } = useAuth();
  const router = useRouter();
  const [closed, setClosed] = useState<string[]>([]);
  const pending = useMemo(() => {
    if (!board.at) return [] as Champion[];
    return [board.champions?.week, board.champions?.month]
      .filter((c): c is Champion => isCurrentChampion(c))
      .filter(c => !closed.includes(c.key) && !wasSeen(c.key));
  }, [board, closed]);
  const c = pending[0];
  const people = useUsersByIds(c ? c.winners.map(w => w.uid) : []);
  if (!c || !people.length) return null;

  const close = () => {
    try { localStorage.setItem(seenKey(c.key), '1'); } catch {}
    setClosed(prev => [...prev, c.key]);
  };
  const many = people.length > 1;
  const title = c.period === 'week' ? (many ? 'Haftanın birincileri' : 'Haftanın birincisi') : (many ? 'Ayın birincileri' : 'Ayın birincisi');
  const pts = Object.fromEntries(c.winners.map(w => [w.uid, w.points]));
  const meWon = Boolean(user && pts[user.uid] !== undefined);

  return (
    <div className="fx-modal-scrim" onClick={close}>
      <div className="fx-modal fx-champ-modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <button type="button" className="fx-icon-btn fx-champ-x" onClick={close} aria-label="Kapat"><X size={20} /></button>
        <span className="fx-champ-cup"><Trophy size={30} /></span>
        <h2>{title}</h2>
        <p className="fx-champ-when">{championLabel(c)}</p>
        <div className={`fx-champ-list ${many ? 'is-many' : ''}`}>
          {people.map(u => (
            <button key={u.uid} type="button" className="fx-champ-person" onClick={() => { close(); router.push(profileHref(u)); }}>
              <span className="fx-champ-host"><Avatar src={u.photoURL} name={u.displayName || u.username} size={many ? 52 : 76} /><span className="fx-champ-mark"><Trophy size={many ? 10 : 13} strokeWidth={2.6} /></span></span>
              <span className="fx-champ-name">{u.displayName || u.username}{isApprovedPsychologist(u) && <VerifiedMark iconOnly size={15} />}</span>
              <small>@{u.username}</small>
              <span className="fx-champ-pts">{pts[u.uid]} puan</span>
            </button>
          ))}
        </div>
        {meWon ? (
          <p className="fx-champ-note">Tebrikler! {c.period === 'week' ? 'Bu hafta boyunca profil fotoğrafında “Haftanın 1.si” rozeti görünecek.' : 'Ayın en çok ilgi gören paylaşımları seninkilerdi.'} Birinciliklerini profilinde göstermek için Profili düzenle’de “Birinciliklerimi göster”i açabilirsin.</p>
        ) : (
          <p className="fx-champ-note">{c.period === 'week' ? 'Geçen hafta paylaşımları en çok beğeni, yer işareti ve yeniden paylaşım alan kişi. Yeni hafta başladı; puanlar sıfırlandı.' : 'Geçen ay paylaşımları en çok ilgi gören kişi. Yeni ay başladı; aylık puanlar sıfırlandı.'}</p>
        )}
        <button type="button" className="fx-btn fx-btn-primary fx-champ-ok" onClick={close}>Tamam</button>
      </div>
    </div>
  );
}
