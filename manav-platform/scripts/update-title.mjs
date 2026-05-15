import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

async function updateArticleTitle() {
  const oldTitle = "“SİMGESEL BABA ÇÖKTÜĞÜNDE, GERÇEK BABA DA İŞLEVSİZLEŞİR”";
  const newTitle = "Simgesel Babanın Çöküşü ve Yeniden İnşaası";
  const articleId = "WQVaC7GJCyww6MfvhbsD";

  try {
    console.log(`Updating article ${articleId}...`);
    // 1. Update in 'articles' collection
    await updateDoc(doc(db, 'articles', articleId), {
      title: newTitle
    });
    console.log("Updated in 'articles' collection.");

    // 2. Find and update in 'posts' collection
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where("title", "==", oldTitle));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No matching post found in 'posts' collection with title:", oldTitle);
    } else {
      for (const d of querySnapshot.docs) {
        await updateDoc(doc(db, 'posts', d.id), {
          title: newTitle
        });
        console.log(`Updated post ${d.id} in 'posts' collection.`);
      }
    }

    console.log("Success: Title updated in both collections.");
  } catch (e) {
    console.error("Error updating title:", e);
  }
  process.exit(0);
}

updateArticleTitle();
