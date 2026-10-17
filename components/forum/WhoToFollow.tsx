'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import PersonRow from './PersonRow';
import { Avatar, VerifiedMark } from './ui';
import { isApprovedPsychologist, profileHref, setFollow, useFollowSuggestions, useMyGraph } from './social';
import toast from 'react-hot-toast';
import { confirmUnfollow } from './confirm';
import ScrollRow from './ScrollRow';

/** Sağ sütundaki "Kimi takip etmeli" paneli */
export function WhoToFollowPanel({ onNeedAuth, max = 3 }: { onNeedAuth?: () => void; max?: number }) {
  const { user } = useAuth();
  const me = user && !user.isAnonymous ? user.uid : null;
  const list = useFollowSuggestions(me, max);
  const { following, followers } = useMyGraph(me);
  if (!list.length) return null;
  return (
    <section className="fx-panel">
      <h2 className="fx-panel-title">Kimi takip etmeli</h2>
      {list.map(({ user: u, reason }) => (
        <PersonRow
          key={u.uid}
          user={u}
          note={reason}
          isFollowing={following.includes(u.uid)}
          followsYou={false}
          onNeedAuth={onNeedAuth}
        />
      ))}
      {me && followers.length === 0 && following.length === 0 && (
        <div className="fx-panel-foot">Takip ettikçe öneriler sana göre şekillenir.</div>
      )}
    </section>
  );
}

/** Akış içinde (mobil/tablet) yatay kaydırılan öneri kartları */
export function WhoToFollowStrip({ onNeedAuth }: { onNeedAuth?: () => void }) {
  const { user, userProfile } = useAuth();
  const me = user && !user.isAnonymous ? user.uid : null;
  const list = useFollowSuggestions(me, 8);
  const { following } = useMyGraph(me);
  if (list.length < 2) return null;
  return (
    <section className="fx-strip" aria-label="Kimi takip etmeli">
      <div className="fx-strip-head">Kimi takip etmeli</div>
      <ScrollRow className="fx-strip-track" label="Önerilen kişiler">
        {list.map(({ user: u, reason }) => {
          const isF = following.includes(u.uid);
          return (
            <Link key={u.uid} href={profileHref(u)} className="fx-strip-card">
              <Avatar src={u.photoURL} name={u.displayName || u.username} size={64} />
              <div className="fx-strip-name">
                <span>{u.displayName || u.username}</span>
                {isApprovedPsychologist(u) && <VerifiedMark iconOnly size={16} label={u.title} />}
              </div>
              <div className="fx-strip-handle">@{u.username}</div>
              <div className="fx-strip-reason">{reason}</div>
              <button
                type="button"
                className={`fx-btn fx-btn-primary fx-btn-sm ${isF ? 'fx-follow is-following' : ''}`}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user || user.isAnonymous) return onNeedAuth?.();
                  if (isF && !(await confirmUnfollow(u.username || 'kullanici'))) return;
                  try { await setFollow(user, userProfile, u.uid, !isF); } catch (err: any) { toast.error(err.message || 'İşlem yapılamadı'); }
                }}
              >
                {isF ? 'Takiptesin' : 'Takip et'}
              </button>
            </Link>
          );
        })}
      </ScrollRow>
    </section>
  );
}
