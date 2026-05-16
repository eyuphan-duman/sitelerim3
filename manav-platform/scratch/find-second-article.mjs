import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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

async function findArticle() {
  const oldTitle = "“ÖTEKİ İLE KURAMADIĞIN BAĞIN CEZASINI KENDİNE VERİRSİN”";
  try {
    const q = query(collection(db, 'articles'), where('title', '==', oldTitle));
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.forEach(d => console.log("Found Article:", d.id, d.data().title));
    } else {
      console.log("No article found with that title.");
    }

    const qPosts = query(collection(db, 'posts'), where('title', '==', oldTitle));
    const snapPosts = await getDocs(qPosts);
    if (!snapPosts.empty) {
      snapPosts.forEach(d => console.log("Found Post:", d.id, d.data().title));
    } else {
      console.log("No post found with that title.");
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

findArticle();
