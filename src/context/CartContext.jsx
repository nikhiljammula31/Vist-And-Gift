import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('visitAndGiftCart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('visitAndGiftCart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart to localStorage:', e);
    }
  }, [cartItems]);

  const addToCart = (product) => {
    if (!product || !product.id) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Restore pending cart action after user logs in or registers
  useEffect(() => {
    if (currentUser) {
      const pendingRaw = sessionStorage.getItem('pendingCartAction');
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending?.type === 'ADD_TO_CART' && pending?.product) {
            addToCart(pending.product);
          }
        } catch (err) {
          console.error('Error processing pending cart action:', err);
        } finally {
          sessionStorage.removeItem('pendingCartAction');
        }
      }
    }
  }, [currentUser]);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
