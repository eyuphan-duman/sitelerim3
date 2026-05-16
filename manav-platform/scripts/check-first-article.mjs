import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
  try {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const firstDoc = snap.docs[0];
      console.log("Found first article in 'articles':", firstDoc.id);
      console.log("Title:", firstDoc.data().title);
      console.log("CreatedAt:", firstDoc.data().createdAt?.toDate ? firstDoc.data().createdAt.toDate().toISOString() : firstDoc.data().createdAt);
    }

    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(1));
    const snapPosts = await getDocs(qPosts);
    if (!snapPosts.empty) {
      const firstPost = snapPosts.docs[0];
      console.log("\nFound first post in 'posts':", firstPost.id);
      console.log("Title:", firstPost.data().title);
      console.log("CreatedAt:", firstPost.data().createdAt?.toDate ? firstPost.data().createdAt.toDate().toISOString() : firstPost.data().createdAt);
    }
  } catch (e) {
    console.error(e);
  }
}

replaceFirst();
