'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarPlus, NotebookPen, Pencil, ShieldAlert, Trash2, Video, MapPin } from 'lucide-react';
import ForumShell from '@/components/forum/ForumShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  MODE_LABEL, RISK_LABEL, STATUS_LABEL,
  deleteClient, deleteNote, deleteSession, fmtDate, fmtDay, fmtMoney, fmtTime, getClient, initials, isApprovedPsych,
  listClients, notesOf, sessionsOf, updateSession,
  type Client, type Note, type Session,
} from '@/components/practice/data';
import { ClientForm, NoteForm, SessionForm, StatusSelect } from '@/components/practice/Forms';

type Tab = 'sessions' | 'notes' | 'info';

export default function ClientPage() {
  const { user, userProfile } = useAuth();
  const params = useParams<{ id: string }>();
  const uid = user && !user.isAnonymous ? user.uid : null;
  const allowed = Boolean(uid && isApprovedPsych(userProfile));
  return (
    <ForumShell active="practice">
      {() => (!uid || !userProfile ? <div className="fx-end">Yükleniyor…</div>
        : !allowed ? <div className="fx-empty"><h2>Bu bölüm onaylı psikologlara açık</h2></div>
        : <ClientFile uid={uid} id={String(params.id)} />)}
    </ForumShell>
  );
}

function ClientFile({ uid, id }: { uid: string; id: string }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [all, setAll] = useState<Client[]>([]);
  const [tab, setTab] = useState<Tab>('sessions');
  const [now, setNow] = useState(0);
  const [modal, setModal] = useState<null | { kind: 'edit' } | { kind: 'session' } | { kind: 'note'; note?: Note; s?: Session }>(null);

  const load = useCallback(async () => {
    const [c, ss, ns, cs] = await Promise.all([getClient(uid, id), sessionsOf(uid, id), notesOf(uid, id), listClients(uid)]);
    setClient(c); setSessions(ss); setNotes(ns); setAll(cs); setNow(Date.now());
  }, [uid, id]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- dosya açılışta bir kez yüklenir
  useEffect(() => { load().catch(() => setClient(null)); }, [load]);

  const upcoming = useMemo(() => sessions.filter(s => s.start.toMillis() + s.duration * 60_000 > now && s.status === 'planned'), [sessions, now]);
  const past = useMemo(() => sessions.filter(s => !upcoming.includes(s)).reverse(), [sessions, upcoming]);
  const done = sessions.filter(s => s.status === 'done');
  const billed = sessions.filter(s => (s.status === 'done' || s.status === 'noshow') && s.fee);
  const paid = billed.filter(s => s.paid).reduce((a, s) => a + (s.fee || 0), 0);
  const owed = billed.filter(s => !s.paid).reduce((a, s) => a + (s.fee || 0), 0);
  const noteBySession = useMemo(() => Object.fromEntries(notes.filter(n => n.sessionId).map(n => [n.sessionId!, n])), [notes]);

  const mark = async (s: Session, patch: Partial<Session>) => {
    setSessions(prev => prev.map(x => (x.id === s.id ? { ...x, ...patch } : x)));
    try { await updateSession(uid, s.id, patch); } catch { toast.error('Güncellenemedi.'); load(); }
  };
  const removeSession = async (s: Session) => {
    if (!confirm('Bu seans silinsin mi?')) return;
    await deleteSession(uid, s.id).then(load).catch(() => toast.error('Silinemedi.'));
  };
  const removeClient = async () => {
    if (!client || !confirm(`${client.name} dosyası tüm seansları ve notlarıyla kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return;
    try { await deleteClient(uid, id); toast.success('Danışan dosyası silindi'); router.push('/forum/danisanlar'); } catch { toast.error('Silinemedi.'); }
  };

  if (client === undefined) return <div className="fx-end">Yükleniyor…</div>;
  if (client === null) return <div className="fx-empty"><h2>Danışan bulunamadı</h2><button type="button" className="fx-btn fx-btn-outline" onClick={() => router.push('/forum/danisanlar')}>Danışanlarıma dön</button></div>;
  const age = client.birthYear ? new Date().getFullYear() - client.birthYear : null;

  const sessionRow = (s: Session) => {
    const st = s.start.toDate();
    const note = noteBySession[s.id];
    return (
      <article key={s.id} className={`pr-slot is-${s.status}`}>
        <div className="pr-slot-time"><b>{st.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</b><span>{fmtTime(st)}</span></div>
        <div className="pr-slot-body">
          <div className="pr-slot-meta" style={{ marginTop: 0 }}>
            {s.mode === 'online' ? <Video size={13} /> : <MapPin size={13} />} {MODE_LABEL[s.mode]} · {s.duration} dk{s.fee ? ` · ${fmtMoney(s.fee)}` : ''}
            <StatusSelect status={s.status} onChange={v => mark(s, { status: v })} />
            {s.fee && s.status !== 'planned' && s.status !== 'cancelled' ? <button type="button" className={`pr-paid ${s.paid ? 'is-on' : ''}`} onClick={() => mark(s, { paid: !s.paid })}>{s.paid ? 'Ödendi' : 'Ödeme bekliyor'}</button> : null}
          </div>
          {note && <button type="button" className="pr-note-peek" onClick={() => setModal({ kind: 'note', note })}>{[note.discussed, note.observations, note.plan].find(Boolean)?.slice(0, 140)}</button>}
        </div>
        <div className="pr-slot-actions">
          {!note && <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => setModal({ kind: 'note', s })}><NotebookPen size={14} /> Not</button>}
          <button type="button" className="fx-icon-btn" aria-label="Seansı sil" onClick={() => removeSession(s)}><Trash2 size={16} /></button>
        </div>
      </article>
    );
  };

  return (
    <div className="pr">
      <button type="button" className="fx-cv-back" style={{ margin: '0 0 4px' }} onClick={() => router.push('/forum/danisanlar')}><ArrowLeft size={16} /> Danışanlarım</button>

      <section className="pr-file">
        <span className="pr-av pr-av-lg">{initials(client.name)}</span>
        <div className="pr-file-main">
          <h1>{client.name}</h1>
          <div className="pr-file-meta">
            <span className={`pr-chip is-${client.status}`}>{STATUS_LABEL[client.status]}</span>
            {age ? <span>{age} yaş</span> : null}
            {client.createdAt && <span>{fmtDate(client.createdAt.toDate())} tarihinden beri</span>}
          </div>
          {client.risk !== 'none' && (
            <div className={`pr-risk-box is-${client.risk}`}><ShieldAlert size={16} /> <b>{RISK_LABEL[client.risk]}</b>{client.riskNote ? ` · ${client.riskNote}` : ''}</div>
          )}
        </div>
        <div className="pr-file-actions">
          <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={() => setModal({ kind: 'session' })}><CalendarPlus size={15} /> Seans planla</button>
          <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => setModal({ kind: 'note' })}><NotebookPen size={15} /> Not ekle</button>
          <button type="button" className="fx-icon-btn fx-icon-outline" aria-label="Dosyayı düzenle" onClick={() => setModal({ kind: 'edit' })}><Pencil size={16} /></button>
        </div>
      </section>

      <div className="pr-stats">
        <div><b>{done.length}</b><span>Yapılan seans</span></div>
        <div><b>{upcoming.length}</b><span>Yaklaşan</span></div>
        <div><b>{fmtMoney(paid) || '0 ₺'}</b><span>Ödenen</span></div>
        <div className={owed ? 'is-owed' : ''}><b>{fmtMoney(owed) || '0 ₺'}</b><span>Bekleyen ödeme</span></div>
      </div>

      <div className="fx-tabs fx-tabs-pill" role="tablist">
        {([['sessions', 'Seanslar'], ['notes', `Notlar (${notes.length})`], ['info', 'Bilgiler']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`fx-tab ${tab === k ? 'is-active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div className="pr-agenda">
          <section className="pr-day">
            <h3>Yaklaşan <span>{upcoming.length}</span></h3>
            {upcoming.length ? upcoming.map(sessionRow) : <p className="pr-hint" style={{ padding: '0 4px' }}>Planlanmış seans yok.</p>}
          </section>
          <section className="pr-day">
            <h3>Geçmiş <span>{past.length}</span></h3>
            {past.length ? past.map(sessionRow) : <p className="pr-hint" style={{ padding: '0 4px' }}>Henüz geçmiş seans yok.</p>}
          </section>
        </div>
      )}

      {tab === 'notes' && (
        <div className="pr-notes">
          {notes.length === 0 ? (
            <div className="fx-empty"><h2>Henüz not yok</h2><p>Seans sonrası gözlemlerini, uyguladığın müdahaleyi ve bir sonraki seans planını buraya yaz.</p></div>
          ) : notes.map(n => (
            <article key={n.id} className="pr-note">
              <header>
                <b>{fmtDay(n.date.toDate()).replace(/^(Bugün|Yarın|Dün) · /, '$1, ')}</b>
                {n.mood ? <span className="pr-mood-chip">Ruh hali {n.mood}/10</span> : null}
                {n.risk && <span className="pr-risk is-high" title="Risk belirtisi">!</span>}
                <span style={{ flex: 1 }} />
                <button type="button" className="fx-icon-btn" aria-label="Notu düzenle" onClick={() => setModal({ kind: 'note', note: n })}><Pencil size={15} /></button>
                <button type="button" className="fx-icon-btn" aria-label="Notu sil" onClick={() => { if (confirm('Not silinsin mi?')) deleteNote(uid, n.id).then(load).catch(() => toast.error('Silinemedi.')); }}><Trash2 size={15} /></button>
              </header>
              {([['Gözlemler', n.observations], ['Konuşulanlar', n.discussed], ['Müdahale', n.intervention], ['Ödev', n.homework], ['Sonraki seans', n.plan]] as [string, string | undefined][])
                .filter(([, v]) => v).map(([k, v]) => <div key={k} className="pr-note-sec"><span>{k}</span><p>{v}</p></div>)}
            </article>
          ))}
        </div>
      )}

      {tab === 'info' && (
        <div className="pr-info">
          {([
            ['Başvuru nedeni', client.reason], ['Terapi hedefleri', client.goals], ['İlaç kullanımı', client.medication], ['Yönlendiren', client.referral],
            ['Telefon', client.phone], ['E-posta', client.email], ['Acil durumda ulaşılacak kişi', client.emergency],
            ['Seans düzeni', `${client.duration} dk · ${MODE_LABEL[client.mode]}${client.fee ? ` · ${fmtMoney(client.fee)}` : ''}`], [client.mode === 'online' ? 'Görüşme bağlantısı' : 'Yer', client.location],
          ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="pr-info-row"><span>{k}</span><p>{v}</p></div>
          ))}
          <button type="button" className="fx-btn fx-btn-outline fx-btn-sm pr-danger" onClick={removeClient}><Trash2 size={15} /> Danışan dosyasını sil</button>
        </div>
      )}

      {modal?.kind === 'edit' && <ClientForm uid={uid} client={client} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.kind === 'session' && <SessionForm uid={uid} clients={all} clientId={id} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.kind === 'note' && (
        <NoteForm uid={uid} clientId={id} note={modal.note} sessionId={modal.s?.id} sessionDate={modal.s?.start.toDate()}
          onClose={() => setModal(null)}
          onSaved={() => { const s = modal.s; setModal(null); if (s && s.status === 'planned') mark(s, { status: 'done' }); load(); }} />
      )}
    </div>
  );
}
