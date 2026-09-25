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

async function checkPosts() {
  try {
    const snap = await getDocs(collection(db, 'posts'));
    console.log("Posts Count:", snap.size);
    snap.forEach(d => console.log(d.id, d.data().title));
  } catch (e) {
    console.error("Failed:", e);
  }
  process.exit(0);
}

checkPosts();
