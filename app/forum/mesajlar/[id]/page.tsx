'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { addDoc, collection, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Ban, Flag, Info, Lock, MoreHorizontal, SendHorizontal, Trash2, User } from 'lucide-react';
import { db } from '@/lib/firebase';
import { requestDmPush } from '@/lib/notify';
import ForumShell from '@/components/forum/ForumShell';
import { Avatar, ReportDialog, VerifiedMark } from '@/components/forum/ui';
import { blockUser, isApprovedPsychologist, profileHref, unblockUser, useBlocks, type ForumUser } from '@/components/forum/social';
import { confirmBlock, confirmUnblock } from '@/components/forum/confirm';
import { renderTextWithMentions } from '@/components/forum/ThreadView';
import { useAuth } from '@/contexts/AuthContext';
import DmRulesGate from '@/components/dm/DmRulesGate';
import {
  DmError, MAX_LEN, clock, dayLabel, deleteMessage, markRead, otherOf, sendMessage, watchMessages, watchThread, writeCheck,
  type DmMsg, type DmThread,
} from '@/components/dm/data';

export default function ConversationPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const uid = user && !user.isAnonymous ? user.uid : null;
  const tid = String(params.id || '');
  return (
    <ForumShell active="messages" hideFab>
      {(shell) => (!uid ? (
        <div className="fx-empty"><h2>Mesajlarını görmek için giriş yap</h2><button type="button" className="fx-btn fx-btn-primary" onClick={shell.openAuth}>Giriş yap</button></div>
      ) : !tid.split('_').includes(uid) || tid.split('_').length !== 2 ? (
        <div className="fx-empty"><h2>Sohbet bulunamadı</h2><Link href="/forum/mesajlar" className="fx-btn fx-btn-outline">Mesajlara dön</Link></div>
      ) : (
        <DmRulesGate uid={uid}><Conversation uid={uid} tid={tid} /></DmRulesGate>
      ))}
    </ForumShell>
  );
}

function Conversation({ uid, tid }: { uid: string; tid: string }) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const otherUid = otherOf(tid, uid);
  const [other, setOther] = useState<ForumUser | null | undefined>(undefined);
  const [thread, setThread] = useState<DmThread | null | undefined>(undefined);
  const [msgs, setMsgs] = useState<DmMsg[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState<DmMsg | null>(null);
  const [reason, setReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const blocks = useBlocks(uid);
  const endRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const firstScroll = useRef(true);

  useEffect(() => onSnapshot(doc(db, 'users', otherUid), s => setOther(s.exists() ? ({ ...(s.data() as ForumUser), uid: s.id }) : null), () => setOther(null)), [otherUid]);
  useEffect(() => watchThread(tid, setThread), [tid]);
  useEffect(() => watchMessages(tid, setMsgs), [tid]);

  // Sohbet açıkken gelen mesajlar okundu sayılır
  const myUnread = thread?.unread?.[uid] || 0;
  useEffect(() => {
    if (!myUnread) return;
    const run = () => { if (document.visibilityState === 'visible') markRead(tid, uid); };
    run();
    document.addEventListener('visibilitychange', run);
    return () => document.removeEventListener('visibilitychange', run);
  }, [myUnread, tid, uid]);

  // Yeni mesajda en alta kaydır (ilk açılışta anında)
  useLayoutEffect(() => {
    if (!msgs) return;
    endRef.current?.scrollIntoView({ block: 'end', behavior: firstScroll.current ? 'auto' : 'smooth' });
    firstScroll.current = false;
  }, [msgs]);

  const groups = useMemo(() => {
    const out: { day: string; items: DmMsg[] }[] = [];
    (msgs || []).forEach(m => {
      const d = dayLabel(m.createdAt ? m.createdAt.toDate() : new Date());
      if (!out.length || out[out.length - 1].day !== d) out.push({ day: d, items: [] });
      out[out.length - 1].items.push(m);
    });
    return out;
  }, [msgs]);

  if (other === undefined || thread === undefined) return <div className="fx-end">Yükleniyor…</div>;
  if (other === null) return <div className="fx-empty"><h2>Bu hesap bulunamadı</h2><Link href="/forum/mesajlar" className="fx-btn fx-btn-outline">Mesajlara dön</Link></div>;

  const name = other.displayName || other.username || 'Kullanıcı';
  const handle = other.username || '';
  const iBlocked = blocks.blocked.has(otherUid);
  const blockedMe = blocks.blockedBy.has(otherUid);
  const reasonNo = iBlocked ? 'Bu kişiyi engelledin. Mesaj göndermek için engeli kaldır.'
    : blockedMe ? 'Bu kişiye mesaj gönderemezsin.'
    : writeCheck({ ...(userProfile || {}), uid }, other, thread);

  const send = async () => {
    if (!text.trim() || sending || reasonNo) return;
    setSending(true);
    try {
      const { mid } = await sendMessage(uid, otherUid, text, Boolean(thread));
      setText('');
      requestDmPush(tid, mid);
      boxRef.current?.focus();
    } catch (e) {
      toast.error(e instanceof DmError ? e.message : 'Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  };

  const toggleBlock = async () => {
    setMenu(false);
    if (iBlocked) {
      if (!(await confirmUnblock(handle))) return;
      unblockUser(uid, otherUid).then(() => toast.success('Engel kaldırıldı')).catch(() => toast.error('İşlem yapılamadı.'));
    } else {
      if (!(await confirmBlock(handle))) return;
      blockUser(uid, otherUid).then(() => toast.success(`@${handle} engellendi`)).catch(() => toast.error('Engellenemedi.'));
    }
  };

  // Şikayet: yalnızca şikayet edilen mesaj, şikayet edenin onayıyla yöneticilere iletilir
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !reason.trim()) return;
    setReporting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        type: 'dm',
        postId: '',
        postBody: `[Özel mesaj] ${report.text}`.slice(0, 2000),
        postAuthorUid: otherUid,
        postAuthorName: name,
        postAuthorUsername: handle,
        reportedByUid: uid,
        reason: reason.trim(),
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      toast.success('Şikayetin yöneticilere iletildi.');
      setReport(null);
      setReason('');
    } catch {
      toast.error('Şikayet gönderilemedi.');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="dm">
      <div className="fx-thead dm-head">
        <button type="button" className="fx-icon-btn" onClick={() => router.push('/forum/mesajlar')} aria-label="Mesajlara dön" style={{ color: 'var(--fx-ink)' }}><ArrowLeft size={20} /></button>
        <Link href={profileHref(other)} className="dm-head-who">
          <Avatar src={other.photoURL} name={name} size={36} />
          <span>
            <span className="dm-row-top"><b>{name}</b>{isApprovedPsychologist(other) && <VerifiedMark iconOnly size={15} />}</span>
            {handle && <small>@{handle}</small>}
          </span>
        </Link>
        <div className="fx-menu-wrap">
          <button type="button" className="fx-icon-btn" aria-label="Sohbet seçenekleri" aria-expanded={menu} onClick={() => setMenu(v => !v)} style={{ color: 'var(--fx-ink)' }}><MoreHorizontal size={20} /></button>
          {menu && (
            <>
              <div className="fx-menu-backdrop" onClick={() => setMenu(false)} />
              <div className="fx-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { setMenu(false); router.push(profileHref(other)); }}><User size={17} /> Profili gör</button>
                <button type="button" role="menuitem" className={iBlocked ? '' : 'is-danger'} onClick={toggleBlock}><Ban size={17} /> {iBlocked ? 'Engeli kaldır' : `@${handle} adlı kişiyi engelle`}</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="dm-thread">
        <div className="dm-intro">
          <Avatar src={other.photoURL} name={name} size={64} />
          <b>{name}</b>
          {handle && <span>@{handle}{other.title && isApprovedPsychologist(other) ? ` · ${other.title}` : ''}</span>}
          <p><Lock size={13} /> Bu sohbeti yalnızca sen ve {name} görebilir.</p>
          {!thread && !reasonNo && <p className="dm-note"><Info size={14} /> Özel mesajlaşma terapi ya da acil destek hizmeti değildir. Acil bir durumda 112’yi ara.</p>}
        </div>

        {msgs === null ? <div className="fx-end">Yükleniyor…</div> : groups.map(g => (
          <section key={g.day} className="dm-day">
            <h4><span>{g.day}</span></h4>
            {g.items.map((m, i) => {
              const mine = m.from === uid;
              const nextSame = g.items[i + 1]?.from === m.from;
              return (
                <div key={m.id} className={`dm-msg ${mine ? 'is-mine' : ''} ${nextSame ? 'is-grouped' : ''}`}>
                  <div className="dm-bubble">
                    <p>{renderTextWithMentions(m.text)}</p>
                    <time>{m.createdAt ? clock(m.createdAt.toDate()) : '…'}</time>
                  </div>
                  <div className="dm-msg-actions">
                    {mine ? (
                      <button type="button" aria-label="Mesajı sil" title="Mesajı sil" onClick={() => { if (confirm('Bu mesaj iki taraf için de silinsin mi?')) deleteMessage(tid, m.id).catch(() => toast.error('Silinemedi.')); }}><Trash2 size={15} /></button>
                    ) : (
                      <button type="button" aria-label="Mesajı şikayet et" title="Mesajı şikayet et" onClick={() => setReport(m)}><Flag size={15} /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
        <div ref={endRef} />
      </div>

      <div className="dm-dock">
        {reasonNo ? (
          <p className="dm-blocked">{reasonNo}</p>
        ) : (
          <form className="dm-composer" onSubmit={e => { e.preventDefault(); send(); }}>
            <textarea
              ref={boxRef}
              rows={1}
              value={text}
              maxLength={MAX_LEN}
              placeholder="Mesaj yaz"
              aria-label="Mesaj yaz"
              onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`; }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); send(); } }}
            />
            <button type="submit" className="dm-send" disabled={!text.trim() || sending} aria-label="Gönder"><SendHorizontal size={19} /></button>
          </form>
        )}
      </div>

      {report && (
        <ReportDialog title="Mesajı şikayet et" note="Şikayet ettiğin bu mesaj, incelenmesi için yöneticilere iletilir; sohbetin geri kalanı iletilmez. Neyin kurallara aykırı olduğunu kısaca yaz." reason={reason} setReason={setReason} submitting={reporting}
          onClose={() => { setReport(null); setReason(''); }} onSubmit={submitReport} />
      )}
    </div>
  );
}
