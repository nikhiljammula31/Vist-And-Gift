import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Ensures a customer profile document exists in Cloud Firestore under `users/{userId}`.
 * 
 * - Verifies authenticated user validity.
 * - Uses the authenticated UID as the Firestore document ID.
 * - Reads before writing: if profile exists, preserves and returns existing profile data.
 * - Idempotent: avoids duplicate writes or overwriting returning user information.
 * - Strictly enforces `role: 'customer'`, rejecting any elevated/admin role inputs.
 * - Applies clean data types matching Firestore security rules.
 */
export const ensureUserProfile = async (firebaseUser, additionalData = {}) => {
  if (!firebaseUser || !firebaseUser.uid) {
    throw new Error('A valid authenticated user is required to initialize a profile.');
  }

  const userId = firebaseUser.uid;
  const userDocRef = doc(db, 'users', userId);

  // 1. Check if profile document already exists in Firestore
  try {
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      return { id: existingSnap.id, ...existingSnap.data() };
    }
  } catch (err) {
    console.warn(`Could not verify existing profile for ${userId}:`, err.message);
    if (err?.code === 'permission-denied') {
      throw err;
    }
  }

  // 2. Identify provider: detect Google OAuth vs Email/Password
  const isGoogle =
    additionalData.provider === 'google' ||
    firebaseUser.providerData?.some((p) => p.providerId === 'google.com');
  const provider = isGoogle ? 'google' : 'password';

  // 3. Normalize customer details
  const fullName = (
    additionalData.fullName ||
    firebaseUser.displayName ||
    'Customer'
  ).trim();

  const email = (
    firebaseUser.email ||
    additionalData.email ||
    ''
  ).trim().toLowerCase();

  const phone = (
    additionalData.phone ||
    firebaseUser.phoneNumber ||
    ''
  ).trim();

  const photoURL = firebaseUser.photoURL || null;

  // For Google users, account is verified by Google OAuth. For email/password, check user state.
  const emailVerified = isGoogle ? true : Boolean(firebaseUser.emailVerified);

  // 4. Construct Firestore user document
  const profileData = {
    uid: userId,
    fullName: fullName || 'Customer',
    email,
    phone: phone || null,
    photoURL,
    provider,
    role: 'customer', // Strictly enforce 'customer' role. Do not accept client overrides.
    emailVerified,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 5. Create document in Firestore
  await setDoc(userDocRef, profileData);

  return {
    id: userId,
    ...profileData,
  };
};

/**
 * Retrieves the customer profile from Firestore.
 */
export const getUserProfile = async (userId) => {
  if (!userId) return null;
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

