'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CalendarPlus, Check, Clock, Lock, NotebookPen, Plus, Search, ShieldAlert, UserPlus, Video, MapPin } from 'lucide-react';
import ForumShell from '@/components/forum/ForumShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  DEFAULT_SETTINGS, MODE_LABEL, STATUS_LABEL,
  addDays, fmtDay, fmtMoney, fmtTime, initials, isApprovedPsych, listClients, loadSettings, relTime,
  saveSettings, sessionsBetween, startOfDay, updateSession,
  type Client, type ClientStatus, type Session, type Settings,
} from '@/components/practice/data';
import { ChipRow, ClientForm, NoteForm, SessionForm, StatusSelect } from '@/components/practice/Forms';

type Tab = 'agenda' | 'clients' | 'reminders';

/** Danışanlarım: onaylı psikologların ajanda, danışan dosyası ve seans notu çalışma alanı */
export default function PracticePage() {
  const { user, userProfile } = useAuth();
  const uid = user && !user.isAnonymous ? user.uid : null;
  const allowed = Boolean(uid && isApprovedPsych(userProfile));

  return (
    <ForumShell active="practice">
      {(shell) => (
        <>
          <div className="fx-head">
            <div className="fx-thead fx-thead-flat">
              <h2 style={{ flex: 1 }}>Danışanlarım</h2>
              <span className="pr-private"><Lock size={13} /> Yalnızca sen görürsün</span>
            </div>
          </div>
          {!uid ? (
            <div className="fx-empty"><h2>Giriş yapmalısın</h2><p>Danışanlarım bölümü onaylı psikologlara açıktır.</p><button type="button" className="fx-btn fx-btn-primary" onClick={shell.openAuth}>Giriş yap</button></div>
          ) : !userProfile ? (
            <div className="fx-end">Yükleniyor…</div>
          ) : !allowed ? (
            <div className="fx-empty"><h2>Bu bölüm onaylı psikologlara açık</h2><p>Psikolog başvurun onaylandığında danışan ajandanı ve seans notlarını buradan tutabilirsin.</p></div>
          ) : (
            <Workspace uid={uid!} />
          )}
        </>
      )}
    </ForumShell>
  );
}

function Workspace({ uid }: { uid: string }) {
  const [tab, setTab] = useState<Tab>('agenda');
  const [clients, setClients] = useState<Client[] | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [now, setNow] = useState(0);
  const [modal, setModal] = useState<null | { kind: 'client' } | { kind: 'session' } | { kind: 'note'; s: Session }>(null);

  const load = useCallback(async () => {
    const from = addDays(startOfDay(), -1);
    const [cs, ss, st] = await Promise.all([listClients(uid), sessionsBetween(uid, from, addDays(startOfDay(), 60)), loadSettings(uid)]);
    setClients(cs);
    setSessions(ss);
    setSettings(st);
    setNow(Date.now());
  }, [uid]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- çalışma alanı açılışta bir kez yüklenir
  useEffect(() => { load().catch(() => setClients([])); }, [load]);

  const byClient = useMemo(() => Object.fromEntries((clients || []).map(c => [c.id, c])), [clients]);
  const upcoming = sessions.filter(s => s.status === 'planned' && s.start.toMillis() + s.duration * 60_000 > now);
  const next = upcoming[0];

  const mark = async (s: Session, patch: Partial<Session>) => {
    setSessions(prev => prev.map(x => (x.id === s.id ? { ...x, ...patch } : x)));
    try { await updateSession(uid, s.id, patch); } catch { toast.error('Güncellenemedi.'); load(); }
  };

  if (!clients) return <div className="fx-end">Yükleniyor…</div>;

  return (
    <div className="pr">
      {!settings.kvkkAck && (
        <section className="pr-kvkk">
          <ShieldAlert size={20} />
          <div>
            <b>Danışan bilgileri özel nitelikli kişisel veridir.</b>
            <p>Buraya kaydettiğin her şeyi yalnızca sen görebilirsin; site yöneticileri dahil kimse erişemez. Kimlik ve sağlık bilgilerini danışanının açık rızasıyla kaydet. İstersen ad yerine bir kod kullanabilirsin.</p>
          </div>
          <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => { setSettings(s => ({ ...s, kvkkAck: true })); saveSettings(uid, { kvkkAck: true }).catch(() => {}); }}>Anladım</button>
        </section>
      )}

      <section className="pr-next">
        {next ? (
          <>
            <div className="pr-next-when"><Clock size={16} /> Sıradaki seans · {relTime(next.start.toDate(), now)}</div>
            <div className="pr-next-main">
              <span className="pr-av">{initials(next.clientName)}</span>
              <div>
                <Link href={`/forum/danisanlar/${next.clientId}`} className="pr-next-name">{next.clientName}</Link>
                <div className="pr-next-meta">{fmtDay(next.start.toDate())} · {fmtTime(next.start.toDate())} · {next.duration} dk · {MODE_LABEL[next.mode]}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="pr-next-empty">Planlanmış yaklaşan seans yok.</div>
        )}
        <div className="pr-next-actions">
          <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={() => setModal({ kind: 'session' })}><CalendarPlus size={15} /> Seans planla</button>
          <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => setModal({ kind: 'client' })}><UserPlus size={15} /> Yeni danışan</button>
        </div>
      </section>

      <div className="fx-tabs fx-tabs-pill" role="tablist">
        {([['agenda', 'Ajanda'], ['clients', `Danışanlar (${clients.length})`], ['reminders', 'Hatırlatmalar']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`fx-tab ${tab === k ? 'is-active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'agenda' && <Agenda sessions={sessions} clients={byClient} now={now} onMark={mark} onNote={s => setModal({ kind: 'note', s })} />}
      {tab === 'clients' && <ClientList clients={clients} sessions={upcoming} onNew={() => setModal({ kind: 'client' })} />}
      {tab === 'reminders' && <Reminders uid={uid} settings={settings} onChange={setSettings} />}

      {modal?.kind === 'client' && <ClientForm uid={uid} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.kind === 'session' && <SessionForm uid={uid} clients={clients} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.kind === 'note' && (
        <NoteForm uid={uid} clientId={modal.s.clientId} sessionId={modal.s.id} sessionDate={modal.s.start.toDate()}
          onClose={() => setModal(null)}
          onSaved={() => { const s = modal.s; setModal(null); if (s.status === 'planned') mark(s, { status: 'done' }); }} />
      )}
    </div>
  );
}

/* ── Ajanda: dünden itibaren 2 hafta, güne göre ── */
function Agenda({ sessions, clients, now, onMark, onNote }: {
  sessions: Session[]; clients: Record<string, Client>; now: number;
  onMark: (s: Session, p: Partial<Session>) => void; onNote: (s: Session) => void;
}) {
  const [range, setRange] = useState(14);
  const end = addDays(startOfDay(), range).getTime();
  const groups = useMemo(() => {
    const m = new Map<string, Session[]>();
    sessions.filter(s => s.start.toMillis() < end).forEach(s => {
      const k = startOfDay(s.start.toDate()).toISOString();
      m.set(k, [...(m.get(k) || []), s]);
    });
    return [...m.entries()];
  }, [sessions, end]);

  if (!groups.length) {
    return <div className="fx-empty"><h2>Önümüzdeki günlerde seans yok</h2><p>“Seans planla” ile tek seferlik ya da haftalık tekrarlanan seans oluşturabilirsin.</p></div>;
  }
  return (
    <div className="pr-agenda">
      {groups.map(([day, list]) => (
        <section key={day} className="pr-day">
          <h3>{fmtDay(new Date(day))} <span>{list.filter(s => s.status !== 'cancelled').length} seans</span></h3>
          {list.map(s => {
            const st = s.start.toDate();
            const past = st.getTime() + s.duration * 60_000 < now;
            const c = clients[s.clientId];
            return (
              <article key={s.id} className={`pr-slot is-${s.status} ${past ? 'is-past' : ''}`}>
                <div className="pr-slot-time"><b>{fmtTime(st)}</b><span>{fmtTime(new Date(st.getTime() + s.duration * 60_000))}</span></div>
                <div className="pr-slot-body">
                  <Link href={`/forum/danisanlar/${s.clientId}`} className="pr-slot-name">
                    {s.clientName}
                    {c?.risk === 'high' && <span className="pr-risk" title="Yüksek risk">!</span>}
                  </Link>
                  <div className="pr-slot-meta">
                    <StatusSelect status={s.status} onChange={v => onMark(s, { status: v })} />
                    {s.mode === 'online' ? <Video size={13} /> : <MapPin size={13} />} {MODE_LABEL[s.mode]} · {s.duration} dk{s.fee ? ` · ${fmtMoney(s.fee)}` : ''}
                    {s.fee ? <button type="button" className={`pr-paid ${s.paid ? 'is-on' : ''}`} onClick={() => onMark(s, { paid: !s.paid })}>{s.paid ? 'Ödendi' : 'Ödeme bekliyor'}</button> : null}
                  </div>
                </div>
                <div className="pr-slot-actions">
                  <button type="button" className="fx-btn fx-btn-outline fx-btn-sm" onClick={() => onNote(s)}><NotebookPen size={14} /> Not</button>
                  {s.status === 'planned' && past && <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={() => onMark(s, { status: 'done' })}><Check size={14} /> Yapıldı</button>}
                </div>
              </article>
            );
          })}
        </section>
      ))}
      {range < 60 && <button type="button" className="fx-load-more" onClick={() => setRange(60)}>Sonraki 2 ayı göster</button>}
    </div>
  );
}

/* ── Danışan listesi ── */
function ClientList({ clients, sessions, onNew }: { clients: Client[]; sessions: Session[]; onNew: () => void }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState<ClientStatus | 'all'>('active');
  const nextOf = useMemo(() => {
    const m: Record<string, Session> = {};
    sessions.forEach(s => { if (!m[s.clientId]) m[s.clientId] = s; });
    return m;
  }, [sessions]);
  const list = clients.filter(c => (f === 'all' || c.status === f) && c.name.toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')));

  return (
    <div className="pr-clients">
      <div className="pr-toolbar">
        <label className="pr-search"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Danışan ara" /></label>
        <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" onClick={onNew}><Plus size={15} /> Yeni danışan</button>
      </div>
      <div className="pr-filters">
        {([['active', 'Aktif'], ['paused', 'Ara verdi'], ['ended', 'Sonlandı'], ['all', 'Tümü']] as [ClientStatus | 'all', string][]).map(([k, l]) => (
          <button key={k} type="button" className={f === k ? 'is-on' : ''} onClick={() => setF(k)}>{l} <span>{k === 'all' ? clients.length : clients.filter(c => c.status === k).length}</span></button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="fx-empty"><h2>{clients.length ? 'Bu listede danışan yok' : 'Henüz danışan eklemedin'}</h2><p>{clients.length ? 'Filtreyi ya da aramayı değiştir.' : 'Danışan dosyası açarak seanslarını ve notlarını tek yerde tutabilirsin.'}</p></div>
      ) : list.map(c => {
        const n = nextOf[c.id];
        return (
          <Link key={c.id} href={`/forum/danisanlar/${c.id}`} className="pr-client">
            <span className="pr-av">{initials(c.name)}</span>
            <div className="pr-client-body">
              <b>{c.name} {c.risk !== 'none' && <span className={`pr-risk is-${c.risk}`} title={c.risk === 'high' ? 'Yüksek risk' : 'İzlenmeli'}>!</span>}</b>
              <span>{n ? `Sıradaki seans: ${fmtDay(n.start.toDate()).replace(/ · .*/, '')} ${fmtTime(n.start.toDate())}` : 'Planlanmış seans yok'}</span>
            </div>
            <span className={`pr-chip is-${c.status}`}>{STATUS_LABEL[c.status]}</span>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Hatırlatma ayarları ── */
function Reminders({ uid, settings, onChange }: { uid: string; settings: Settings; onChange: (s: Settings) => void }) {
  const save = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    onChange(next);
    saveSettings(uid, patch).then(() => toast.success('Kaydedildi')).catch(() => toast.error('Kaydedilemedi.'));
  };
  return (
    <div className="pr-reminders">
      <section className="fx-cv-card">
        <h3 className="fx-cv-title">Seans öncesi hatırlatma</h3>
        <p className="pr-hint">Logos uygulamasında her seanstan önce telefonuna bildirim gelir. Bildirimde danışanın adı değil, yalnızca baş harfleri yazar.</p>
        <ChipRow label="Seans öncesi hatırlatma" value={settings.reminderMinutes} onChange={v => save({ reminderMinutes: v })}
          options={[[0, 'Kapalı'], [10, '10 dk'], [15, '15 dk'], [30, '30 dk'], [60, '1 saat'], [120, '2 saat'], [1440, '1 gün']]} />
      </section>
      <section className="fx-cv-card pr-switch-card">
        <div>
          <h3 className="fx-cv-title">Günlük özet</h3>
          <p className="pr-hint">Seans olan günlerde sabah 08:00&apos;de &ldquo;Bugün N seansın var&rdquo; bildirimi.</p>
        </div>
        <button type="button" role="switch" aria-checked={settings.dailySummary} aria-label="Günlük özet" className={`fx-switch ${settings.dailySummary ? 'is-on' : ''}`} onClick={() => save({ dailySummary: !settings.dailySummary })}><span /></button>
      </section>
    </div>
  );
}
