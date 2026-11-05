import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useAuthModal } from './AuthModalContext';

const QuoteContext = createContext();

export const useQuote = () => useContext(QuoteContext);

export const QuoteProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteFormData, setQuoteFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('quoteFormData');
      return saved
        ? JSON.parse(saved)
        : {
            name: '',
            phone: '',
            email: '',
            businessName: '',
            requirement: 'Visiting Cards',
            quantity: '',
            message: '',
          };
    } catch {
      return {
        name: '',
        phone: '',
        email: '',
        businessName: '',
        requirement: 'Visiting Cards',
        quantity: '',
        message: '',
      };
    }
  });

  // Keep form data saved in sessionStorage to preserve user inputs
  useEffect(() => {
    try {
      sessionStorage.setItem('quoteFormData', JSON.stringify(quoteFormData));
    } catch (e) {
      console.warn('Could not save quote form data:', e);
    }
  }, [quoteFormData]);

  const openQuoteModal = () => {
    if (!currentUser) {
      openAuthModal({
        title: 'Sign in to Request a Quote',
        message:
          'Create an account or log in to submit customized visiting card or corporate gifting quote requests and receive real-time estimates.',
        pendingAction: { type: 'OPEN_QUOTE' },
      });
      return;
    }
    setIsQuoteModalOpen(true);
  };

  const closeQuoteModal = () => setIsQuoteModalOpen(false);

  // Restore quote workflow if pending quote action existed before authentication
  useEffect(() => {
    if (currentUser) {
      const pendingRaw = sessionStorage.getItem('pendingQuoteAction');
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending?.type === 'OPEN_QUOTE') {
            setIsQuoteModalOpen(true);
          }
        } catch (err) {
          console.error('Error restoring pending quote action:', err);
        } finally {
          sessionStorage.removeItem('pendingQuoteAction');
        }
      }
    }
  }, [currentUser]);

  return (
    <QuoteContext.Provider
      value={{
        isQuoteModalOpen,
        openQuoteModal,
        closeQuoteModal,
        quoteFormData,
        setQuoteFormData,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
};
