'use client';

/**
 * Gönderi kutusu. Masaüstünde akış içinde satır olarak durur; mobilde yazı alanına
 * dokunulunca tam ekran açılır (geri/ileri, fotoğraf, kamera, yanıt izni, taslaklar).
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { X, Loader2, Image as ImageIcon, Camera, Undo2, Redo2, Globe, Users, BadgeCheck, Ban, FileText, Trash2, VenetianMask } from 'lucide-react';
import { collection, doc, increment, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { ANON_AVATAR, ANON_NAME, ANON_UID } from '@/lib/notify';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { notifyMentions } from '@/lib/mentionUtils';
import { Avatar, CharRing } from './ui';

const LIMIT = 140;
const CATEGORIES = ['Psikanaliz', 'Varoluş & Anlam', 'Kaygı & Depresyon', 'İlişkiler', 'Çocukluk & Travma', 'Rüyalar', 'Kimlik & Benlik', 'Kişisel Gelişim'];
const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

export type ReplyPolicy = 'everyone' | 'followers' | 'psychologists' | 'nobody';

export const REPLY_POLICIES: { id: ReplyPolicy; label: string; hint: string; Icon: typeof Globe }[] = [
  { id: 'everyone', label: 'Herkes', hint: 'Herkes yanıtlayabilir', Icon: Globe },
  { id: 'followers', label: 'Takipçilerim', hint: 'Takipçilerin yanıtlayabilir', Icon: Users },
  { id: 'psychologists', label: 'Sadece psikologlar', hint: 'Sadece psikologlar yanıtlayabilir', Icon: BadgeCheck },
  { id: 'nobody', label: 'Hiç kimse', hint: 'Kimse yanıtlayamaz', Icon: Ban },
];

type Draft = { id: string; body: string; cat: string; imageUrl: string; replyPolicy: ReplyPolicy; anon?: boolean; at: number };

const draftKey = (uid: string) => `logos-drafts:${uid}`;
const readDrafts = (uid: string): Draft[] => {
  try { return JSON.parse(localStorage.getItem(draftKey(uid)) || '[]'); } catch { return []; }
};
const writeDrafts = (uid: string, list: Draft[]) => {
  try { localStorage.setItem(draftKey(uid), JSON.stringify(list.slice(0, 20))); } catch {}
};

export function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 699px)');
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

/** Yazılanı geri alma / yineleme. Kısa aralıklarla yazılanlar tek adımda toplanır. */
function useHistory() {
  const [state, setState] = useState({ stack: [''], idx: 0 });
  const last = useRef(0);
  const record = (v: string) => {
    const now = Date.now();
    setState(s => {
      const merge = now - last.current < 700 && s.idx > 0 && s.idx === s.stack.length - 1;
      last.current = now;
      const base = s.stack.slice(0, s.idx + 1);
      if (merge) base[base.length - 1] = v; else base.push(v);
      return { stack: base.slice(-100), idx: Math.min(base.length, 100) - 1 };
    });
  };
  const reset = (v = '') => { last.current = 0; setState({ stack: [v], idx: 0 }); };
  return {
    record,
    reset,
    canUndo: state.idx > 0,
    canRedo: state.idx < state.stack.length - 1,
    undo: () => { last.current = 0; const i = Math.max(0, state.idx - 1); setState({ ...state, idx: i }); return state.stack[i]; },
    redo: () => { last.current = 0; const i = Math.min(state.stack.length - 1, state.idx + 1); setState({ ...state, idx: i }); return state.stack[i]; },
  };
}

export default function Composer({
  onPosted,
  autoFocus,
  startFull,
  onClose,
}: {
  onPosted?: (post: any) => void;
  autoFocus?: boolean;
  /** Mobilde doğrudan tam ekran açılır; kapanınca onClose çağrılır */
  startFull?: boolean;
  onClose?: () => void;
}) {
  const { user, userProfile, emailVerified } = useAuth();
  const isMobile = useIsMobile();
  const [body, setBody] = useState('');
  const [cat, setCat] = useState('Psikanaliz');
  const [imageUrl, setImageUrl] = useState('');
  const [replyPolicy, setReplyPolicy] = useState<ReplyPolicy>('everyone');
  const [pendingPolicy, setPendingPolicy] = useState<ReplyPolicy>('everyone');
  const [anon, setAnon] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [full, setFull] = useState(Boolean(startFull));
  const [panel, setPanel] = useState<null | 'policy' | 'leave' | 'drafts'>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [vv, setVv] = useState<{ h: number; top: number } | null>(null);
  const hist = useHistory();
  const fullInput = useRef<HTMLTextAreaElement>(null);

  const open = full && isMobile;

  useEffect(() => { if (user) setDrafts(readDrafts(user.uid)); }, [user, open]);

  // Klavye açıkken alt çubuk klavyenin hemen üstünde kalsın
  useEffect(() => {
    if (!open) return;
    const v = window.visualViewport;
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    // iOS yalnızca body'yi kilitlemekle yetinmez; html de kilitlenir
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const on = () => v && setVv({ h: v.height, top: v.offsetTop });
    on();
    v?.addEventListener('resize', on);
    v?.addEventListener('scroll', on);
    const t = setTimeout(() => fullInput.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevHtml;
      v?.removeEventListener('resize', on);
      v?.removeEventListener('scroll', on);
    };
  }, [open]);

  if (!user || user.isAnonymous || userProfile?.isBanned) return null;

  const isPsych = Boolean((userProfile?.isPsychologist && (userProfile?.psychologistStatus === 'approved' || !userProfile?.psychologistStatus)) || userProfile?.role === 'psychologist');
  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
  const photoLimitReached = !isPsych && !isAdmin && (userProfile?.photoUploadsUsed || 0) >= 1;
  const policy = REPLY_POLICIES.find(p => p.id === replyPolicy)!;
  const isEmpty = !body.trim() && !imageUrl;

  const change = (v: string) => { const s = v.slice(0, LIMIT); setBody(s); hist.record(s); };

  const clear = () => {
    setBody(''); setImageUrl(''); setReplyPolicy('everyone'); setCat('Psikanaliz'); setAnon(false); hist.reset();
  };

  const close = () => {
    setPanel(null);
    setFull(false);
    onClose?.();
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (photoLimitReached) return toast.error('Görsel ekleme hakkını kullandın. Psikologlar dışında her üye 1 görsel ekleyebilir.');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'manav-platform/forum');
      const data = await (await fetch('/api/upload', { method: 'POST', body: fd })).json();
      if (!data.success) throw new Error(data.error);
      setImageUrl(data.url);
    } catch (err: any) {
      toast.error('Görsel yüklenemedi: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const post = async () => {
    if (isEmpty) return;
    if (!emailVerified) return toast.error('Paylaşım yapabilmek için e-posta adresini doğrulaman gerekiyor.');
    setPosting(true);
    const showBadge = isPsych && !userProfile?.hideBadge;
    try {
      const base = { body, category: cat, imageUrl, replyPolicy, commentCount: 0, createdAt: serverTimestamp(), reactionsData: {} };
      // İsimsiz gönderide kimlik alanları boş kalır; gerçek sahibi yalnızca gizli anon_owners kaydında tutulur
      const data = anon
        ? { ...base, isAnonymous: true, uid: ANON_UID, authorName: ANON_NAME, authorUsername: '', authorIsPsychologist: false, authorHideBadge: false }
        : {
            ...base,
            authorName: userProfile?.displayName || user.displayName || 'Kullanıcı',
            authorUsername: userProfile?.username || '',
            authorIsPsychologist: showBadge,
            authorHideBadge: Boolean(userProfile?.hideBadge),
            uid: user.uid,
          };
      const ref = doc(collection(db, 'forum'));
      const batch = writeBatch(db);
      batch.set(ref, data);
      if (anon) batch.set(doc(db, 'anon_owners', ref.id), { uid: user.uid, createdAt: serverTimestamp() });
      await batch.commit();
      if (imageUrl && !isPsych && !isAdmin) {
        try { await updateDoc(doc(db, 'users', user.uid), { photoUploadsUsed: increment(1) }); } catch {}
      }
      // Bahsetme bildirimi göndereni gösterdiği için isimsiz gönderide gönderilmez
      if (!anon) { try { await notifyMentions({ text: body, postId: ref.id, currentUser: user, userProfile }); } catch {} }
      onPosted?.({ ...data, id: ref.id, createdAt: new Date() });
      clear();
      if (open) close();
      toast.success(anon ? 'İsimsiz olarak paylaşıldı' : 'Paylaşıldı');
    } catch (err: any) {
      toast.error('Paylaşılamadı: ' + (err.message || ''));
    } finally {
      setPosting(false);
    }
  };

  const saveDraft = () => {
    const list = [{ id: String(Date.now()), body, cat, imageUrl, replyPolicy, anon, at: Date.now() }, ...readDrafts(user.uid)];
    writeDrafts(user.uid, list);
    clear();
    close();
    toast.success('Taslaklara kaydedildi');
  };

  const loadDraft = (d: Draft) => {
    setBody(d.body); setCat(d.cat); setImageUrl(d.imageUrl); setReplyPolicy(d.replyPolicy || 'everyone'); setAnon(Boolean(d.anon));
    hist.reset(d.body);
    const rest = readDrafts(user.uid).filter(x => x.id !== d.id);
    writeDrafts(user.uid, rest);
    setDrafts(rest);
    setPanel(null);
  };

  const dropDraft = (id: string) => {
    const rest = readDrafts(user.uid).filter(x => x.id !== id);
    writeDrafts(user.uid, rest);
    setDrafts(rest);
    if (!rest.length) setPanel(null);
  };

  const preview = imageUrl && (
    <div className="fx-compose-preview">
      <img src={imageUrl} alt="Eklenen görsel" />
      <button type="button" onClick={() => setImageUrl('')} aria-label="Görseli kaldır"><X size={16} /></button>
    </div>
  );

  const photoInput = (camera?: boolean) => (
    <label className="fx-tool" aria-disabled={photoLimitReached || uploading} title={photoLimitReached ? 'Görsel ekleme hakkını kullandın' : camera ? 'Kamerayı aç' : 'Fotoğraf ekle'}>
      {camera ? <Camera size={21} /> : uploading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={21} />}
      <input type="file" accept="image/*" {...(camera ? { capture: 'environment' as const } : {})} hidden onChange={upload} disabled={uploading || photoLimitReached} />
    </label>
  );

  const categorySelect = (
    <select className="fx-select" value={cat} onChange={e => setCat(e.target.value)} aria-label="Konu">
      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );

  // Takipçi kısıtı isimsiz gönderide işlemez (sahibi bilinmez); bu durumda "Herkes"e döner
  const toggleAnon = () => {
    setAnon(v => {
      if (!v && replyPolicy === 'followers') setReplyPolicy('everyone');
      return !v;
    });
  };

  const anonToggle = (
    <button
      type="button"
      className={`fx-tool fx-anon-toggle ${anon ? 'is-on' : ''}`}
      onClick={toggleAnon}
      aria-pressed={anon}
      title={anon ? 'İsimsiz paylaşım açık' : 'İsimsiz paylaş'}
    >
      <VenetianMask size={21} />
      {anon && <span>İsimsiz</span>}
    </button>
  );

  const policyButton = (
    <button type="button" className="fx-policy-btn" onClick={() => { setPendingPolicy(replyPolicy); setPanel('policy'); }} aria-haspopup="dialog">
      <policy.Icon size={15} strokeWidth={2.4} />
      <span>{policy.hint}</span>
    </button>
  );

  const policySheet = panel === 'policy' && (
    <div className="fx-actsheet-scrim" onClick={() => setPanel(null)}>
      <div className="fx-actsheet fx-policy-sheet" role="dialog" aria-label="Kimler yanıtlayabilir?" onClick={e => e.stopPropagation()}>
        <div className="fx-policy-head">
          <h3>Kimler yanıtlayabilir?</h3>
          <button type="button" className="fx-icon-btn" onClick={() => setPanel(null)} aria-label="Kapat"><X size={22} /></button>
        </div>
        <div role="radiogroup" aria-label="Yanıt izni">
          {REPLY_POLICIES.filter(p => !(anon && p.id === 'followers')).map(p => (
            <button key={p.id} type="button" role="radio" aria-checked={pendingPolicy === p.id} className="fx-actsheet-row" onClick={() => setPendingPolicy(p.id)}>
              <p.Icon size={24} strokeWidth={1.8} className="fx-policy-ico" />
              <span className="fx-actsheet-label">{p.label}</span>
              <span className={`fx-radio ${pendingPolicy === p.id ? 'is-on' : ''}`} aria-hidden="true" />
            </button>
          ))}
        </div>
        <button type="button" className="fx-btn fx-policy-apply" onClick={() => { setReplyPolicy(pendingPolicy); setPanel(null); }}>Uygula</button>
      </div>
    </div>
  );

  if (open) {
    const host = (document.querySelector('[data-forum-page]') as HTMLElement | null) || document.body;
    return createPortal(
      <div
        className="fx-fullcompose"
        role="dialog"
        aria-modal="true"
        aria-label="Yeni gönderi"
        style={vv ? { height: vv.h, top: vv.top } : undefined}
      >
        <div className="fx-fullcompose-head">
          <button type="button" className="fx-text-btn fx-fullcompose-cancel" onClick={() => (isEmpty ? (clear(), close()) : setPanel('leave'))}>
            İptal et
          </button>
          <button type="button" className="fx-btn fx-btn-primary fx-btn-sm" disabled={posting || isEmpty} onClick={post}>
            {posting ? 'Paylaşılıyor…' : 'Paylaş'}
          </button>
        </div>

        <div className="fx-fullcompose-main">
          {isEmpty && drafts.length > 0 && (
            <button type="button" className="fx-drafts-link" onClick={() => setPanel('drafts')}>
              <FileText size={15} /> Taslaklar ({drafts.length})
            </button>
          )}
          <div className="fx-compose fx-compose-full">
            <Avatar src={anon ? ANON_AVATAR : userProfile?.photoURL || user.photoURL} name={anon ? ANON_NAME : userProfile?.displayName || user.displayName} size={40} />
            <div className="fx-compose-body">
              <textarea
                ref={fullInput}
                placeholder="Aklından ne geçiyor?"
                value={body}
                maxLength={LIMIT}
                onChange={e => change(e.target.value)}
                aria-label="Gönderi metni"
              />
              {preview}
              {anon && <p className="fx-anon-note">İsimsiz paylaşıyorsun. Adın, kullanıcı adın ve profilin gösterilmez; bildirimler yine sana gelir.</p>}
            </div>
          </div>
        </div>

        <div className="fx-fullcompose-foot">
          <div className="fx-fullcompose-policy">
            {policyButton}
            <div className="fx-fullcompose-history">
              <button type="button" className="fx-icon-btn" disabled={!hist.canUndo} onClick={() => setBody(hist.undo())} aria-label="Geri al">
                <Undo2 size={22} />
              </button>
              <button type="button" className="fx-icon-btn" disabled={!hist.canRedo} onClick={() => setBody(hist.redo())} aria-label="Yinele">
                <Redo2 size={22} />
              </button>
            </div>
          </div>
          <div className="fx-fullcompose-tools">
            <div className="fx-compose-tools">
              {photoInput()}
              {photoInput(true)}
              {anonToggle}
              {categorySelect}
            </div>
            <CharRing length={body.length} limit={LIMIT} />
          </div>
        </div>

        {policySheet}

        {panel === 'leave' && (
          <div className="fx-actsheet-scrim" onClick={() => setPanel(null)}>
            <div className="fx-actsheet" role="alertdialog" aria-label="Taslak" onClick={e => e.stopPropagation()}>
              <div className="fx-actsheet-grip" />
              <h3>Taslaklara kaydedilsin mi?</h3>
              <p>Kaydedersen daha sonra buradan devam edebilirsin.</p>
              <button type="button" className="fx-btn fx-btn-primary fx-actsheet-btn" onClick={saveDraft}>Taslağı kaydet</button>
              <button type="button" className="fx-btn fx-btn-outline fx-actsheet-btn is-danger" onClick={() => { clear(); close(); }}>Vazgeç</button>
            </div>
          </div>
        )}

        {panel === 'drafts' && (
          <div className="fx-actsheet-scrim" onClick={() => setPanel(null)}>
            <div className="fx-actsheet" role="dialog" aria-label="Taslaklar" onClick={e => e.stopPropagation()}>
              <div className="fx-actsheet-grip" />
              <h3>Taslaklar</h3>
              <div className="fx-drafts">
                {drafts.map(d => (
                  <div key={d.id} className="fx-draft">
                    <button type="button" className="fx-draft-open" onClick={() => loadDraft(d)}>
                      <span className="fx-draft-text">{d.body || (d.imageUrl ? 'Görsel' : '')}</span>
                      <span className="fx-draft-meta">{new Date(d.at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </button>
                    <button type="button" className="fx-icon-btn" onClick={() => dropDraft(d.id)} aria-label="Taslağı sil">
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>,
      host
    );
  }

  if (startFull && isMobile) return null;

  return (
    <div className="fx-compose">
      <Avatar src={anon ? ANON_AVATAR : userProfile?.photoURL || user.photoURL} name={anon ? ANON_NAME : userProfile?.displayName || user.displayName} size={40} />
      <div className="fx-compose-body">
        <textarea
          autoFocus={autoFocus && !isMobile}
          readOnly={isMobile}
          onClick={() => isMobile && setFull(true)}
          onFocus={e => { if (isMobile) { e.currentTarget.blur(); setFull(true); } }}
          placeholder="Aklından ne geçiyor?"
          value={body}
          maxLength={LIMIT}
          rows={autoFocus ? 5 : 2}
          onChange={e => change(e.target.value)}
          aria-label="Gönderi metni"
        />
        {preview}
        {anon && <p className="fx-anon-note">İsimsiz paylaşıyorsun. Adın, kullanıcı adın ve profilin gösterilmez; bildirimler yine sana gelir.</p>}
        <div className="fx-compose-policy-row">{policyButton}</div>
        <div className="fx-compose-bar">
          <div className="fx-compose-tools">
            {photoInput()}
            {anonToggle}
            {categorySelect}
          </div>
          <div className="fx-compose-send">
            <CharRing length={body.length} limit={LIMIT} />
            <button type="button" className="fx-btn fx-btn-primary" disabled={posting || isEmpty} onClick={post}>
              {posting ? 'Paylaşılıyor…' : 'Paylaş'}
            </button>
          </div>
        </div>
      </div>
      {policySheet}
    </div>
  );
}
