import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiLogOut,
  FiSend,
  FiClock,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getFriendlyErrorMessage } from '../utils/authErrors';

const COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const {
    currentUser,
    isEmailVerified,
    resendVerificationEmail,
    checkEmailVerification,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [cooldown, setCooldown] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const destination = location.state?.from?.pathname || '/profile';

  // If already verified, redirect immediately
  useEffect(() => {
    if (currentUser && isEmailVerified) {
      navigate(destination, { replace: true });
    }
  }, [currentUser, isEmailVerified, destination, navigate]);

  // Handle cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setStatusMessage({ type: '', text: '' });

    try {
      await resendVerificationEmail();
      setCooldown(COOLDOWN_SECONDS);
      setStatusMessage({
        type: 'success',
        text: 'A fresh verification email has been dispatched. Please check your inbox and spam folder.',
      });
    } catch (err) {
      console.error('Resend verification error:', err);
      setStatusMessage({
        type: 'error',
        text: getFriendlyErrorMessage(err),
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setStatusMessage({
          type: 'success',
          text: 'Email verified successfully! Redirecting...',
        });
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 1200);
      } else {
        setStatusMessage({
          type: 'warning',
          text: 'Email not yet verified. Please click the link in your email, then check again.',
        });
      }
    } catch (err) {
      console.error('Check status error:', err);
      setStatusMessage({
        type: 'error',
        text: getFriendlyErrorMessage(err),
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-24 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/25 rounded-full filter blur-[100px] pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary-lavender/40 rounded-full filter blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-card p-8 sm:p-12 shadow-[0_20px_50px_rgba(248,184,200,0.25)] border border-white/60 bg-white/70 backdrop-blur-xl text-center">
          {/* Animated Envelope / Gift Badge */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full h-full rounded-3xl bg-gradient-to-tr from-accent-light via-white to-accent/30 shadow-md shadow-accent/20 border border-white flex items-center justify-center"
            >
              <FiMail className="w-10 h-10 text-accent-dark" />
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center shadow-md">
              <FiClock className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>

          <h1 className="text-3xl font-heading font-bold text-secondary-dark tracking-tight mb-2">
            Verify Your <span className="text-accent">Email</span>
          </h1>

          <p className="text-sm font-body text-secondary-dark/70 max-w-md mx-auto leading-relaxed mb-4">
            We&apos;ve sent a verification link to your registered email address:
          </p>

          <div className="inline-block py-2 px-4 rounded-xl bg-white/80 border border-pink-100 shadow-sm font-body font-semibold text-secondary-dark text-sm mb-6">
            {currentUser?.email || 'your registered email'}
          </div>

          {/* Status Alert Banner */}
          <AnimatePresence>
            {statusMessage.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-2xl border text-sm font-body flex items-start gap-3 text-left ${
                  statusMessage.type === 'success'
                    ? 'bg-green-50/90 border-green-200 text-green-700'
                    : statusMessage.type === 'warning'
                    ? 'bg-amber-50/90 border-amber-200 text-amber-800'
                    : 'bg-red-50/90 border-red-200 text-red-600'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <FiCheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
                ) : (
                  <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent via-accent-dark to-accent text-white font-body font-semibold text-sm shadow-[0_8px_20px_rgba(248,184,200,0.4)] hover:shadow-[0_12px_28px_rgba(248,184,200,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <FiRefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Status...' : 'Check Verification Status'}</span>
            </motion.button>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-secondary-dark font-body font-semibold text-sm shadow-sm hover:border-accent/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FiSend className="w-4 h-4 text-accent-dark" />
              <span>
                {isResending
                  ? 'Sending...'
                  : cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : 'Resend Verification Email'}
              </span>
            </button>
          </div>

          {/* Sign Out Option */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-body text-secondary-dark/60">
            <span>Wrong email address?</span>
            <button
              type="button"
              onClick={handleLogout}
              className="font-semibold text-accent-dark hover:text-accent flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Try Again</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;

