'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, updateProfile, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export interface PsychologistData {
  isPsychologist?: boolean;
  role?: string;
  psychologistStatus?: 'pending' | 'approved' | 'rejected' | 'none';
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
    const isPsychSignup = Boolean(psychData?.isPsychologist);

    const docData: any = {
      uid: u.uid,
      username: customUsername || u.displayName || u.email?.split('@')[0],
      displayName: psychData?.fullName || customUsername || u.displayName || '',
      email: u.email?.toLowerCase().trim() || '',
      photoURL: u.photoURL || '',
      role: isPsychSignup ? 'psychologist_pending' : (snap.exists() ? (snap.data().role || 'member') : 'member'),
      isPsychologist: false, // inactive until approved by admin
      psychologistStatus: isPsychSignup ? 'pending' : (snap.exists() ? (snap.data().psychologistStatus || 'none') : 'none'),
      title: psychData?.title || (isPsychSignup ? 'Psikolog' : ''),
      university: psychData?.university || '',
      diplomaUrl: psychData?.diplomaUrl || '',
    };

    if (!snap.exists()) {
      docData.createdAt = serverTimestamp();
      if (isPsychSignup) {
        docData.applicationDate = serverTimestamp();
      }
      await setDoc(ref, docData);
    } else {
      // Document already exists (e.g. created by onAuthStateChanged race condition)
      const updatePayload: any = {};
      if (customUsername && !snap.data().username) updatePayload.username = customUsername;
      if (psychData?.fullName) updatePayload.displayName = psychData.fullName;
      if (psychData?.diplomaUrl) updatePayload.diplomaUrl = psychData.diplomaUrl;
      if (psychData?.university) updatePayload.university = psychData.university;
      if (psychData?.title) updatePayload.title = psychData.title;
      if (isPsychSignup) {
        updatePayload.role = 'psychologist_pending';
        updatePayload.psychologistStatus = 'pending';
        updatePayload.applicationDate = serverTimestamp();
      }
      if (Object.keys(updatePayload).length > 0) {
        await updateDoc(ref, updatePayload);
      }
    }

    if (isPsychSignup) {
      await setDoc(doc(db, 'psychologist_applications', u.uid), {
        uid: u.uid,
        fullName: psychData?.fullName || customUsername || u.displayName || '',
        username: customUsername || '',
        email: u.email?.toLowerCase().trim() || '',
        title: psychData?.title || 'Psikolog',
        university: psychData?.university || '',
        diplomaUrl: psychData?.diplomaUrl || '',
        status: 'pending',
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  const signIn = async (usernameOrEmail: string, password: string) => {
    let authEmail = usernameOrEmail.trim();
    // Check if it's not an email, assume it's a username
    if (!authEmail.includes('@')) {
      const q = query(collection(db, 'users'), where('username', '==', authEmail.toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('Kullanıcı bulunamadı.');
      authEmail = snap.docs[0].data().email;
    }
    await signInWithEmailAndPassword(auth, authEmail, password);
  };

  const signUp = async (username: string, email: string, password: string, psychologistData?: PsychologistData) => {
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
    const cleanEmail = email.toLowerCase().trim();

    // 1. Kullanıcı adı kontrolü
    const userQ = query(collection(db, 'users'), where('username', '==', cleanUsername));
    const userSnap = await getDocs(userQ);
    if (!userSnap.empty) throw new Error('Bu kullanıcı adı zaten alınmış!');

    // 2. E-posta adresi kontrolü (Aynı maille 2. bir kayıt kesinlikle engellenir)
    const emailQ = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const emailSnap = await getDocs(emailQ);
    if (!emailSnap.empty) throw new Error('Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır!');

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const displayName = psychologistData?.fullName || username;
      await updateProfile(cred.user, { displayName });
      await createUserDocument(cred.user, cleanUsername, psychologistData);

      // Explicit write to guarantee psychologist application and diplomaUrl persist
      if (psychologistData?.isPsychologist) {
        const userDocRef = doc(db, 'users', cred.user.uid);
        await updateDoc(userDocRef, {
          diplomaUrl: psychologistData.diplomaUrl || '',
          university: psychologistData.university || '',
          title: psychologistData.title || 'Psikolog',
          role: 'psychologist_pending',
          psychologistStatus: 'pending',
          applicationDate: serverTimestamp(),
        });

        await setDoc(doc(db, 'psychologist_applications', cred.user.uid), {
          uid: cred.user.uid,
          fullName: displayName,
          username: cleanUsername,
          email: cleanEmail,
          title: psychologistData.title || 'Psikolog',
          university: psychologistData.university || '',
          diplomaUrl: psychologistData.diplomaUrl || '',
          status: 'pending',
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      // Update state immediately
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userSnap2 = await getDoc(userDocRef);
      if (userSnap2.exists()) {
        setUserProfile(userSnap2.data());
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır!');
      }
      throw err;
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
