import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCh_bkX3vge2P0BTF9UDY5A1lHtGG8kyLs",
  authDomain: "manav-platform.firebaseapp.com",
  projectId: "manav-platform",
  storageBucket: "manav-platform.firebasestorage.app",
  messagingSenderId: "369433755693",
  appId: "1:369433755693:web:c14e8c01bf21eb5fcdf8a4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAll() {
  console.log("Starting deletion...");
  try {
    // Delete Forum posts and their comments
    const forumSnap = await getDocs(collection(db, 'forum'));
    for (const d of forumSnap.docs) {
      const commentsSnap = await getDocs(collection(db, `forum/${d.id}/comments`));
      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, `forum/${d.id}/comments/${c.id}`));
      }
      await deleteDoc(doc(db, 'forum', d.id));
      console.log(`Deleted forum post ${d.id}`);
    }

    // Delete Yazılarım (posts)
    const postsSnap = await getDocs(collection(db, 'posts'));
    for (const d of postsSnap.docs) {
      await deleteDoc(doc(db, 'posts', d.id));
      console.log(`Deleted article ${d.id}`);
    }

    console.log("Successfully deleted all forum and posts data!");
  } catch (error) {
    console.error("Error deleting documents: ", error);
  }
  process.exit(0);
}

deleteAll();
