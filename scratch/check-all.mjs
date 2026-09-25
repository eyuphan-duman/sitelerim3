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

async function checkAll() {
  const snap = await getDocs(collection(db, 'posts'));
  snap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id}`);
    console.log(`Title: ${data.title}`);
    console.log(`Date: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt}`);
    console.log(`Content Snapshot: ${data.content.substring(0, 100)}...`);
    console.log('---');
  });
  process.exit(0);
}

checkAll();
