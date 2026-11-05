import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiX, FiGift, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { useAuthModal } from '../../context/AuthModalContext';

const AuthRequiredModal = () => {
  const { isOpen, title, message, pendingAction, redirectTo, closeAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    // Preserve current location or specified target for post-login return
    const returnLocation = redirectTo ? { pathname: redirectTo } : location;

    closeAuthModal();
    navigate(path, {
      state: {
        from: returnLocation,
        pendingAction,
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with frosted blur */}
          <motion.div
            className="fixed inset-0 bg-secondary-dark/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative w-full max-w-md glass-card rounded-3xl shadow-[0_25px_60px_rgba(248,184,200,0.35)] bg-white/95 border border-white p-6 sm:p-8 text-center z-10 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Soft decorative background glows */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-accent/25 rounded-full filter blur-[40px] pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-secondary-lavender/50 rounded-full filter blur-[40px] pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={closeAuthModal}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-secondary-dark/60 hover:text-accent shadow-sm border border-gray-100 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <FiX className="w-4 h-4" />
            </button>

            {/* Gift Icon Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-accent-light via-white to-accent/30 shadow-md shadow-accent/25 border border-white flex items-center justify-center mx-auto mb-4"
            >
              <FiGift className="w-8 h-8 text-accent-dark" />
            </motion.div>

            {/* Title & Explanatory Copy */}
            <h2
              id="auth-modal-title"
              className="text-2xl font-heading font-bold text-secondary-dark mb-2 tracking-tight"
            >
              {title}
            </h2>

            <p className="text-sm font-body text-secondary-dark/70 leading-relaxed mb-6">
              {message}
            </p>

            {/* Dual Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('/login')}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-accent via-accent-dark to-accent text-white font-body font-semibold text-sm shadow-[0_8px_20px_rgba(248,184,200,0.4)] hover:shadow-[0_12px_28px_rgba(248,184,200,0.6)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FiLogIn className="w-4 h-4" />
                <span>Log In</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('/signup')}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-white hover:bg-gray-50/90 text-secondary-dark font-body font-semibold text-sm border border-gray-200 hover:border-accent/40 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FiUserPlus className="w-4 h-4 text-accent-dark" />
                <span>Create Account</span>
              </motion.button>
            </div>

            {/* Subtle dismiss option */}
            <div className="mt-4 pt-3">
              <button
                type="button"
                onClick={closeAuthModal}
                className="text-xs font-body text-secondary-dark/50 hover:text-accent transition-colors cursor-pointer"
              >
                Continue browsing as guest
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthRequiredModal;

