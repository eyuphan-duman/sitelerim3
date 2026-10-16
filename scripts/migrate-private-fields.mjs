// Üyelerin e-posta, tam ad ve doğum tarihini herkese açık `users` belgelerinden
// yalnızca sahibinin ve adminin okuyabildiği `private_users` koleksiyonuna taşır.
// İsteğe bağlı olarak firestore.rules dosyasını da yayınlar.
//
// Kullanım:
//   node scripts/migrate-private-fields.mjs <servis-hesabi.json>            → kuru çalıştırma (hiçbir şey yazmaz)
//   node scripts/migrate-private-fields.mjs <servis-hesabi.json> --apply    → taşır
//   node scripts/migrate-private-fields.mjs <servis-hesabi.json> --rules    → yalnızca kuralları yayınlar
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getSecurityRules } from 'firebase-admin/security-rules';

const [keyPath, ...flags] = process.argv.slice(2);
if (!keyPath) { console.error('Servis hesabı JSON yolunu ver.'); process.exit(1); }
const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();
const APPLY = flags.includes('--apply');
const FIELDS = ['email', 'fullName', 'birthDate'];

if (flags.includes('--rules')) {
  const source = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const res = await getSecurityRules().releaseFirestoreRulesetFromSource(source);
  console.log('Kurallar yayınlandı:', res.name);
  process.exit(0);
}

const users = await db.collection('users').get();
let moved = 0, clean = 0;
for (const d of users.docs) {
  const data = d.data();
  const priv = {};
  for (const f of FIELDS) if (data[f] !== undefined && data[f] !== '') priv[f] = data[f];
  const hasPublic = FIELDS.some(f => f in data);
  if (!hasPublic) { clean++; continue; }
  moved++;
  console.log(`${APPLY ? 'taşınıyor' : '[kuru]'} ${d.id} @${data.username || '-'} → ${Object.keys(priv).join(', ') || '(boş alanlar silinecek)'}`);
  if (APPLY) {
    if (Object.keys(priv).length) {
      await db.collection('private_users').doc(d.id).set({ ...priv, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    const del = {};
    for (const f of FIELDS) if (f in data) del[f] = FieldValue.delete();
    await d.ref.update(del);
  }
}
console.log(`\nToplam ${users.size} üye: ${moved} taşınacak/taşındı, ${clean} zaten temiz.${APPLY ? '' : ' (kuru çalıştırma — yazmak için --apply)'}`);
