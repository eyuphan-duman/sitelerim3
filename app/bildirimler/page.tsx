'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Repeat2, AtSign, UserPlus, Settings, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ForumShell from '@/components/forum/ForumShell';
import { Avatar } from '@/components/forum/ui';
import { formatTimeAgo } from '@/components/forum/ThreadView';

interface Notification {
  id: string;
  type: 'comment' | 'reaction' | 'mention' | 'repost' | 'follow';
  fromUid?: string;
  fromUser: string;
  fromUsername: string;
  fromPhotoURL?: string;
  postId: string;
  postTitle?: string;
  message: string;
  read: boolean;
  createdAt: any;
}

type Filter = 'all' | 'mention' | 'comment' | 'reaction' | 'repost' | 'follow';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'mention', label: 'Bahsetmeler' },
  { key: 'comment', label: 'Yanıtlar' },
  { key: 'reaction', label: 'Beğeniler' },
  { key: 'repost', label: 'Yeniden paylaşımlar' },
  { key: 'follow', label: 'Takipler' },
];

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  reaction: { icon: <Heart size={22} fill="currentColor" strokeWidth={0} />, color: 'var(--fx-like)' },
  repost: { icon: <Repeat2 size={24} strokeWidth={2.2} />, color: 'var(--fx-repost)' },
  comment: { icon: <MessageCircle size={22} fill="currentColor" strokeWidth={0} />, color: 'var(--fx-link)' },
  mention: { icon: <AtSign size={22} strokeWidth={2.4} />, color: 'var(--fx-link)' },
  follow: { icon: <UserPlus size={22} strokeWidth={2.2} />, color: 'var(--fx-gold)' },
};

const time = (n: Notification) => (n.createdAt?.toDate ? n.createdAt.toDate().getTime() : n.createdAt?.seconds ? n.createdAt.seconds * 1000 : 0);

export default function BildirimlerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!user || user.isAnonymous) { setLoading(false); return; }
    // Yalnızca toUid ile sorgula (bileşik dizin gerektirmesin), sıralama bellekte
    return onSnapshot(
      query(collection(db, 'notifications'), where('toUid', '==', user.uid)),
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        list.sort((a, b) => time(b) - time(a));
        setNotifications(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [user]);

  const go = (href: string) => {
    try { sessionStorage.setItem('forum_skip_splash', 'true'); sessionStorage.setItem('forum_splash_shown', '1'); } catch {}
    router.push(href);
  };

  const markRead = (id: string) => updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit().catch(() => {});
  };

  const open = (n: Notification) => {
    if (!n.read) markRead(n.id);
    if (n.type === 'follow' || !n.postId) {
      go(`/forum/profil/${encodeURIComponent(n.fromUsername || n.fromUid || '')}`);
      return;
    }
    go(`/forum?thread=${encodeURIComponent(n.postId)}&fromUser=${encodeURIComponent(n.fromUsername || n.fromUser)}&notifType=${encodeURIComponent(n.type)}`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const list = notifications.filter(n => filter === 'all' || n.type === filter);
  const isMember = Boolean(user && !user.isAnonymous);

  return (
    <ForumShell active="notif">
      {(shell) => (
        <>
          <div className="fx-head">
            <div className="fx-thead fx-thead-flat">
              <h2 style={{ flex: 1 }}>Bildirimler</h2>
              {unreadCount > 0 && (
                <button type="button" className="fx-icon-btn" onClick={markAllRead} title="Tümünü okundu say" aria-label="Tümünü okundu say" style={{ color: 'var(--fx-ink)' }}>
                  <CheckCheck size={20} />
                </button>
              )}
              {isMember && (
                <button type="button" className="fx-icon-btn" onClick={() => go(`${shell.myProfileHref}?settings=open`)} title="Ayarlar" aria-label="Ayarlar" style={{ color: 'var(--fx-ink)' }}>
                  <Settings size={19} />
                </button>
              )}
            </div>
            {isMember && (
              <div className="fx-tabs fx-tabs-scroll" role="tablist" style={{ borderBottom: 0 }}>
                {FILTERS.map(f => (
                  <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} className={`fx-tab ${filter === f.key ? 'is-active' : ''}`} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isMember ? (
            <div className="fx-empty">
              <h2>Bildirimlerini görmek için giriş yap</h2>
              <p>Biri seni takip ettiğinde, gönderini beğendiğinde ya da yanıtladığında burada görürsün.</p>
              <button type="button" className="fx-btn fx-btn-primary" onClick={shell.openAuth}>Giriş yap</button>
            </div>
          ) : loading ? (
            <div className="fx-end">Bildirimler yükleniyor…</div>
          ) : list.length === 0 ? (
            <div className="fx-empty">
              <h2>{filter === 'all' ? 'Henüz bildirim yok' : 'Bu türde bildirim yok'}</h2>
              <p>
                {filter === 'mention' ? 'Biri gönderisinde @' + shell.myUsername + ' yazdığında burada görünür.'
                  : filter === 'follow' ? 'Seni takip etmeye başlayanlar burada listelenir.'
                  : 'Gönderilerinle etkileşime geçildiğinde burada göreceksin.'}
              </p>
              {filter === 'all' && <button type="button" className="fx-btn fx-btn-primary" onClick={() => go('/forum?compose=open')}>Gönderi paylaş</button>}
            </div>
          ) : (
            list.map(n => {
              const t = TYPE_ICON[n.type] || TYPE_ICON.comment;
              const quote = n.type === 'comment' || n.type === 'mention';
              return (
                <article key={n.id} className={`fx-notif ${n.read ? '' : 'is-unread'}`} onClick={() => open(n)}>
                  <span className="fx-notif-ic" style={{ color: t.color }}>{t.icon}</span>
                  <div className="fx-notif-body">
                    <div className="fx-notif-top">
                      <Link href={`/forum/profil/${encodeURIComponent(n.fromUsername || n.fromUid || '')}`} onClick={e => e.stopPropagation()} aria-label={n.fromUser}>
                        <Avatar src={n.fromPhotoURL} name={n.fromUser} size={32} />
                      </Link>
                      <time className="fx-time">{formatTimeAgo(n.createdAt)}</time>
                    </div>
                    <p className="fx-notif-text">
                      <Link href={`/forum/profil/${encodeURIComponent(n.fromUsername || n.fromUid || '')}`} onClick={e => e.stopPropagation()} className="fx-name">{n.fromUser}</Link>{' '}
                      {n.message}
                    </p>
                    {n.postTitle && <p className={quote ? 'fx-notif-quote' : 'fx-notif-excerpt'}>{n.postTitle}</p>}
                  </div>
                </article>
              );
            })
          )}
        </>
      )}
    </ForumShell>
  );
}
