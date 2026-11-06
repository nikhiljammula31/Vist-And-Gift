import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  addToWishlistService,
  removeFromWishlistService,
  subscribeWishlistService,
  normalizePrice,
} from '../firebase/wishlistService';
import { subscribeToProducts } from '../firebase/productService';
import {
  createNotification,
  NOTIFICATION_TYPES,
} from '../firebase/notificationService';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiCheck, FiX } from 'react-icons/fi';

const WishlistContext = createContext(null);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null); // { id, message, type: 'success' | 'info' | 'error' }

  // Show temporary toast notification
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToastMessage({ id, message, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  // Listen for wishlist changes in real-time when user is authenticated
  useEffect(() => {
    // Wait until AuthContext finishes loading and a valid user UID exists
    if (authLoading || !currentUser?.uid) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let isSubscribed = true;

    const unsubscribe = subscribeWishlistService(
      currentUser.uid,
      (items) => {
        if (isSubscribed) {
          setWishlistItems(items || []);
          setLoading(false);
        }
      },
      (err) => {
        if (isSubscribed) {
          if (err?.code === 'permission-denied') {
            console.warn('Wishlist subscription closed due to permission state change');
          } else {
            console.error('Wishlist subscription error:', err);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [currentUser?.uid, authLoading]);

  // Synchronize wishlisted items with live catalog changes (price updates & stock changes)
  useEffect(() => {
    if (!currentUser?.uid || wishlistItems.length === 0) return;

    const unsubscribe = subscribeToProducts((products) => {
      if (!Array.isArray(products) || products.length === 0) return;
      const productMap = new Map();
      products.forEach((p) => productMap.set(String(p.id), p));

      wishlistItems.forEach(async (item) => {
        const liveProd = productMap.get(String(item.productId));
        if (!liveProd) return;

        // Price change detection
        if (
          typeof liveProd.numericPrice === 'number' &&
          typeof item.priceAtSave === 'number' &&
          liveProd.numericPrice !== item.priceAtSave
        ) {
          try {
            await createNotification(currentUser.uid, {
              id: `wishlist_price_${item.productId}_${liveProd.numericPrice}`,
              title: 'Wishlist Item Price Change',
              message: `"${item.productName}" in your wishlist is now ${liveProd.price} (previously ₹${item.priceAtSave}).`,
              type: NOTIFICATION_TYPES.WISHLIST,
              relatedProductId: String(item.productId),
              metadata: {
                previousPrice: item.priceAtSave,
                newPrice: liveProd.numericPrice,
              },
            });
          } catch (e) {
            console.warn('Wishlist price notification notice:', e);
          }
        }

        // Out of stock detection
        if (liveProd.available === false) {
          try {
            await createNotification(currentUser.uid, {
              id: `wishlist_stock_${item.productId}_oos`,
              title: 'Wishlist Item Out of Stock',
              message: `"${item.productName}" in your wishlist is currently out of stock.`,
              type: NOTIFICATION_TYPES.WISHLIST,
              relatedProductId: String(item.productId),
            });
          } catch (e) {
            console.warn('Wishlist out-of-stock notification notice:', e);
          }
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, wishlistItems]);

  // Quick lookup map: productId -> boolean
  const wishlistMap = useMemo(() => {
    const map = new Set();
    wishlistItems.forEach((item) => {
      map.add(String(item.productId));
    });
    return map;
  }, [wishlistItems]);

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlistMap.has(String(productId));
    },
    [wishlistMap]
  );

  const addToWishlist = useCallback(
    async (product) => {
      if (!currentUser) {
        showToast('Please log in to add items to your wishlist', 'info');
        return false;
      }
      if (!product || product.id === undefined || product.id === null) return false;

      const productIdStr = String(product.id).trim();

      // Prevent duplicate
      if (isInWishlist(productIdStr)) {
        showToast(`"${product.name || 'Product'}" is already in your wishlist`, 'info');
        return true;
      }

      // Optimistic item for instantaneous heart state change
      const optimisticItem = {
        id: productIdStr,
        productId: productIdStr,
        productName: product.name || 'Custom Gift',
        productImage: product.image || '',
        priceAtSave: normalizePrice(product.price),
        category: product.category || 'General',
        addedAt: new Date(),
        _optimistic: true,
      };

      // Optimistically insert
      setWishlistItems((prev) => [
        ...prev.filter((item) => String(item.productId) !== productIdStr),
        optimisticItem,
      ]);

      try {
        await addToWishlistService(currentUser.uid, product);
        showToast(`Saved "${product.name || 'item'}" to your wishlist!`, 'success');

        try {
          await createNotification(currentUser.uid, {
            id: `wishlist_add_${productIdStr}_${Date.now()}`,
            title: 'Added to Wishlist',
            message: `"${product.name || 'Gift Item'}" has been added to your personal wishlist.`,
            type: NOTIFICATION_TYPES.WISHLIST,
            relatedProductId: productIdStr,
          });
        } catch (notifErr) {
          console.warn('Wishlist notification notice:', notifErr);
        }

        return true;
      } catch (err) {
        console.error('Error adding to wishlist:', err);
        // Rollback optimistic update
        setWishlistItems((prev) =>
          prev.filter((item) => String(item.productId) !== productIdStr)
        );
        showToast('Failed to save to wishlist. Please try again.', 'error');
        return false;
      }
    },
    [currentUser, isInWishlist, showToast]
  );

  const removeFromWishlist = useCallback(
    async (productId, productName) => {
      if (!currentUser) return false;
      if (productId === undefined || productId === null) return false;

      const productIdStr = String(productId).trim();
      const previousItems = [...wishlistItems];

      // Optimistically remove immediately
      setWishlistItems((prev) =>
        prev.filter((item) => String(item.productId) !== productIdStr)
      );

      try {
        await removeFromWishlistService(currentUser.uid, productIdStr);
        showToast(
          productName
            ? `Removed "${productName}" from your wishlist`
            : 'Item removed from your wishlist',
          'info'
        );

        try {
          await createNotification(currentUser.uid, {
            id: `wishlist_remove_${productIdStr}_${Date.now()}`,
            title: 'Removed from Wishlist',
            message: `"${productName || 'Gift Item'}" was removed from your wishlist.`,
            type: NOTIFICATION_TYPES.WISHLIST,
            relatedProductId: productIdStr,
          });
        } catch (notifErr) {
          console.warn('Wishlist removal notification notice:', notifErr);
        }

        return true;
      } catch (err) {
        console.error('Error removing from wishlist:', err);
        // Rollback on failure
        setWishlistItems(previousItems);
        showToast('Failed to remove item. Please try again.', 'error');
        return false;
      }
    },
    [currentUser, wishlistItems, showToast]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      if (!currentUser) {
        showToast('Please log in to manage your wishlist', 'info');
        return false;
      }
      if (!product || !product.id) return false;

      if (isInWishlist(product.id)) {
        return await removeFromWishlist(product.id, product.name);
      } else {
        return await addToWishlist(product);
      }
    },
    [currentUser, isInWishlist, addToWishlist, removeFromWishlist, showToast]
  );

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistCount: wishlistItems.length,
      loading,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      showToast,
    }),
    [
      wishlistItems,
      loading,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      showToast,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}

      {/* Floating Rose-Milk Pink Luxury Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-[200] max-w-sm pointer-events-auto"
          >
            <div className="glass-card py-3.5 px-4 rounded-2xl bg-white/95 dark:bg-secondary-dark/95 backdrop-blur-xl border border-pink-200/80 dark:border-pink-900/40 shadow-[0_15px_35px_rgba(248,184,200,0.35)] flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  toastMessage.type === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-pink-100 text-accent-dark'
                }`}
              >
                {toastMessage.type === 'error' ? (
                  <FiX className="w-4 h-4" />
                ) : toastMessage.type === 'success' ? (
                  <FiHeart className="w-4 h-4 fill-accent-dark" />
                ) : (
                  <FiCheck className="w-4 h-4" />
                )}
              </div>
              <p className="font-body text-xs sm:text-sm font-medium text-secondary-dark dark:text-white flex-1 pr-1">
                {toastMessage.message}
              </p>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                aria-label="Close notification"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WishlistContext.Provider>
  );
};

