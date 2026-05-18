import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try to initialize without explicit credentials, relying on environment
try {
  admin.initializeApp({
    projectId: 'manav-platform'
  });
} catch (e) {
  console.log("Default initialization failed, trying with project ID only...");
}

const db = admin.firestore();

async function publish() {
  const articlePath = path.join(__dirname, '../data/articles/yuzlesme-sanati-psikoterapi.json');
  const articleData = JSON.parse(fs.readFileSync(articlePath, 'utf8'));

  const strip = (h) => h.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();
  const raw = strip(articleData.content);
  const excerpt = raw.length > 220 ? raw.slice(0, 220) + '…' : raw;

  try {
    console.log("Attempting to publish via firebase-admin...");
    
    // 1. Add to 'articles' collection
    const articleRef = await db.collection('articles').add({
      title: articleData.title,
      category: articleData.category,
      content: articleData.content,
      excerpt: excerpt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      featuredImage: ""
    });
    console.log("Article added to 'articles' with ID:", articleRef.id);

    // 2. Add to 'posts' collection
    const postRef = await db.collection('posts').add({
      title: articleData.title,
      category: articleData.category,
      content: articleData.content,
      excerpt: excerpt,
      likes: 0,
      commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
