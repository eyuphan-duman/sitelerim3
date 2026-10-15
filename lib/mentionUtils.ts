import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sanitizeUsername } from '@/lib/usernameUtils';

export async function notifyMentions({
  text,
  postId,
  currentUser,
  userProfile
}: {
  text: string;
  postId: string;
  currentUser: any;
  userProfile?: any;
}) {
  if (!text || !currentUser || currentUser.isAnonymous) return;
  
  // Extract all @username mentions (plain English letters, numbers, underscore)
  const matches = text.match(/@([a-zA-Z0-9_]+)/g);
  if (!matches) return;

  const myUsername = sanitizeUsername(userProfile?.username || currentUser.displayName || '');
  
  // Get unique usernames, exclude own username
  const uniqueUsernames = Array.from(
    new Set(matches.map(m => sanitizeUsername(m)))
  ).filter(u => u && u !== myUsername);

  for (const uname of uniqueUsernames) {
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('username', '==', uname), limit(1))
      );
      if (!snap.empty) {
        const targetUserDoc = snap.docs[0];
        const targetUid = targetUserDoc.id;
        if (targetUid && targetUid !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            toUid: targetUid,
            fromUid: currentUser.uid,
            fromUser: userProfile?.displayName || currentUser.displayName || 'Kullanıcı',
            fromUsername: userProfile?.username || (currentUser.displayName || '').toLowerCase().replace(/\s+/g, '') || 'kullanici',
            fromPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
            type: 'mention',
            message: 'senden bahsetti.',
            postId: postId,
            postTitle: text.trim().slice(0, 60),
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      console.error('Error notifying mention for @' + uname, e);
    }
  }
}
