'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, updateProfile, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export interface PsychologistData {
  isPsychologist?: boolean;
  role?: string;
  title?: string;
  university?: string;
  diplomaUrl?: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile?: any;
  signIn: (usernameOrEmail: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string, psychologistData?: PsychologistData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          // Healing: If username is missing, set it now
          if (!data.username) {
            const fallbackUsername = (u.displayName || u.email?.split('@')[0] || 'user').toLowerCase().replace(/\s+/g, '');
            await updateDoc(ref, { username: fallbackUsername });
            data.username = fallbackUsername;
          }
          setUserProfile(data);
        } else {
          // If no doc at all, create one
          await createUserDocument(u);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const createUserDocument = async (u: User, customUsername?: string, psychData?: PsychologistData) => {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: u.uid,
        username: customUsername || u.displayName || u.email?.split('@')[0],
        displayName: psychData?.fullName || customUsername || u.displayName || '',
        email: u.email,
        photoURL: u.photoURL || '',
        createdAt: serverTimestamp(),
        role: psychData?.isPsychologist ? 'psychologist' : 'member',
        isPsychologist: Boolean(psychData?.isPsychologist),
        title: psychData?.title || (psychData?.isPsychologist ? 'Psikolog' : ''),
        university: psychData?.university || '',
        diplomaUrl: psychData?.diplomaUrl || '',
      });
    }
  };

  const signIn = async (usernameOrEmail: string, password: string) => {
    let authEmail = usernameOrEmail;
    // Check if it's not an email, assume it's a username
    if (!usernameOrEmail.includes('@')) {
      const q = query(collection(db, 'users'), where('username', '==', usernameOrEmail));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('Kullanıcı bulunamadı.');
      authEmail = snap.docs[0].data().email;
    }
    await signInWithEmailAndPassword(auth, authEmail, password);
  };

  const signUp = async (username: string, email: string, password: string, psychologistData?: PsychologistData) => {
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
    const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error('Bu kullanıcı adı zaten alınmış!');

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = psychologistData?.fullName || username;
    await updateProfile(cred.user, { displayName });
    await createUserDocument(cred.user, cleanUsername, psychologistData);

    // Update state immediately
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      setUserProfile(userSnap.data());
    }
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
  };

  const signInAsGuest = async () => {
    const result = await signInAnonymously(auth);
    // Optional: No user doc for true guests, or create a thin one
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, signInWithGoogle, signInAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
