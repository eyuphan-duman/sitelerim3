'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserCredential, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, updateProfile, signInAnonymously, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { sanitizeUsername, getUsernameValidationError } from '@/lib/usernameUtils';

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
  emailVerified: boolean;
  signIn: (usernameOrEmail: string, password: string) => Promise<UserCredential>;
  signUp: (username: string, email: string, password: string, psychologistData?: PsychologistData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithGoogle: (chosenUsername: string, termsAccepted: boolean) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  resetPassword: (usernameOrEmail: string) => Promise<string>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setEmailVerified(Boolean(u?.emailVerified));
      if (u) {
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          // Healing: If username is missing, set it now
          if (!data.username) {
            const fallbackUsername = (u.displayName || u.email?.split('@')[0] || 'user').toLowerCase().replace(/\s+/g, '');
            try {
              await updateDoc(ref, { username: fallbackUsername });
            } catch {}
            data.username = fallbackUsername;
          }

          const isAdmin = ADMIN_EMAILS.includes(u.email?.toLowerCase() || '');
          if (isAdmin) {
            if (!data.isPsychologist || data.psychologistStatus !== 'approved' || data.role !== 'psychologist') {
              try {
                await updateDoc(ref, {
                  isPsychologist: true,
                  psychologistStatus: 'approved',
                  role: 'psychologist',
                  title: data.title || 'Psikolog',
                });
                data.isPsychologist = true;
                data.psychologistStatus = 'approved';
                data.role = 'psychologist';
                data.title = data.title || 'Psikolog';
              } catch (e) {
                console.error('Error auto-updating admin psychologist status:', e);
              }
            }
          }
          setUserProfile(data);
        } else {
          // If no doc in Firestore, do NOT auto-create a member doc here without user registration/terms!
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Handle redirect result if signInWithRedirect was used (e.g. mobile or popup-blocked browsers)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const ref = doc(db, 'users', result.user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setUserProfile(snap.data());
          }
        }
      })
      .catch((err) => {
        // Ignore expected or empty redirect errors
        if (err?.code !== 'auth/credential-already-in-use') {
          console.warn('Firebase getRedirectResult info:', err?.message || err);
        }
      });
  }, []);

  const createUserDocument = async (u: User, customUsername?: string, psychData?: PsychologistData) => {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const isPsychSignup = Boolean(psychData?.isPsychologist);
    const rawUname = customUsername || u.displayName || u.email?.split('@')[0] || 'kullanici';
    let cleanUname = sanitizeUsername(rawUname);
    if (!cleanUname || cleanUname.length < 3) {
      cleanUname = `user_${u.uid.slice(0, 6).toLowerCase()}`;
    }

    // Ensure username uniqueness if new document or if existing doc has no username
    if (!snap.exists() || !snap.data().username) {
      try {
        const existingQ = query(collection(db, 'users'), where('username', '==', cleanUname));
        const existingSnap = await getDocs(existingQ);
        const isTakenByOther = existingSnap.docs.some((d) => d.id !== u.uid);
        if (isTakenByOther) {
          cleanUname = `${cleanUname.slice(0, 18)}_${Math.floor(1000 + Math.random() * 9000)}`;
        }
      } catch (err) {
        console.warn('Username check notice:', err);
      }
    }

    const docData: any = {
      uid: u.uid,
      username: cleanUname,
      displayName: psychData?.fullName || customUsername || u.displayName || cleanUname,
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
      if (cleanUname && !snap.data().username) updatePayload.username = cleanUname;
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
        username: cleanUname,
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
      const cleanUname = sanitizeUsername(authEmail);
      const q = query(collection(db, 'users'), where('username', '==', cleanUname));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('Kullanıcı bulunamadı.');
      authEmail = snap.docs[0].data().email;
    }
    const cred = await signInWithEmailAndPassword(auth, authEmail, password);
    return cred;
  };

  const signUp = async (username: string, email: string, password: string, psychologistData?: PsychologistData) => {
    // 0. Sade İngilizce karakter kontrolü
    const validationError = getUsernameValidationError(username);
    if (validationError) {
      throw new Error(validationError);
    }

    const cleanUsername = sanitizeUsername(username);
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
      const displayName = psychologistData?.fullName || cleanUsername;
      await updateProfile(cred.user, { displayName });
      await createUserDocument(cred.user, cleanUsername, psychologistData);
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.error('Error sending verification email:', e);
      }

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

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result?.user) return;

      const userDocRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        // User has NOT completed registration in our system yet!
        const googleEmail = result.user.email || '';
        const googleName = result.user.displayName || '';
        await signOut(auth);

        const notRegError: any = new Error('NOT_REGISTERED');
        notRegError.code = 'auth/user-not-registered';
        notRegError.email = googleEmail;
        notRegError.displayName = googleName;
        throw notRegError;
      }

      setUserProfile(snap.data());
    } catch (err: any) {
      console.warn('Google signInWithPopup error code:', err?.code, err?.message);
      if (err.code === 'auth/popup-blocked') {
        console.info('Falling back to signInWithRedirect due to popup-blocked');
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  const signUpWithGoogle = async (chosenUsername: string, termsAccepted: boolean): Promise<void> => {
    if (!termsAccepted) {
      throw new Error('Lütfen kayıt sözleşmesini ve KVKK aydınlatma metnini onaylayın.');
    }

    const validationError = getUsernameValidationError(chosenUsername);
    if (validationError) {
      throw new Error(validationError);
    }

    const cleanUsername = sanitizeUsername(chosenUsername);
    const userQ = query(collection(db, 'users'), where('username', '==', cleanUsername));
    const userSnap = await getDocs(userQ);
    if (!userSnap.empty) {
      throw new Error('Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı belirleyin.');
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result?.user) return;

      const userDocRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        // Already registered previously, just set user profile
        setUserProfile(snap.data());
        return;
      }

      // Create new profile with the user-chosen username & terms
      await createUserDocument(result.user, cleanUsername);

      // Send verification email to user's Google email address
      try {
        await sendEmailVerification(result.user);
      } catch (e) {
        console.warn('sendEmailVerification on Google user:', e);
      }

      // Refresh local profile state
      const newSnap = await getDoc(userDocRef);
      if (newSnap.exists()) {
        setUserProfile(newSnap.data());
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  const signInAsGuest = async () => {
    const result = await signInAnonymously(auth);
    // Optional: No user doc for true guests, or create a thin one
  };

  const resetPassword = async (usernameOrEmail: string): Promise<string> => {
    let authEmail = usernameOrEmail.trim();
    if (!authEmail) {
      throw new Error('Lütfen kullanıcı adı veya e-posta adresinizi girin.');
    }
    // Check if it's not an email, assume it's a username
    if (!authEmail.includes('@')) {
      const q = query(collection(db, 'users'), where('username', '==', authEmail.toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error('Bu kullanıcı adına ait kayıtlı bir hesap bulunamadı.');
      }
      authEmail = snap.docs[0].data().email;
      if (!authEmail) {
        throw new Error('Bu hesaba ait tanımlı bir e-posta adresi bulunamadı.');
      }
    }
    await sendPasswordResetEmail(auth, authEmail);
    return authEmail;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('Önce giriş yapmalısınız.');
    if (auth.currentUser.emailVerified) throw new Error('E-posta adresiniz zaten doğrulanmış.');
    await sendEmailVerification(auth.currentUser);
  };

  // Firebase caches emailVerified on the ID token; reload + force token refresh
  // so the app (and Firestore rules) see verification status right after the user confirms it.
  const refreshEmailVerification = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const verified = Boolean(auth.currentUser.emailVerified);
    setEmailVerified(verified);
    return verified;
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, emailVerified, signIn, signUp, signInWithGoogle, signUpWithGoogle, signInAsGuest, resetPassword, resendVerificationEmail, refreshEmailVerification, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
