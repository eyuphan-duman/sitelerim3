'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PersonRow from './PersonRow';
import { isVisibleUser, useMyGraph, useUserGraph, useUsersByIds } from './social';

export type FollowListMode = 'followers' | 'following' | 'known';

type Props = {
  profile: { uid: string; displayName?: string; username?: string };
  mode: FollowListMode;
  onMode: (m: FollowListMode) => void;
  onBack: () => void;
  onNeedAuth: () => void;
};

export default function FollowList({ profile, mode, onMode, onBack, onNeedAuth }: Props) {
  const { user } = useAuth();
  const me = user && !user.isAnonymous ? user.uid : null;
  const { followers, following } = useUserGraph(profile.uid);
  const mine = useMyGraph(me);
  const isOwn = me === profile.uid;

  const known = me && !isOwn ? followers.filter(id => mine.following.includes(id)) : [];
  const ids = mode === 'followers' ? followers : mode === 'following' ? following : known;
  const people = useUsersByIds(ids).filter(isVisibleUser);

  const tabs: { key: FollowListMode; label: string }[] = [
    ...(known.length ? [{ key: 'known' as const, label: 'Tanıdığın takipçiler' }] : []),
    { key: 'followers', label: 'Takipçiler' },
    { key: 'following', label: 'Takip edilenler' },
  ];

  const empty = {
    followers: isOwn ? ['Henüz takipçin yok', 'Biri seni takip ettiğinde burada görünecek.'] : ['Henüz takipçisi yok', 'Bu hesabı takip edenler burada görünür.'],
    following: isOwn ? ['Henüz kimseyi takip etmiyorsun', 'İlgini çeken kişileri takip et; paylaşımları akışında görünsün.'] : ['Henüz kimseyi takip etmiyor', 'Bu hesabın takip ettikleri burada görünür.'],
    known: ['Ortak tanıdık yok', 'Takip ettiğin kişilerden bu hesabı takip eden yok.'],
  }[mode];

  return (
    <div>
      <div className="fx-thead fx-thead-2">
        <button type="button" className="fx-icon-btn" onClick={onBack} aria-label="Profile dön" style={{ color: 'var(--fx-ink)' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h2>{profile.displayName || profile.username}</h2>
          <div className="fx-thead-sub">@{profile.username}</div>
        </div>
      </div>
      <div className="fx-tabs fx-tabs-line" role="tablist">
        {tabs.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={mode === t.key} className={`fx-tab ${mode === t.key ? 'is-active' : ''}`} onClick={() => onMode(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {people.length === 0 ? (
        <div className="fx-empty">
          <h2>{empty[0]}</h2>
          <p>{empty[1]}</p>
        </div>
      ) : (
        people.map(u => (
          <PersonRow
            key={u.uid}
            user={u}
            showBio
            isFollowing={mine.following.includes(u.uid)}
            followsYou={Boolean(me) && mine.followers.includes(u.uid)}
            onNeedAuth={onNeedAuth}
          />
        ))
      )}
    </div>
  );
}
