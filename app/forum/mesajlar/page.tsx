'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Search, SquarePen, X } from 'lucide-react';
import ForumShell from '@/components/forum/ForumShell';
import { Avatar, VerifiedMark } from '@/components/forum/ui';
import { isApprovedPsychologist, isVisibleUser, useBlocks, useUsers, useUsersByIds, type ForumUser } from '@/components/forum/social';
import { useAuth } from '@/contexts/AuthContext';
import DmRulesGate from '@/components/dm/DmRulesGate';
import { otherOf, shortTime, threadId, watchThreads, type DmThread } from '@/components/dm/data';

/** Mesajlar: sohbet listesi */
export default function MessagesPage() {
  const { user } = useAuth();
  const uid = user && !user.isAnonymous ? user.uid : null;
  const [picker, setPicker] = useState(false);
  return (
    <ForumShell active="messages">
      {(shell) => (
        <>
          <div className="fx-head">
            <div className="fx-thead fx-thead-flat">
              <h2 style={{ flex: 1 }}>Mesajlar</h2>
              {uid && (
                <button type="button" className="fx-icon-btn" aria-label="Yeni mesaj" title="Yeni mesaj" onClick={() => setPicker(true)} style={{ color: 'var(--fx-ink)' }}>
                  <SquarePen size={20} />
                </button>
              )}
            </div>
          </div>
          {!uid ? (
            <div className="fx-empty">
              <h2>Mesajlarını görmek için giriş yap</h2>
              <p>Psikolog rozeti olan kişilere özel mesaj gönderebilirsin.</p>
              <button type="button" className="fx-btn fx-btn-primary" onClick={shell.openAuth}>Giriş yap</button>
            </div>
          ) : (
            <DmRulesGate uid={uid}>
              <Inbox uid={uid} onNew={() => setPicker(true)} />
              {picker && <NewMessage uid={uid} onClose={() => setPicker(false)} />}
            </DmRulesGate>
          )}
        </>
      )}
    </ForumShell>
  );
}

function Inbox({ uid, onNew }: { uid: string; onNew: () => void }) {
  const [threads, setThreads] = useState<DmThread[] | null>(null);
  useEffect(() => watchThreads(uid, setThreads), [uid]);
  const others = useMemo(() => (threads || []).map(t => otherOf(t.id, uid)), [threads, uid]);
  const people = useUsersByIds(others);
  const byUid = useMemo(() => Object.fromEntries(people.map(p => [p.uid, p])), [people]);

  if (!threads) return <div className="fx-end">Yükleniyor…</div>;
  if (!threads.length) {
    return (
      <div className="fx-empty">
        <h2>Henüz mesajın yok</h2>
        <p>Psikolog rozeti olan kişilere özel mesaj gönderebilirsin. Yazdığın mesajları yalnızca sen ve karşı taraf görür.</p>
        <button type="button" className="fx-btn fx-btn-primary" onClick={onNew}>Yeni mesaj</button>
      </div>
    );
  }
  return (
    <div className="dm-list">
      <p className="dm-private"><Lock size={13} /> Mesajlarını yalnızca sen ve yazıştığın kişi okuyabilir.</p>
      {threads.map(t => {
        const other = otherOf(t.id, uid);
        const p = byUid[other];
        const unread = (t.unread?.[uid] || 0) > 0 && t.lastFrom !== uid;
        return (
          <Link key={t.id} href={`/forum/mesajlar/${t.id}`} className={`dm-row ${unread ? 'is-unread' : ''}`}>
            <Avatar src={p?.photoURL} name={p?.displayName || p?.username} size={48} />
            <div className="dm-row-body">
              <div className="dm-row-top">
                <b>{p?.displayName || p?.username || 'Kullanıcı'}</b>
                {isApprovedPsychologist(p) && <VerifiedMark iconOnly size={15} />}
                <span className="dm-row-handle">{p?.username ? `@${p.username}` : ''}</span>
                <span className="dm-row-time">{shortTime(t.lastAt)}</span>
              </div>
              <div className="dm-row-last">{t.lastFrom === uid ? 'Sen: ' : ''}{t.lastText}</div>
            </div>
            {unread && <span className="dm-row-dot" aria-label={`${t.unread[uid]} okunmamış mesaj`}>{t.unread[uid] > 9 ? '9+' : t.unread[uid]}</span>}
          </Link>
        );
      })}
    </div>
  );
}

/** Yeni mesaj: rozetli psikologlar arasından kişi seçilir */
function NewMessage({ uid, onClose }: { uid: string; onClose: () => void }) {
  const router = useRouter();
  const users = useUsers();
  const blocks = useBlocks(uid);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const k = q.trim().toLocaleLowerCase('tr-TR');
    return Object.values(users)
      .filter((u: ForumUser) => u.uid !== uid && isApprovedPsychologist(u) && isVisibleUser(u) && !blocks.hidden.has(u.uid))
      .filter(u => !k || `${u.displayName || ''} ${u.username || ''} ${u.title || ''}`.toLocaleLowerCase('tr-TR').includes(k))
      .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'tr'));
  }, [users, uid, q, blocks.hidden]);

  return (
    <div className="fx-modal-scrim" onClick={onClose}>
      <div className="fx-modal" role="dialog" aria-modal="true" aria-label="Yeni mesaj" onClick={e => e.stopPropagation()}>
        <div className="fx-modal-head">
          <button type="button" className="fx-icon-btn" onClick={onClose} aria-label="Kapat" style={{ color: 'var(--fx-ink)' }}><X size={20} /></button>
          <div className="fx-modal-title">Yeni mesaj</div>
        </div>
        <div className="dm-pick">
          <label className="fx-search"><Search size={17} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Psikolog ara" aria-label="Psikolog ara" /></label>
          <p className="pr-hint">Özel mesajı yalnızca psikolog rozeti olan kişilere gönderebilirsin.</p>
          <div className="dm-pick-list">
            {list.length === 0 ? <div className="fx-end">{Object.keys(users).length ? 'Aramana uyan psikolog yok.' : 'Yükleniyor…'}</div> : list.map(u => (
              <button key={u.uid} type="button" className="dm-pick-row" onClick={() => { onClose(); router.push(`/forum/mesajlar/${threadId(uid, u.uid)}`); }}>
                <Avatar src={u.photoURL} name={u.displayName || u.username} size={42} />
                <span className="dm-pick-text">
                  <span className="dm-row-top"><b>{u.displayName || u.username}</b><VerifiedMark iconOnly size={14} /></span>
                  <small>@{u.username}{u.title ? ` · ${u.title}` : ''}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
