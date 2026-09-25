import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
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

async function replaceFirst() {
  const articlePath = path.join(__dirname, '../data/articles/simgesel-baba-coktugunde.json');
  const articleData = JSON.parse(fs.readFileSync(articlePath, 'utf8'));

  const strip = (h) => h.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();
  const raw = strip(articleData.content);
  const excerpt = raw.length > 220 ? raw.slice(0, 220) + '…' : raw;

  try {
    // 1. Find and update the first article in 'articles'
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const firstDoc = snap.docs[0];
      console.log("Replacing article:", firstDoc.id);
      await updateDoc(doc(db, 'articles', firstDoc.id), {
        title: articleData.title,
        category: articleData.category,
        content: articleData.content,
        excerpt: excerpt,
        createdAt: serverTimestamp() // Refresh timestamp to keep it first
      });
      console.log("Article updated successfully.");
    } else {
      console.log("No articles found to replace in 'articles'.");
    }

    // 2. Find and update the first post in 'posts'
    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(1));
    const snapPosts = await getDocs(qPosts);
    if (!snapPosts.empty) {
      const firstPost = snapPosts.docs[0];
      console.log("Replacing post:", firstPost.id);
      await updateDoc(doc(db, 'posts', firstPost.id), {
        title: articleData.title,
        category: articleData.category,
        content: articleData.content,
        excerpt: excerpt,
        createdAt: serverTimestamp(),
        date: new Date().toISOString()
      });
      console.log("Post updated successfully.");
    } else {
      console.log("No posts found to replace in 'posts'.");
    }

    console.log("Success: First article/post replaced with new content.");
    process.exit(0);
  } catch (e) {
    console.error("Error replacing article:", e);
    process.exit(1);
  }
}

replaceFirst();
