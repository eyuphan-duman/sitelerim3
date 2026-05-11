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
    // 1. Add to 'articles' collection
    const articleRef = await addDoc(collection(db, 'articles'), {
      title: articleData.title,
      category: articleData.category,
      content: articleData.content,
      excerpt: excerpt,
      createdAt: serverTimestamp(),
      featuredImage: ""
    });
    console.log("Article added to 'articles' with ID:", articleRef.id);

    // 2. Add to 'posts' collection (for YazilarimClient compatibility)
    const postRef = await addDoc(collection(db, 'posts'), {
      title: articleData.title,
      category: articleData.category,
      content: articleData.content,
      excerpt: excerpt,
      likes: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      date: new Date().toISOString()
    });
    console.log("Article added to 'posts' with ID:", postRef.id);

    console.log("Success: Article published to both collections.");
    process.exit(0);
  } catch (e) {
    console.error("Error publishing article:", e);
    process.exit(1);
  }
}

publish();
