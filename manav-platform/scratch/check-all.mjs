import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkCollections() {
  try {
    console.log("--- Articles Collection ---");
    const artSnap = await getDocs(collection(db, 'articles'));
    console.log("Count:", artSnap.size);
    artSnap.forEach(d => console.log(d.id, "|", d.data().title, "|", d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt));

    console.log("\n--- Posts Collection ---");
    const postSnap = await getDocs(collection(db, 'posts'));
    console.log("Count:", postSnap.size);
    postSnap.forEach(d => console.log(d.id, "|", d.data().title, "|", d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt));
  } catch (e) {
    console.error("Failed:", e);
  }
  process.exit(0);
}

checkCollections();
