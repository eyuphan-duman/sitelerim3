'use client';

/**
 * Bir gönderiyi beğenenler ve yeniden paylaşanlar. Her yerden `openInteractions(postId, 'likes')` ile açılır;
 * pencereyi ForumShell içindeki <InteractionsHost /> çizer.
 */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useBlocks, useMyGraph, useUsersByIds } from './social';
import PersonRow from './PersonRow';

type Tab = 'likes' | 'reposts';
type Req = { postId: string; tab: Tab };
const EVENT = 'forum:interactions';

export function openInteractions(postId: string, tab: Tab) {
  if (typeof window === 'undefined' || !postId) return;
  window.dispatchEvent(new CustomEvent<Req>(EVENT, { detail: { postId, tab } }));
}

export function InteractionsHost() {
  const { user } = useAuth();
  const [req, setReq] = useState<Req | null>(null);
  const [post, setPost] = useState<Record<string, any> | null>(null);
  const graph = useMyGraph(user && !user.isAnonymous ? user.uid : null);
  const { hidden } = useBlocks(user && !user.isAnonymous ? user.uid : null);

  useEffect(() => {
    const on = (e: Event) => { setPost(null); setReq((e as CustomEvent<Req>).detail); };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  useEffect(() => {
    if (!req) return;
    getDoc(doc(db, 'forum', req.postId)).then(s => setPost(s.exists() ? s.data() : {})).catch(() => setPost({}));
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setReq(null); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [req]);

  const ids = req && post
    ? Object.entries((req.tab === 'likes' ? post.reactionsData : post.repostsData) || {})
        .filter(([, v]) => (req.tab === 'likes' ? v === 'like' || v === 'heart' : Boolean(v)))
        .map(([uid]) => uid)
        .filter(uid => !hidden.has(uid))
    : [];
  const people = useUsersByIds(ids);

  if (!req) return null;
  const close = () => setReq(null);

  return (
    <div className="fx-modal-scrim" onClick={close}>
      <div className="fx-modal fx-people-modal" role="dialog" aria-modal="true" aria-label="Gönderi etkileşimleri" onClick={e => e.stopPropagation()}>
        <div className="fx-modal-head">
          <button type="button" className="fx-icon-btn" onClick={close} aria-label="Kapat"><X size={20} /></button>
          <div className="fx-modal-title">Gönderi etkileşimleri</div>
        </div>
        <div className="fx-tabs fx-tabs-pill" role="tablist">
          {([['likes', 'Beğenenler'], ['reposts', 'Yeniden paylaşanlar']] as [Tab, string][]).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={req.tab === k} className={`fx-tab ${req.tab === k ? 'is-active' : ''}`} onClick={() => setReq({ ...req, tab: k })}>
              {label}
            </button>
          ))}
        </div>
        <div className="fx-people-list">
          {!post ? <div className="fx-end">Yükleniyor…</div>
            : people.length === 0 ? <div className="fx-end">{req.tab === 'likes' ? 'Henüz beğenen yok.' : 'Henüz yeniden paylaşan yok.'}</div>
            : people.map(u => (
              <div key={u.uid} onClick={close}>
                <PersonRow user={u} isFollowing={graph.following.includes(u.uid)} followsYou={graph.followers.includes(u.uid)} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
