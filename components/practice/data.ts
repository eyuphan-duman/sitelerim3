import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc,
  Timestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Danışanlarım (psikolog çalışma alanı). Tüm veriler practice/{psikologUid}/… altında durur ve
 * Firestore kurallarıyla yalnızca o psikoloğa açıktır (yönetici dahil başka kimse okuyamaz).
 */
export type ClientStatus = 'active' | 'paused' | 'ended';
export type Mode = 'face' | 'online';
export type SessionStatus = 'planned' | 'done' | 'cancelled' | 'noshow';
export type Risk = 'none' | 'watch' | 'high';

export type Client = {
  id: string;
  name: string;
  birthYear?: number | null;
  phone?: string;
  email?: string;
  emergency?: string;
  reason?: string;
  goals?: string;
  medication?: string;
  referral?: string;
  risk: Risk;
  riskNote?: string;
  status: ClientStatus;
  fee?: number | null;
  duration: number;
  mode: Mode;
  location?: string;
  createdAt?: Timestamp;
};

export type Session = {
  id: string;
  clientId: string;
  clientName: string;
  start: Timestamp;
  duration: number;
  mode: Mode;
  status: SessionStatus;
  fee?: number | null;
  paid: boolean;
};

export type Note = {
  id: string;
  clientId: string;
  sessionId?: string | null;
  date: Timestamp;
  observations?: string;
  discussed?: string;
  intervention?: string;
  homework?: string;
  plan?: string;
  mood?: number | null;
  risk?: boolean;
};

export type Settings = { reminderMinutes: number; dailySummary: boolean; kvkkAck?: boolean };
export const DEFAULT_SETTINGS: Settings = { reminderMinutes: 30, dailySummary: true };

export const STATUS_LABEL: Record<ClientStatus, string> = { active: 'Aktif', paused: 'Ara verdi', ended: 'Sonlandı' };
export const SESSION_LABEL: Record<SessionStatus, string> = { planned: 'Planlandı', done: 'Yapıldı', cancelled: 'İptal', noshow: 'Gelmedi' };
export const MODE_LABEL: Record<Mode, string> = { face: 'Yüz yüze', online: 'Online' };
export const RISK_LABEL: Record<Risk, string> = { none: 'Risk yok', watch: 'İzlenmeli', high: 'Yüksek risk' };

const base = (uid: string) => `practice/${uid}`;
const strip = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

/* ── Ayarlar ── */
export async function loadSettings(uid: string): Promise<Settings> {
  const s = await getDoc(doc(db, base(uid))).catch(() => null);
  return { ...DEFAULT_SETTINGS, ...((s?.data() as Partial<Settings>) || {}) };
}
export const saveSettings = (uid: string, s: Partial<Settings>) => setDoc(doc(db, base(uid)), s, { merge: true });

/* ── Danışanlar ── */
export async function listClients(uid: string): Promise<Client[]> {
  const s = await getDocs(collection(db, base(uid), 'clients'));
  return s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Client, 'id'>) })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}
export async function getClient(uid: string, id: string): Promise<Client | null> {
  const s = await getDoc(doc(db, base(uid), 'clients', id));
  return s.exists() ? ({ id: s.id, ...(s.data() as Omit<Client, 'id'>) }) : null;
}
export async function saveClient(uid: string, c: Omit<Client, 'id'> & { id?: string }) {
  const { id, ...data } = c;
  if (id) {
    await updateDoc(doc(db, base(uid), 'clients', id), strip({ ...data, updatedAt: serverTimestamp() }));
    return id;
  }
  const ref = await addDoc(collection(db, base(uid), 'clients'), strip({ ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  return ref.id;
}
/** Danışan dosyası seansları ve notlarıyla birlikte kalıcı olarak silinir */
export async function deleteClient(uid: string, id: string) {
  const [ss, ns] = await Promise.all([
    getDocs(query(collection(db, base(uid), 'sessions'), where('clientId', '==', id))),
    getDocs(query(collection(db, base(uid), 'notes'), where('clientId', '==', id))),
  ]);
  const refs = [...ss.docs.map(d => d.ref), ...ns.docs.map(d => d.ref), doc(db, base(uid), 'clients', id)];
  for (let i = 0; i < refs.length; i += 400) {
    const b = writeBatch(db);
    refs.slice(i, i + 400).forEach(r => b.delete(r));
    await b.commit();
  }
}

/* ── Seanslar ── */
const toSession = (d: { id: string; data: () => unknown }) => ({ id: d.id, ...(d.data() as Omit<Session, 'id'>) });
export async function sessionsBetween(uid: string, from: Date, to: Date): Promise<Session[]> {
  const s = await getDocs(query(collection(db, base(uid), 'sessions'),
    where('start', '>=', Timestamp.fromDate(from)), where('start', '<', Timestamp.fromDate(to)), orderBy('start', 'asc')));
  return s.docs.map(toSession);
}
export async function sessionsOf(uid: string, clientId: string): Promise<Session[]> {
  const s = await getDocs(query(collection(db, base(uid), 'sessions'), where('clientId', '==', clientId)));
  return s.docs.map(toSession).sort((a, b) => a.start.toMillis() - b.start.toMillis());
}
/** Bir ya da (haftalık tekrarla) birden çok seans planlar */
export async function planSessions(uid: string, s: Omit<Session, 'id' | 'start' | 'status' | 'paid'> & { start: Date; repeatWeeks: number }) {
  const b = writeBatch(db);
  const count = Math.max(1, Math.min(52, s.repeatWeeks || 1));
  for (let i = 0; i < count; i++) {
    const at = new Date(s.start.getTime() + i * 7 * 24 * 3600_000);
    b.set(doc(collection(db, base(uid), 'sessions')), strip({
      clientId: s.clientId, clientName: s.clientName, start: Timestamp.fromDate(at), duration: s.duration,
      mode: s.mode, fee: s.fee ?? null, status: 'planned', paid: false, createdAt: serverTimestamp(),
    }));
  }
  await b.commit();
}
export const updateSession = (uid: string, id: string, patch: Partial<Omit<Session, 'id'>>) =>
  updateDoc(doc(db, base(uid), 'sessions', id), strip({ ...patch, updatedAt: serverTimestamp() }));
export const deleteSession = (uid: string, id: string) => deleteDoc(doc(db, base(uid), 'sessions', id));

/* ── Notlar ── */
export async function notesOf(uid: string, clientId: string): Promise<Note[]> {
  const s = await getDocs(query(collection(db, base(uid), 'notes'), where('clientId', '==', clientId)));
  return s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Note, 'id'>) })).sort((a, b) => b.date.toMillis() - a.date.toMillis());
}
export async function saveNote(uid: string, n: Omit<Note, 'id' | 'date'> & { id?: string; date: Date }) {
  const { id, date, ...data } = n;
  const payload = strip({ ...data, date: Timestamp.fromDate(date), updatedAt: serverTimestamp() });
  if (id) { await updateDoc(doc(db, base(uid), 'notes', id), payload); return id; }
  return (await addDoc(collection(db, base(uid), 'notes'), { ...payload, createdAt: serverTimestamp() })).id;
}
export const deleteNote = (uid: string, id: string) => deleteDoc(doc(db, base(uid), 'notes', id));

/* ── Yardımcılar ── */
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toLocaleUpperCase('tr-TR') || '').join('.') + (name.trim() ? '.' : '');
export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
export const fmtTime = (d: Date) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
export const fmtDay = (d: Date) => {
  const today = startOfDay();
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / 86400_000);
  const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
  return diff === 0 ? `Bugün · ${label}` : diff === 1 ? `Yarın · ${label}` : diff === -1 ? `Dün · ${label}` : label;
};
export const fmtDate = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtMoney = (n?: number | null) => (n || n === 0 ? `${n.toLocaleString('tr-TR')} ₺` : '');
export function relTime(d: Date, now = Date.now()) {
  const mins = Math.round((d.getTime() - now) / 60_000);
  if (mins < 0) return mins > -60 ? 'başladı' : 'geçti';
  if (mins < 60) return `${mins} dk sonra`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} saat sonra` : `${Math.round(h / 24)} gün sonra`;
}
/** firestore.rules içindeki isVerifiedPsychologist() ile aynı: Danışanlarım yalnızca onaylı psikologlara açıktır */
export const isApprovedPsych = (p?: { isPsychologist?: boolean; psychologistStatus?: string } | null) =>
  Boolean(p?.isPsychologist && (p.psychologistStatus === 'approved' || !p.psychologistStatus));
