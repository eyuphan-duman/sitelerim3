import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const firebaseConfig = {
  apiKey: "AIzaSyCh_bkX3vge2P0BTF9UDY5A1lHtGG8kyLs",
  authDomain: "manav-platform.firebaseapp.com",
  projectId: "manav-platform",
  storageBucket: "manav-platform.firebasestorage.app",
  messagingSenderId: "369433755693",
  appId: "1:369433755693:web:c14e8c01bf21eb5fcdf8a4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function publish() {
  const articlePath = path.join(__dirname, '../data/articles/oteki-ile-kuramadigin-bag.json');
  const articleData = JSON.parse(fs.readFileSync(articlePath, 'utf8'));

  const strip = (h) => h.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();
  const raw = strip(articleData.content);
  const excerpt = raw.length > 220 ? raw.slice(0, 220) + '…' : raw;

  try {
    const docRef = await addDoc(collection(db, 'articles'), {
      title: articleData.title,
      category: articleData.category,
      content: articleData.content,
      excerpt: excerpt,
      createdAt: serverTimestamp(),
      featuredImage: "" // Optional
    });
    console.log("Article published with ID:", docRef.id);
    process.exit(0);
  } catch (e) {
    console.error("Error publishing article:", e);
    process.exit(1);
  }
}

publish();
