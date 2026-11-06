import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiKey,
  FiSend,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import AuthFormInput from '../components/auth/AuthFormInput';
import { getFriendlyErrorMessage } from '../utils/authErrors';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setAuthError('');

    try {
      await resetPassword(email.trim());
      // Always show success to prevent account enumeration / security leaks
      setIsSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      // If error is user-not-found, still show success message to preserve customer privacy
      if (err.code === 'auth/user-not-found') {
        setIsSubmitted(true);
      } else {
        setAuthError(getFriendlyErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-accent/25 rounded-full filter blur-[100px] pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-secondary-lavender/40 rounded-full filter blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-accent-light via-white to-accent/30 shadow-md shadow-accent/20 mb-4 border border-white"
          >
            <FiKey className="w-7 h-7 text-accent-dark" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-secondary-dark tracking-tight">
            Reset <span className="text-accent">Password</span>
          </h1>
          <p className="mt-2 text-sm font-body text-secondary-dark/60">
            Enter your email to receive recovery instructions.
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-card p-6 sm:p-10 shadow-[0_20px_50px_rgba(248,184,200,0.25)] border border-white/60 bg-white/70 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="reset-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {authError && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-3 text-red-600 text-sm font-body">
                    <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <p className="text-xs font-body text-secondary-dark/70 mb-6 leading-relaxed">
                  We will send a password reset link to your email address. Follow the link to choose a new password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AuthFormInput
                    label="Registered Email Address"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                      if (authError) setAuthError('');
                    }}
                    error={error}
                    leftIcon={FiMail}
                    required
                    autoComplete="email"
                    disabled={isSubmitting}
                  />

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isSubmitting}
                    className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-accent via-accent-dark to-accent text-white font-body font-semibold text-sm shadow-[0_8px_20px_rgba(248,184,200,0.4)] hover:shadow-[0_12px_28px_rgba(248,184,200,0.6)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-4 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 border border-green-200 flex items-center justify-center mx-auto mb-2">
                  <FiCheckCircle className="w-8 h-8" />
                </div>

                <h2 className="text-xl font-heading font-bold text-secondary-dark">
                  Check Your Inbox
                </h2>

                <p className="text-sm font-body text-secondary-dark/70 leading-relaxed">
                  If an account exists for <span className="font-semibold text-secondary-dark">{email}</span>, a secure password reset link has been dispatched. Please check your inbox and spam folder.
                </p>

                <div className="pt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="text-xs font-semibold text-accent-dark hover:text-accent font-body underline"
                  >
                    Try another email address
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to Login Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-body font-semibold text-secondary-dark/70 hover:text-accent transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

