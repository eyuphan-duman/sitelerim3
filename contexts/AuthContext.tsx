'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, UserCredential, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, EmailAuthProvider, linkWithCredential, signOut, updateProfile, signInAnonymously, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { sanitizeUsername, getUsernameValidationError } from '@/lib/usernameUtils';
import { getBirthDateValidationError } from '@/lib/ageUtils';

export interface UserRegistrationData {
  fullName?: string;
  birthDate?: string;
  isPsychologist?: boolean;
  role?: string;
  psychologistStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  title?: string;
  university?: string;
  diplomaUrl?: string;
}

export type PsychologistData = UserRegistrationData;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile?: any;
  emailVerified: boolean;
  signIn: (usernameOrEmail: string, password: string) => Promise<UserCredential>;
  signUp: (username: string, email: string, password: string, extraData?: UserRegistrationData) => Promise<void>;
  startGoogleSignup: () => Promise<{ email: string; displayName: string }>;
  completeGoogleSignup: (chosenUsername: string, password: string, termsAccepted: boolean, extraData?: UserRegistrationData) => Promise<void>;
  cancelGoogleSignup: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  resetPassword: (usernameOrEmail: string) => Promise<string>;
  resendVerificationEmail: () => Promise<void>;
  resendVerificationByCredentials: (usernameOrEmail: string, password?: string) => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

const getActionCodeSettings = () => {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://www.pskfurkanmanav.com';
  return {
    url: `${origin}/auth/verify`,
    handleCodeInApp: true,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  // True while a Google signup is between the popup and the final profile creation
  const googleSignupRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      const userEmail = (u?.email || '').toLowerCase().trim();
      const isAdminEmail = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === userEmail);

      // Force sign-out for any unverified non-admin user so unverified sessions cannot persist
      if (u && !u.isAnonymous && !u.emailVerified && !isAdminEmail && !googleSignupRef.current) {
        try { await signOut(auth); } catch {}
        setUser(null);
        setUserProfile(null);
        setEmailVerified(false);
        setLoading(false);
        return;
      }

      setUser(u);
      setEmailVerified(Boolean(u?.emailVerified) || isAdminEmail);
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

          const isAdmin = isAdminEmail || data.role === 'admin';
          if (isAdmin) {
            setEmailVerified(true);
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
          // Never auto-create a profile without registration/terms.
          setUserProfile(null);
          // A Google session without a profile means an abandoned signup: close it.
          const isGoogleUser = u.providerData.some((p) => p.providerId === 'google.com');
          if (isGoogleUser && !u.isAnonymous && !googleSignupRef.current) {
            try { await signOut(auth); } catch {}
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const createUserDocument = async (u: User, customUsername?: string, extraData?: UserRegistrationData) => {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const isPsychSignup = Boolean(extraData?.isPsychologist);
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
      displayName: extraData?.fullName || customUsername || u.displayName || cleanUname,
      fullName: extraData?.fullName || '',
      birthDate: extraData?.birthDate || '',
      email: u.email?.toLowerCase().trim() || '',
      photoURL: u.photoURL || '',
      role: isPsychSignup ? 'psychologist_pending' : (snap.exists() ? (snap.data().role || 'member') : 'member'),
      isPsychologist: false, // inactive until approved by admin
      psychologistStatus: isPsychSignup ? 'pending' : (snap.exists() ? (snap.data().psychologistStatus || 'none') : 'none'),
      title: extraData?.title || (isPsychSignup ? 'Psikolog' : ''),
      university: extraData?.university || '',
      diplomaUrl: extraData?.diplomaUrl || '',
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
      if (extraData?.fullName) {
        updatePayload.fullName = extraData.fullName;
        updatePayload.displayName = extraData.fullName;
      }
      if (extraData?.birthDate) {
        updatePayload.birthDate = extraData.birthDate;
      }
      if (extraData?.diplomaUrl) updatePayload.diplomaUrl = extraData.diplomaUrl;
      if (extraData?.university) updatePayload.university = extraData.university;
      if (extraData?.title) updatePayload.title = extraData.title;
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
        fullName: extraData?.fullName || customUsername || u.displayName || '',
        username: cleanUname,
        email: u.email?.toLowerCase().trim() || '',
        title: extraData?.title || 'Psikolog',
        university: extraData?.university || '',
        diplomaUrl: extraData?.diplomaUrl || '',
        birthDate: extraData?.birthDate || '',
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
    const userEmail = (cred.user.email || '').toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === userEmail);

    if (!cred.user.emailVerified && !isAdmin) {
      await signOut(auth);
      const err: any = new Error(`E-posta adresiniz (${cred.user.email}) henüz doğrulanmamış. Üyeliğinizi tamamlamak için lütfen gelen kutunuzu ve spam (gereksiz) klasörünüzü kontrol ediniz; doğrulama maili oraya gitmektedir.`);
      err.code = 'auth/unverified-email';
      err.email = cred.user.email;
      throw err;
    }

    return cred;
  };

  const signUp = async (username: string, email: string, password: string, extraData?: UserRegistrationData) => {
    // 0. Sade İngilizce karakter kontrolü
    const validationError = getUsernameValidationError(username);
    if (validationError) {
      throw new Error(validationError);
    }

    if (extraData?.birthDate) {
      const ageErr = getBirthDateValidationError(extraData.birthDate);
      if (ageErr) throw new Error(ageErr);
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
      const displayName = extraData?.fullName || cleanUsername;
      await updateProfile(cred.user, { displayName });
      await createUserDocument(cred.user, cleanUsername, extraData);
      try {
        await sendEmailVerification(cred.user, getActionCodeSettings());
      } catch (e) {
        console.error('Error sending verification email:', e);
      }

      // Explicit write to guarantee psychologist application and diplomaUrl persist
      if (extraData?.isPsychologist) {
        const userDocRef = doc(db, 'users', cred.user.uid);
        await updateDoc(userDocRef, {
          diplomaUrl: extraData.diplomaUrl || '',
          university: extraData.university || '',
          title: extraData.title || 'Psikolog',
          role: 'psychologist_pending',
          psychologistStatus: 'pending',
          applicationDate: serverTimestamp(),
          fullName: extraData.fullName || displayName,
          birthDate: extraData.birthDate || '',
        });

        await setDoc(doc(db, 'psychologist_applications', cred.user.uid), {
          uid: cred.user.uid,
          fullName: displayName,
          username: cleanUsername,
          email: cleanEmail,
          title: extraData.title || 'Psikolog',
          university: extraData.university || '',
          diplomaUrl: extraData.diplomaUrl || '',
          birthDate: extraData.birthDate || '',
          status: 'pending',
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      const isAdmin = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === cleanEmail);
      if (!isAdmin) {
        // Sign out immediately: membership is not complete until email verification
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        setEmailVerified(false);
      } else {
        // Update state immediately for admin
        const userDocRef = doc(db, 'users', cred.user.uid);
        const userSnap2 = await getDoc(userDocRef);
        if (userSnap2.exists()) {
          setUserProfile(userSnap2.data());
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır!');
      }
      throw err;
    }
  };

  // Step 1: open the Google popup immediately (must run inside the click handler
  // without any awaited work before it, otherwise browsers delay or block the popup).
  const startGoogleSignup = async (): Promise<{ email: string; displayName: string }> => {
    googleSignupRef.current = true;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, 'users', result.user.uid));
      if (snap.exists()) {
        googleSignupRef.current = false;
        await signOut(auth);
        const err: any = new Error('Bu Google hesabıyla zaten kayıt olunmuş. Lütfen kullanıcı adı veya e-posta ve şifrenle giriş yap.');
        err.code = 'auth/already-registered';
        throw err;
      }
      return { email: result.user.email || '', displayName: result.user.displayName || '' };
    } catch (err) {
      googleSignupRef.current = false;
      throw err;
    }
  };

  // Step 2: username + password + terms, then the profile is created.
  const completeGoogleSignup = async (chosenUsername: string, password: string, termsAccepted: boolean, extraData?: UserRegistrationData): Promise<void> => {
    const current = auth.currentUser;
    if (!current || !current.email) {
      throw new Error('Google oturumu bulunamadı. Lütfen tekrar deneyin.');
    }
    const validationError = getUsernameValidationError(chosenUsername);
    if (validationError) throw new Error(validationError);
    if (extraData?.birthDate) {
      const ageErr = getBirthDateValidationError(extraData.birthDate);
      if (ageErr) throw new Error(ageErr);
    }
    if (!password || password.length < 6) throw new Error('Şifre en az 6 karakter olmalıdır.');
    if (!termsAccepted) throw new Error('Lütfen kullanıcı sözleşmesini ve KVKK metnini onaylayın.');

    const cleanUsername = sanitizeUsername(chosenUsername);
    const taken = await getDocs(query(collection(db, 'users'), where('username', '==', cleanUsername)));
    if (!taken.empty) {
      throw new Error('Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı belirleyin.');
    }

    // Add an email/password credential so the user can log in with username/email + password
    const alreadyHasPassword = current.providerData.some((p) => p.providerId === 'password');
    if (!alreadyHasPassword) {
      await linkWithCredential(current, EmailAuthProvider.credential(current.email, password));
    }

    if (extraData?.fullName) {
      try {
        await updateProfile(current, { displayName: extraData.fullName });
      } catch {}
    }

    await createUserDocument(current, cleanUsername, extraData);

    const userEmail = (current.email || '').toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === userEmail);

    if (!current.emailVerified && !isAdmin) {
      try { await sendEmailVerification(current, getActionCodeSettings()); } catch (e) { console.warn('sendEmailVerification:', e); }
      googleSignupRef.current = false;
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setEmailVerified(false);
      const err: any = new Error(`E-posta adresinize (${current.email}) doğrulama bağlantısı gönderildi. Lütfen gelen kutunuzu ve spam (gereksiz) klasörünüzü kontrol ediniz; e-postanızı onayladıktan sonra giriş yapabilirsiniz.`);
      err.code = 'auth/unverified-email';
      throw err;
    }

    googleSignupRef.current = false;
    const newSnap = await getDoc(doc(db, 'users', current.uid));
    if (newSnap.exists()) setUserProfile(newSnap.data());
    setEmailVerified(Boolean(current.emailVerified) || isAdmin);
  };

  const cancelGoogleSignup = async (): Promise<void> => {
    googleSignupRef.current = false;
    const current = auth.currentUser;
    if (!current) return;
    const snap = await getDoc(doc(db, 'users', current.uid));
    if (!snap.exists()) await signOut(auth);
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
    await sendEmailVerification(auth.currentUser, getActionCodeSettings());
  };

  const resendVerificationByCredentials = async (usernameOrEmail: string, password?: string): Promise<void> => {
    let authEmail = usernameOrEmail.trim();
    if (!authEmail.includes('@')) {
      const cleanUname = sanitizeUsername(authEmail);
      const q = query(collection(db, 'users'), where('username', '==', cleanUname));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('Kullanıcı bulunamadı.');
      authEmail = snap.docs[0].data().email;
    }
    if (!password) {
      throw new Error('Doğrulama bağlantısını tekrar göndermek için lütfen şifrenizi girin.');
    }
    const cred = await signInWithEmailAndPassword(auth, authEmail, password);
    try {
      await sendEmailVerification(cred.user, getActionCodeSettings());
    } finally {
      await signOut(auth);
    }
  };

  // Firebase caches emailVerified on the ID token; reload + force token refresh
  // so the app (and Firestore rules) see verification status right after the user confirms it.
  const refreshEmailVerification = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const userEmail = (auth.currentUser.email || '').toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === userEmail) || userProfile?.role === 'admin';
    const verified = Boolean(auth.currentUser.emailVerified) || isAdmin;
    setEmailVerified(verified);
    return verified;
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, emailVerified, signIn, signUp, startGoogleSignup, completeGoogleSignup, cancelGoogleSignup, signInAsGuest, resetPassword, resendVerificationEmail, resendVerificationByCredentials, refreshEmailVerification, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
