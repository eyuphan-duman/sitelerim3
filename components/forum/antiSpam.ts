import { doc, getDoc, increment, serverTimestamp, writeBatch, type DocumentReference, type WriteBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Spam koruması. Sınırlar firestore.rules içindeki rateOk() ile aynıdır; burada önceden denetlenip
 * kullanıcıya anlaşılır bir mesaj gösterilir, asıl engel kurallardadır.
 */
export type SpamKind = 'post' | 'comment' | 'repost';
export const RATE: Record<SpamKind, { gap: number; perHour: number; noun: string }> = {
  post: { gap: 30, perHour: 10, noun: 'gönderi' },
  comment: { gap: 10, perHour: 40, noun: 'yanıt' },
  repost: { gap: 3, perHour: 60, noun: 'yeniden paylaşım' },
};

export class SpamError extends Error {}

const norm = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
const ms = (v: unknown) => (v as { toMillis?: () => number } | null)?.toMillis?.() || 0;

/** Metnin kendisinden anlaşılan spam işaretleri (bağlantı, etiket ve tekrar yağmuru) */
export function spamReason(text: string): string | null {
  const t = text || '';
  if ((t.match(/(https?:\/\/|www\.)\S+/gi) || []).length > 2) return 'Bir paylaşımda en fazla 2 bağlantı olabilir.';
  if ((t.match(/@[\p{L}\p{N}_.]+/gu) || []).length > 5) return 'Bir paylaşımda en fazla 5 kişiyi etiketleyebilirsin.';
  if ((t.match(/#[\p{L}\p{N}_]+/gu) || []).length > 5) return 'Bir paylaşımda en fazla 5 etiket (#) kullanabilirsin.';
  if (/([\s\S])\1{14,}/u.test(t)) return 'Aynı karakteri art arda bu kadar çok tekrarlayamazsın.';
  const words = norm(t).split(' ').filter(w => w.length > 1);
  if (words.length >= 8 && new Set(words).size / words.length < 0.3) return 'Aynı kelimeleri tekrar tekrar yazmak yerine düşünceni açıkça paylaş.';
  return null;
}

/**
 * Belgeyi hız sınırı kaydıyla birlikte tek toplu yazımda oluşturur.
 * Kurallara takılırsa ya da önceden denetimde sınır aşılmışsa SpamError fırlatır.
 */
export async function createLimited(uid: string, kind: SpamKind, ref: DocumentReference, data: Record<string, unknown>, text = '', extra?: (b: WriteBatch) => void) {
  const { gap, perHour, noun } = RATE[kind];
  if (kind !== 'repost') {
    const reason = spamReason(text);
    if (reason) throw new SpamError(reason);
  }
  const rlRef = doc(db, 'rate_limits', uid);
  const prev = (await getDoc(rlRef).catch(() => null))?.data() || {};
  const now = Date.now();
  const wait = Math.ceil((ms(prev[`${kind}At`]) + gap * 1000 - now) / 1000);
  if (wait > 0) throw new SpamError(`Biraz yavaşla: yeni bir ${noun} için ${wait} saniye bekle.`);
  if (text && prev[`${kind}Text`] && norm(prev[`${kind}Text`]) === norm(text)) throw new SpamError('Aynı metni arka arkaya paylaşamazsın.');
  const win = ms(prev[`${kind}Win`]);
  const inWin = win > now - 55 * 60_000;
  if (inWin && (prev[`${kind}Count`] || 0) >= perHour) {
    const mins = Math.max(1, Math.ceil((win + 3_600_000 - now) / 60_000));
    throw new SpamError(`Bir saatte en fazla ${perHour} ${noun} yapabilirsin. ${mins} dakika sonra tekrar dene.`);
  }
  const b = writeBatch(db);
  b.set(ref, data);
  b.set(rlRef, {
    [`${kind}At`]: serverTimestamp(),
    [`${kind}Text`]: text,
    [`${kind}Ref`]: ref.path,
    ...(inWin ? { [`${kind}Count`]: increment(1) } : { [`${kind}Win`]: serverTimestamp(), [`${kind}Count`]: 1 }),
  }, { merge: true });
  extra?.(b);
  try {
    await b.commit();
  } catch (e) {
    if ((e as { code?: string })?.code !== 'permission-denied') throw e;
    // Geçiş dönemi: hız sınırı kuralları henüz yayınlanmamışsa rate_limits yazımı reddedilir;
    // belge kayıtsız bir kez daha denenir. Yeni kurallarda bu yazım da reddedilir.
    try {
      const b2 = writeBatch(db);
      b2.set(ref, data);
      extra?.(b2);
      await b2.commit();
    } catch {
      throw new SpamError('Paylaşılamadı. Çok hızlı paylaşıyor olabilirsin ya da bu işlem için iznin yok; biraz bekleyip tekrar dene.');
    }
  }
  return ref;
}
