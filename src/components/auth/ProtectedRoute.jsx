import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireVerified = false }) => {
  const { currentUser, isEmailVerified, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <motion.div
          className="w-16 h-16 rounded-3xl bg-accent/20 border-2 border-accent flex items-center justify-center shadow-lg shadow-accent/20"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 180, 270, 360],
            borderRadius: ['24px', '32px', '24px'],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-6 h-6 rounded-full bg-accent animate-ping" />
        </motion.div>
        <p className="mt-4 text-sm font-body font-medium text-secondary-dark/60 tracking-wider uppercase">
          Verifying security...
        </p>
      </div>
    );
  }

  // If user is not logged in, redirect to login, preserving destination and reason message
  if (!currentUser) {
    let friendlyMessage = 'Please sign in to access this page.';
    if (location.pathname.startsWith('/shop')) {
      friendlyMessage = 'Please sign in to browse our Shop Gifts collection.';
    } else if (location.pathname.startsWith('/contact')) {
      friendlyMessage = 'Please sign in to access our Contact page.';
    } else if (location.pathname.startsWith('/my-orders') || location.pathname.startsWith('/order')) {
      friendlyMessage = 'Please sign in to view your order history.';
    } else if (location.pathname.startsWith('/profile')) {
      friendlyMessage = 'Please sign in to access your customer profile.';
    } else if (location.pathname.startsWith('/checkout') || location.pathname.startsWith('/cart')) {
      friendlyMessage = 'Please sign in to proceed with checkout.';
    }

    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: friendlyMessage,
        }}
        replace
      />
    );
  }

  // If email verification is required and user has not verified, redirect to verify-email
  if (requireVerified && !isEmailVerified) {
    // Avoid redirect loops if already on verify-email
    if (location.pathname === '/verify-email') {
      return children;
    }
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
