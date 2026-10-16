'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, VerifiedMark } from './ui';
import { ForumUser, isApprovedPsychologist, profileHref, setFollow } from './social';

type Props = {
  user: ForumUser;
  /** İsmin altında gösterilecek ikinci satır (ör. "Seni takip ediyor") */
  note?: string;
  showBio?: boolean;
  isFollowing: boolean;
  followsYou?: boolean;
  onNeedAuth?: () => void;
  compact?: boolean;
};

export default function PersonRow({ user: u, note, showBio, isFollowing, followsYou, onNeedAuth, compact }: Props) {
  const { user, userProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const isMe = user?.uid === u.uid;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user.isAnonymous) { onNeedAuth?.(); return; }
    setBusy(true);
    try {
      await setFollow(user, userProfile, u.uid, !isFollowing);
    } catch (err: any) {
      toast.error('İşlem yapılamadı: ' + (err.message || ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link href={profileHref(u)} className={`fx-panel-row fx-person ${compact ? 'is-compact' : ''}`}>
      <Avatar src={u.photoURL} name={u.displayName || u.username} size={40} />
      <div className="fx-person-text">
        <div className="fx-person-name">
          <span>{u.displayName || u.username}</span>
          {isApprovedPsychologist(u) && <VerifiedMark iconOnly size={16} label={u.title} />}
        </div>
        <div className="fx-person-handle">
          @{u.username || 'kullanici'}
          {followsYou && <span className="fx-follows-you">Seni takip ediyor</span>}
        </div>
        {note ? <div className="fx-person-note">{note}</div> : isApprovedPsychologist(u) ? <div className="fx-person-note fx-gold-note">{u.title || 'Psikolog'}</div> : null}
        {showBio && u.bio && <div className="fx-person-bio">{u.bio}</div>}
      </div>
      {!isMe && (
        <button
          type="button"
          className={`fx-btn fx-btn-primary fx-follow ${isFollowing ? 'is-following' : ''}`}
          onClick={toggle}
          disabled={busy}
          data-label-hover={isFollowing ? 'Takibi bırak' : undefined}
        >
          <span>{isFollowing ? 'Takiptesin' : followsYou ? 'Geri takip et' : 'Takip et'}</span>
        </button>
      )}
    </Link>
  );
}
