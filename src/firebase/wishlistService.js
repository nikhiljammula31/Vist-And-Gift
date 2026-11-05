import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Normalizes product price to a pure numeric value (in INR).
 * E.g., '₹199' -> 199, 199 -> 199.
 */
export const normalizePrice = (price) => {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  const num = Number(String(price).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

/**
 * Adds a product to the user's wishlist in Firestore:
 * Document path: users/{userId}/wishlist/{productId}
 */
export const addToWishlistService = async (userId, product) => {
  if (!userId) throw new Error('User ID is required to add to wishlist');
  if (!product || product.id === undefined || product.id === null) {
    throw new Error('Valid product with ID is required');
  }

  const productId = String(product.id).trim();
  const wishlistDocRef = doc(db, 'users', userId, 'wishlist', productId);

  // Check if item already exists to ensure idempotency and avoid unnecessary writes
  const existingDoc = await getDoc(wishlistDocRef);
  if (existingDoc.exists()) {
    return {
      id: existingDoc.id,
      ...existingDoc.data(),
    };
  }

  const wishlistItem = {
    productId,
    productName: String(product.name || 'Custom Gift').slice(0, 200),
    productImage: typeof product.image === 'string' ? product.image : '',
    priceAtSave: normalizePrice(product.price),
    category: String(product.category || 'General').slice(0, 100),
    addedAt: serverTimestamp(),
  };

  await setDoc(wishlistDocRef, wishlistItem);
  return wishlistItem;
};

/**
 * Removes a product from the user's wishlist in Firestore.
 */
export const removeFromWishlistService = async (userId, productId) => {
  if (!userId) throw new Error('User ID is required to remove from wishlist');
  if (productId === undefined || productId === null) {
    throw new Error('Product ID is required');
  }

  const strId = String(productId).trim();
  const wishlistDocRef = doc(db, 'users', userId, 'wishlist', strId);
  await deleteDoc(wishlistDocRef);
};

/**
 * Fetches all wishlist items for a given user.
 */
export const getWishlistService = async (userId) => {
  if (!userId) return [];
  const wishlistColRef = collection(db, 'users', userId, 'wishlist');
  const snapshot = await getDocs(wishlistColRef);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

/**
 * Listens in real-time to the user's wishlist.
 */
export const subscribeWishlistService = (userId, onUpdate, onError) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const wishlistColRef = collection(db, 'users', userId, 'wishlist');
  return onSnapshot(
    wishlistColRef,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onUpdate(items);
    },
    (error) => {
      if (error?.code !== 'permission-denied') {
        console.error('Wishlist subscription error:', error);
      }
      if (onError) onError(error);
    }
  );
};

