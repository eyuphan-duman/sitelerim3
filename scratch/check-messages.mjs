import admin from 'firebase-admin';

try {
  admin.initializeApp({
    projectId: 'manav-platform'
  });
} catch (e) {
  console.log("Initialization already done or failed.");
}

const db = admin.firestore();

async function check() {
  try {
    console.log("Fetching latest messages from Firestore...");
    const snap = await db.collection('messages').orderBy('createdAt', 'desc').limit(5).get();
    
    if (snap.empty) {
      console.log("No messages found.");
      process.exit(0);
    }

    snap.forEach(doc => {
      const data = doc.data();
      console.log(`\n--- Message ID: ${doc.id} ---`);
      console.log(`Name: ${data.name}`);
      console.log(`Email: ${data.email}`);
      console.log(`Subject: ${data.subject}`);
      console.log(`Message: ${data.message}`);
      console.log(`Created At: ${data.createdAt ? data.createdAt.toDate().toLocaleString() : 'N/A'}`);
      console.log(`Status: ${data.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error reading messages:", error);
    process.exit(1);
  }
}

check();
