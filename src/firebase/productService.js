import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { PRODUCTS as STATIC_PRODUCTS, CATEGORIES as STATIC_CATEGORIES } from '../data/products.js';

export const CATEGORIES = STATIC_CATEGORIES;
export const DEFAULT_CATEGORIES = STATIC_CATEGORIES.filter((c) => c !== 'All');

/**
 * Normalizes price to numeric value.
 */
export const normalizeProductPrice = (price) => {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  const num = Number(String(price).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

/**
 * Formats numeric price to standard Indian Rupee string.
 */
export const formatProductPrice = (price) => {
  const num = normalizeProductPrice(price);
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Validates and processes an image File from local upload.
 * Generates an optimized Data URL preview and persistent image representation.
 */
export const processProductImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file selected.'));
    }
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please upload an image file (JPEG, PNG, WebP).'));
    }
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error('Image file size must be less than 5MB.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimize image resolution (max 800px dimension) for snappy web delivery
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to decode image data.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Retrieves all categories dynamically from Firestore.
 * Automatically seeds default categories if collection is unpopulated.
 */
export const getAllCategories = async () => {
  try {
    const catRef = collection(db, 'categories');
    const snapshot = await getDocs(catRef);

    if (snapshot.empty) {
      // Seed default categories into Firestore
      for (const name of DEFAULT_CATEGORIES) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const docRef = doc(db, 'categories', slug);
        await setDoc(docRef, {
          id: slug,
          name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      return ['All', ...DEFAULT_CATEGORIES];
    }

    const catNames = snapshot.docs
      .map((d) => d.data().name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return ['All', ...catNames];
  } catch (err) {
    console.warn('Could not load categories from Firestore, using fallback:', err.message);
    return STATIC_CATEGORIES;
  }
};

/**
 * Subscribes to dynamic categories in Firestore.
 */
export const subscribeToCategories = (onData, onError) => {
  try {
    const catRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(
      catRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const catNames = snapshot.docs
            .map((d) => d.data().name)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
          onData(['All', ...catNames]);
        } else {
          onData(STATIC_CATEGORIES);
        }
      },
      (err) => {
        console.warn('Categories subscription error, using static list:', err.message);
        if (onError) onError(err);
        onData(STATIC_CATEGORIES);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to subscribe to categories:', err.message);
    if (onError) onError(err);
    onData(STATIC_CATEGORIES);
    return () => {};
  }
};

/**
 * Creates a new category in Firestore.
 */
export const createCategory = async (categoryName) => {
  if (!categoryName || !categoryName.trim()) {
    throw new Error('Category name is required.');
  }

  const cleanName = categoryName.trim();
  if (cleanName.length < 2 || cleanName.length > 50) {
    throw new Error('Category name must be between 2 and 50 characters.');
  }

  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!slug) {
    throw new Error('Invalid category name.');
  }

  // Check if category already exists
  const catDocRef = doc(db, 'categories', slug);
  const existing = await getDoc(catDocRef);
  if (existing.exists()) {
    throw new Error(`Category "${cleanName}" already exists.`);
  }

  await setDoc(catDocRef, {
    id: slug,
    name: cleanName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: slug, name: cleanName };
};

/**
 * Deletes a category from Firestore.
 * Prevents deletion if any products are currently assigned to this category.
 */
export const deleteCategory = async (categoryName) => {
  if (!categoryName) throw new Error('Category name is required.');
  const cleanName = categoryName.trim();

  // 1. Guard check: Query products collection to prevent orphaned category deletion
  const prodRef = collection(db, 'products');
  const q = query(prodRef, where('category', '==', cleanName));
  const productSnap = await getDocs(q);

  if (!productSnap.empty) {
    throw new Error(
      `Cannot delete category "${cleanName}" because it is currently assigned to ${productSnap.size} product(s). Please reassign those products first.`
    );
  }

  // 2. Locate document in categories collection
  const catRef = collection(db, 'categories');
  const catSnap = await getDocs(catRef);
  let targetDocId = null;

  catSnap.forEach((d) => {
    if (d.data().name?.toLowerCase() === cleanName.toLowerCase() || d.id === cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      targetDocId = d.id;
    }
  });

  if (targetDocId) {
    await deleteDoc(doc(db, 'categories', targetDocId));
    return { success: true, name: cleanName };
  }

  throw new Error(`Category "${cleanName}" not found in Firestore.`);
};

/**
 * Maps a Firestore document snapshot to a normalized product object.
 */
export const mapFirestoreProduct = (docSnap) => {
  const data = docSnap.data();
  const rawPrice = data.price;
  const numPrice = normalizeProductPrice(rawPrice);
  const formattedPrice = formatProductPrice(numPrice);

  return {
    id: docSnap.id,
    productId: docSnap.id,
    name: data.name || 'Gift Item',
    category: data.category || 'General',
    price: formattedPrice,
    numericPrice: numPrice,
    rating: typeof data.rating === 'number' ? data.rating : 4.8,
    image: data.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
    description: data.description || 'Customized luxury gift creation.',
    features: Array.isArray(data.features) ? data.features : [],
    specifications: data.specifications || {},
    available: data.available !== false,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

/**
 * Sorts products deterministically by numeric ID or string ID.
 */
export const sortProducts = (items) => {
  return [...items].sort((a, b) => {
    const numA = Number(a.id);
    const numB = Number(b.id);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return String(a.id).localeCompare(String(b.id));
  });
};

/**
 * Retrieves all products.
 * Queries Cloud Firestore `products` collection.
 * If Firestore has no documents, automatically returns STATIC_PRODUCTS so the customer shop never breaks.
 */
export const getAllProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    if (!snapshot.empty) {
      const items = snapshot.docs.map(mapFirestoreProduct);
      return sortProducts(items);
    }
  } catch (err) {
    console.warn('Could not load products from Firestore, falling back to static catalog:', err.message);
  }

  // Fallback to static catalog with normalized properties
  return STATIC_PRODUCTS.map((p) => ({
    ...p,
    price: formatProductPrice(p.price),
    numericPrice: normalizeProductPrice(p.price),
    available: true,
  }));
};

/**
 * Subscribes to real-time changes in Firestore products collection.
 * Allows instant synchronization when an administrator updates prices.
 */
export const subscribeToProducts = (onData, onError) => {
  try {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(mapFirestoreProduct);
          onData(sortProducts(items));
        } else {
          onData(
            STATIC_PRODUCTS.map((p) => ({
              ...p,
              price: formatProductPrice(p.price),
              numericPrice: normalizeProductPrice(p.price),
              available: true,
            }))
          );
        }
      },
      (err) => {
        console.warn('Firestore products subscription error, falling back:', err.message);
        if (onError) onError(err);
        onData(
          STATIC_PRODUCTS.map((p) => ({
            ...p,
            price: formatProductPrice(p.price),
            numericPrice: normalizeProductPrice(p.price),
            available: true,
          }))
        );
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish products subscription:', err.message);
    if (onError) onError(err);
    onData(
      STATIC_PRODUCTS.map((p) => ({
        ...p,
        price: formatProductPrice(p.price),
        numericPrice: normalizeProductPrice(p.price),
        available: true,
      }))
    );
    return () => {};
  }
};

/**
 * Retrieves a single product by ID from Firestore, falling back to static products.
 */
export const getProductById = async (productId) => {
  if (!productId) return null;
  const strId = String(productId);
  try {
    const docRef = doc(db, 'products', strId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return mapFirestoreProduct(docSnap);
    }
  } catch (err) {
    console.warn(`Could not load product ${productId} from Firestore, checking fallback:`, err.message);
  }
  const fallback = STATIC_PRODUCTS.find((p) => String(p.id) === strId);
  if (fallback) {
    return {
      ...fallback,
      price: formatProductPrice(fallback.price),
      numericPrice: normalizeProductPrice(fallback.price),
      available: true,
    };
  }
  return null;
};

/**
 * Subscribes to real-time changes for a single product by ID.
 */
export const subscribeToProduct = (productId, onData, onError) => {
  if (!productId) return () => {};
  const strId = String(productId);
  try {
    const docRef = doc(db, 'products', strId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onData(mapFirestoreProduct(docSnap));
        } else {
          const fallback = STATIC_PRODUCTS.find((p) => String(p.id) === strId);
          if (fallback) {
            onData({
              ...fallback,
              price: formatProductPrice(fallback.price),
              numericPrice: normalizeProductPrice(fallback.price),
              available: true,
            });
          } else {
            onData(null);
          }
        }
      },
      (err) => {
        console.warn(`Firestore product subscription error for ${strId}:`, err.message);
        if (onError) onError(err);
        const fallback = STATIC_PRODUCTS.find((p) => String(p.id) === strId);
        if (fallback) {
          onData({
            ...fallback,
            price: formatProductPrice(fallback.price),
            numericPrice: normalizeProductPrice(fallback.price),
            available: true,
          });
        }
      }
    );
  } catch (err) {
    console.warn(`Error setting up product subscription for ${strId}:`, err.message);
    if (onError) onError(err);
    const fallback = STATIC_PRODUCTS.find((p) => String(p.id) === strId);
    if (fallback) {
      onData({
        ...fallback,
        price: formatProductPrice(fallback.price),
        numericPrice: normalizeProductPrice(fallback.price),
        available: true,
      });
    }
    return () => {};
  }
};

/**
 * Seeds initial static products into Firestore products collection.
 * Safe to call; skips existing products.
 */
export const seedInitialProducts = async () => {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  if (snapshot.empty) {
    for (const prod of STATIC_PRODUCTS) {
      const prodId = String(prod.id);
      const docRef = doc(db, 'products', prodId);
      await setDoc(docRef, {
        id: prodId,
        productId: prodId,
        name: prod.name,
        category: prod.category,
        price: normalizeProductPrice(prod.price),
        rating: prod.rating,
        image: prod.image,
        description: prod.description,
        features: prod.features || [],
        specifications: prod.specifications || {},
        available: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  }
  return false;
};

/**
 * Creates a new product in Firestore.
 */
export const createProduct = async (productData) => {
  if (!productData.name || !productData.name.trim()) {
    throw new Error('Product name is required.');
  }

  const numPrice = normalizeProductPrice(productData.price);
  const prodId = productData.id ? String(productData.id).trim() : `prod_${Date.now()}`;
  const prodDocRef = doc(db, 'products', prodId);

  const payload = {
    id: prodId,
    productId: prodId,
    name: productData.name.trim(),
    category: productData.category || 'Personalized Gifts',
    price: numPrice,
    rating: Number(productData.rating) || 5.0,
    image: productData.image?.trim() || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
    description: productData.description?.trim() || 'Premium Visit & Gift personalized item.',
    features: Array.isArray(productData.features) ? productData.features : (productData.features ? String(productData.features).split('\n').filter(Boolean) : []),
    specifications: productData.specifications || {},
    available: productData.available !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(prodDocRef, payload);
  return { id: prodId, ...payload };
};

/**
 * Updates an existing product in Firestore.
 */
export const updateProduct = async (productId, updates) => {
  if (!productId) throw new Error('Product ID is required.');
  const strId = String(productId);
  const prodDocRef = doc(db, 'products', strId);

  const payload = {
    updatedAt: serverTimestamp(),
  };

  if (updates.name) payload.name = updates.name.trim();
  if (updates.category) payload.category = updates.category;
  if (updates.price !== undefined) payload.price = normalizeProductPrice(updates.price);
  if (updates.rating !== undefined) payload.rating = Number(updates.rating);
  if (updates.image) payload.image = updates.image.trim();
  if (updates.description) payload.description = updates.description.trim();
  if (updates.features) {
    payload.features = Array.isArray(updates.features)
      ? updates.features
      : String(updates.features).split('\n').filter(Boolean);
  }
  if (updates.specifications) payload.specifications = updates.specifications;
  if (updates.available !== undefined) payload.available = Boolean(updates.available);

  await updateDoc(prodDocRef, payload);
  return { id: strId, ...payload };
};

/**
 * Deletes a product from Firestore.
 */
export const deleteProduct = async (productId) => {
  if (!productId) throw new Error('Product ID is required.');
  const strId = String(productId);
  const prodDocRef = doc(db, 'products', strId);
  await deleteDoc(prodDocRef);
  return { success: true, id: strId };
};
