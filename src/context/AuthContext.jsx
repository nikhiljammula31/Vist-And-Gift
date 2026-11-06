import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getAdditionalUserInfo,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { ensureUserProfile } from '../firebase/userService';
import {
  createNotification,
  createAdminNotification,
  NOTIFICATION_TYPES,
} from '../firebase/notificationService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAdminClaim, setIsAdminClaim] = useState(false);
  const profileListenerRef = useRef(null);

  // Derive administrative status strictly from trusted custom claims or trusted Firestore role
  const isAdmin = useMemo(() => {
    if (loading || !currentUser) return false;
    return Boolean(isAdminClaim || userProfile?.role === 'admin');
  }, [loading, currentUser, isAdminClaim, userProfile?.role]);

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (profileListenerRef.current) {
        profileListenerRef.current();
        profileListenerRef.current = null;
      }

      if (user) {
        setCurrentUser(user);
        setIsEmailVerified(Boolean(user.emailVerified));

        // Check for trusted custom admin claims from Firebase Auth token
        user.getIdTokenResult().then((tokenResult) => {
          setIsAdminClaim(Boolean(tokenResult?.claims?.admin));
        }).catch(() => {
          setIsAdminClaim(false);
        });

        // Realtime Firestore profile listener
        const userDocRef = doc(db, 'users', user.uid);
        profileListenerRef.current = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data());
              setLoading(false);
            } else {
              // Profile doc doesn't exist yet (e.g. initial Google sign-in flow)
              // Attempt to ensure profile creation safely
              ensureUserProfile(user)
                .then((prof) => {
                  setUserProfile(prof);
                  setLoading(false);
                })
                .catch((err) => {
                  console.warn('Deferred profile initialization in auth listener:', err.message);
                  setUserProfile({
                    uid: user.uid,
                    fullName: user.displayName || 'Customer',
                    email: user.email,
                    phone: user.phoneNumber || '',
                    photoURL: user.photoURL || null,
                    role: 'customer',
                    provider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'password',
                    emailVerified: Boolean(user.emailVerified),
                  });
                  setLoading(false);
                });
            }
          },
          (error) => {
            if (error?.code === 'permission-denied') {
              console.warn('Profile listener closed due to permission state change');
            } else {
              console.error('Error listening to user profile:', error);
            }
            // Fallback profile if Firestore read is restricted
            setUserProfile({
              uid: user.uid,
              fullName: user.displayName || 'Customer',
              email: user.email,
              phone: user.phoneNumber || '',
              photoURL: user.photoURL || null,
              role: 'customer',
              provider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'password',
              emailVerified: Boolean(user.emailVerified),
            });
            setLoading(false);
          }
        );
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsEmailVerified(false);
        setIsAdminClaim(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (profileListenerRef.current) {
        profileListenerRef.current();
        profileListenerRef.current = null;
      }
    };
  }, []);

  /**
   * Log in using email and password with configurable persistence (Remember Me).
   */
  const login = async (email, password, rememberMe = true) => {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    
    // Refresh user state
    if (userCredential.user) {
      setIsEmailVerified(Boolean(userCredential.user.emailVerified));
    }
    return userCredential;
  };

  /**
   * Register a new customer with Email & Password.
   * Creates Firestore profile and sends email verification.
   * Includes recoverable retry handling so existing auth sessions can retry profile creation.
   */
  const signup = async ({ fullName, email, phone, password }) => {
    let user = auth.currentUser;

    // 1. If auth session does not already exist for this exact email, create authentication record
    if (!user || user.email?.toLowerCase() !== email.trim().toLowerCase()) {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      user = userCredential.user;

      // Update Firebase Auth displayName
      await updateProfile(user, {
        displayName: fullName.trim(),
      });
    } else {
      // Retrying with existing auth session: update displayName if needed
      if (user.displayName !== fullName.trim()) {
        await updateProfile(user, {
          displayName: fullName.trim(),
        });
      }
    }

    // 2. Create customer profile in Firestore via reusable ensureUserProfile service
    const profile = await ensureUserProfile(user, {
      fullName,
      email,
      phone,
      provider: 'password',
    });

    // 3. Send email verification using existing verification flow
    try {
      await sendEmailVerification(user);
    } catch (verifErr) {
      console.warn('Email verification dispatch notice:', verifErr.message);
    }

    // 4. Dispatch Welcome & Registration Notifications
    try {
      await Promise.all([
        createNotification(user.uid, {
          id: `account_welcome_${user.uid}`,
          title: 'Welcome to Visit & Gift!',
          message: `Welcome, ${fullName?.trim() || 'valued customer'}! Thank you for joining Visit & Gift. Explore our bespoke handcrafted gifts and custom presents.`,
          type: NOTIFICATION_TYPES.ACCOUNT,
        }),
        createAdminNotification({
          id: `admin_user_${user.uid}`,
          title: 'New Customer Registered',
          message: `${fullName?.trim() || 'New Customer'} (${email.trim()}) registered an account.`,
          type: NOTIFICATION_TYPES.ACCOUNT,
          relatedUserId: user.uid,
          metadata: {
            userId: user.uid,
            email: email.trim(),
            fullName: fullName?.trim() || 'Customer',
          },
        }),
      ]);
    } catch (notifErr) {
      console.warn('Welcome notification notice:', notifErr?.message || notifErr);
    }

    // 5. Update local state
    setCurrentUser(user);
    setUserProfile(profile);
    setIsEmailVerified(Boolean(user.emailVerified));

    return { user };
  };

  /**
   * Google Sign-in with popup.
   * Ensures Firestore user profile is initialized without overwriting existing customer information.
   */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // Enforce local persistence for Google sign-in by default
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Detect if this is the user's first sign-in using getAdditionalUserInfo
    const additionalInfo = getAdditionalUserInfo(userCredential);
    const isNewUser = Boolean(additionalInfo?.isNewUser);

    // Initialize or load customer profile using reusable service
    const profile = await ensureUserProfile(user, {
      provider: 'google',
      isNewUser,
    });

    setCurrentUser(user);
    setUserProfile(profile);
    setIsEmailVerified(Boolean(user.emailVerified || profile?.emailVerified));

    return userCredential;
  };

  /**
   * Send password reset email.
   */
  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email.trim());
  };

  /**
   * Resend verification email to current user.
   */
  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in.');
    }
    await sendEmailVerification(auth.currentUser);
  };

  /**
   * Reload current user to check verification status.
   */
  const checkEmailVerification = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = Boolean(auth.currentUser.emailVerified);
    setIsEmailVerified(verified);

    if (verified) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(
          userDocRef,
          {
            emailVerified: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        await createNotification(auth.currentUser.uid, {
          id: `account_verified_${auth.currentUser.uid}`,
          title: 'Email Verified Successfully',
          message: 'Your email address has been verified. You now have full access to your account and orders.',
          type: NOTIFICATION_TYPES.ACCOUNT,
        });
      } catch (err) {
        console.warn('Could not sync verification to Firestore:', err);
      }
    }
    return verified;
  };

  /**
   * Sign out current user.
   */
  const logout = async () => {
    // Unsubscribe Firestore profile listener synchronously before invalidating auth token
    if (profileListenerRef.current) {
      profileListenerRef.current();
      profileListenerRef.current = null;
    }
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsEmailVerified(false);
    setIsAdminClaim(false);
  };

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      isEmailVerified,
      isAdmin,
      login,
      signup,
      loginWithGoogle,
      logout,
      resetPassword,
      resendVerificationEmail,
      checkEmailVerification,
    }),
    [currentUser, userProfile, loading, isEmailVerified, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

