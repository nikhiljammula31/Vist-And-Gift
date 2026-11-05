import { createContext, useContext, useState, useCallback } from 'react';

const AuthModalContext = createContext(null);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

export const AuthModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: 'Sign in to continue!',
    message:
      'Create an account or log in to enjoy a seamless shopping experience, manage your orders and access your personalized account.',
    pendingAction: null,
    redirectTo: null,
  });

  const openAuthModal = useCallback(
    ({
      title = 'Sign in to continue!',
      message = 'Create an account or log in to enjoy a seamless shopping experience, manage your orders and access your personalized account.',
      pendingAction = null,
      redirectTo = null,
    } = {}) => {
      // Also store pendingAction in sessionStorage as a fail-safe across page reloads/redirects
      if (pendingAction) {
        try {
          if (pendingAction.type === 'ADD_TO_CART') {
            sessionStorage.setItem('pendingCartAction', JSON.stringify(pendingAction));
          } else if (pendingAction.type === 'OPEN_QUOTE') {
            sessionStorage.setItem('pendingQuoteAction', JSON.stringify(pendingAction));
          } else if (pendingAction.type === 'CHECKOUT') {
            sessionStorage.setItem('pendingCheckoutAction', JSON.stringify(pendingAction));
          }
        } catch (e) {
          console.warn('Could not save pending action to sessionStorage:', e);
        }
      }

      setModalState({
        isOpen: true,
        title,
        message,
        pendingAction,
        redirectTo,
      });
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen: modalState.isOpen,
        title: modalState.title,
        message: modalState.message,
        pendingAction: modalState.pendingAction,
        redirectTo: modalState.redirectTo,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

