'use client';

/** Ayarlar › Engellenen hesaplar */
import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Avatar } from './ui';
import { profileHref, unblockUser, useBlocks, useUsersByIds } from './social';
import { confirmUnblock } from './confirm';

export default function BlockedList({ uid }: { uid: string }) {
  const { blockedList } = useBlocks(uid);
  const people = useUsersByIds(blockedList);

  if (!blockedList.length) {
    return (
      <div className="fx-set-intro">
        <p>Engellediğin kimse yok. Bir kişiyi profilindeki ya da gönderisindeki <b>⋯</b> menüsünden engelleyebilirsin.</p>
      </div>
    );
  }

  return (
    <section className="fx-set-group">
      <p className="fx-set-note">Engellediğin kişiler seni takip edemez, gönderilerini göremez ve sana yanıt yazamaz. Onların gönderileri de sana gösterilmez.</p>
      {people.map(u => {
        const h = u.username || 'kullanici';
        return (
          <div key={u.uid} className="fx-set-row fx-blocked-row">
            <Link href={profileHref(u)} className="fx-blocked-who">
              <Avatar src={u.photoURL} name={u.displayName || h} size={40} />
              <span className="fx-set-text"><b>{u.displayName || h}</b><small>@{h}</small></span>
            </Link>
            <button
              type="button"
              className="fx-btn fx-btn-outline fx-btn-sm"
              onClick={async () => {
                if (!(await confirmUnblock(h))) return;
                try { await unblockUser(uid, u.uid); toast.success(`@${h} adlı kişinin engeli kaldırıldı`); }
                catch { toast.error('İşlem yapılamadı.'); }
              }}
            >
              Engeli kaldır
            </button>
          </div>
        );
      })}
    </section>
  );
}
