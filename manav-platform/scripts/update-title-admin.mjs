import admin from 'firebase-admin';

// Initialize admin
try {
  admin.initializeApp({
    projectId: 'manav-platform'
  });
} catch (e) {
  console.log("Initialization failed:", e);
}

const db = admin.firestore();

async function updateTitle() {
  const oldTitle = "“SİMGESEL BABA ÇÖKTÜĞÜNDE, GERÇEK BABA DA İŞLEVSİZLEŞİR”";
  const newTitle = "Simgesel Babanın Çöküşü ve Yeniden İnşaası";
  const articleId = "WQVaC7GJCyww6MfvhbsD";

  try {
    console.log("Attempting to update title via firebase-admin...");
    
    // 1. Update in 'articles' collection
    await db.collection('articles').doc(articleId).update({
      title: newTitle
    });
    console.log(`Updated article ${articleId} in 'articles'.`);

    // 2. Find and update in 'posts' collection
    const postsSnap = await db.collection('posts').where('title', '==', oldTitle).get();
    
    if (postsSnap.empty) {
      console.log("No matching post found in 'posts'.");
    } else {
      for (const d of postsSnap.docs) {
        await d.ref.update({ title: newTitle });
        console.log(`Updated post ${d.id} in 'posts'.`);
      }
    }

    console.log("Success: Title updated in both collections.");
  } catch (e) {
    console.error("Error updating title:", e);
  }
  process.exit(0);
}

updateTitle();
