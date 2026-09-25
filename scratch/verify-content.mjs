import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function checkContent() {
  const id = "2LCGtzQTaoiCIfKwXeb0";
  const snap = await getDoc(doc(db, 'posts', id));
  if (snap.exists()) {
    console.log("Content starts with:", snap.data().content.substring(0, 200));
  } else {
    console.log("Post not found");
  }
  process.exit(0);
}

checkContent();
