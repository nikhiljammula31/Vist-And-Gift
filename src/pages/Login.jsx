import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiArrowRight,
  FiGift,
  FiSend,
  FiInfo,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import AuthFormInput from '../components/auth/AuthFormInput';
import { getFriendlyErrorMessage } from '../utils/authErrors';

const Login = () => {
  const { login, loginWithGoogle, currentUser, isEmailVerified, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showUnverifiedNotice, setShowUnverifiedNotice] = useState(false);
  const [resendStatus, setResendStatus] = useState({ sent: false, loading: false });

  // Destination redirect path
  const destination =
    typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
      : '/';

  // If already logged in with verified email, redirect
  useEffect(() => {
    if (currentUser && isEmailVerified) {
      navigate(destination, { replace: true });
    } else if (currentUser && !isEmailVerified) {
      setShowUnverifiedNotice(true);
    }
  }, [currentUser, isEmailVerified, navigate, destination]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) setAuthError('');
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isGoogleSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setAuthError('');
    setShowUnverifiedNotice(false);

    try {
      const cred = await login(formData.email, formData.password, formData.rememberMe);
      if (!cred.user.emailVerified) {
        setShowUnverifiedNotice(true);
      } else {
        navigate(destination, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting || isGoogleSubmitting) return;

    setIsGoogleSubmitting(true);
    setAuthError('');
    setShowUnverifiedNotice(false);

    try {
      await loginWithGoogle();
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setResendStatus({ sent: false, loading: true });
    try {
      await resendVerificationEmail();
      setResendStatus({ sent: true, loading: false });
    } catch (err) {
      console.error('Resend verification error:', err);
      setAuthError(getFriendlyErrorMessage(err));
      setResendStatus({ sent: false, loading: false });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Decorative Background Glow Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/25 rounded-full filter blur-[100px] pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary-lavender/40 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-peach/30 rounded-full filter blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Badge */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-accent-light via-white to-accent/30 shadow-md shadow-accent/20 mb-4 border border-white"
          >
            <FiGift className="w-7 h-7 text-accent-dark" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-secondary-dark tracking-tight">
            Welcome <span className="text-accent">Back</span>
          </h1>
          <p className="mt-2 text-sm font-body text-secondary-dark/60">
            Sign in to access your customized gifts, cards, and orders.
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="glass-card p-6 sm:p-10 shadow-[0_20px_50px_rgba(248,184,200,0.25)] border border-white/60 bg-white/70 backdrop-blur-xl">
          {/* Friendly Login-Required Notice */}
          <AnimatePresence>
            {(location.state?.message || (location.state?.from && destination !== '/')) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-accent-light/80 to-pink-50/90 border border-accent/40 flex items-start gap-3 text-secondary-dark text-sm font-body shadow-sm"
              >
                <FiInfo className="w-5 h-5 text-accent-dark shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-secondary-dark">Sign In Required</p>
                  <p className="text-xs text-secondary-dark/75 mt-0.5">
                    {location.state?.message || 'Please log in to your account to continue.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unverified Email Warning Banner */}
          <AnimatePresence>
            {showUnverifiedNotice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-800 text-sm font-body space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <FiAlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Email Verification Required</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Your email address has not been verified yet. Please check your inbox to verify your account and unlock all customer features.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus.loading || resendStatus.sent}
                    className="text-xs font-semibold text-accent-dark hover:text-accent underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <FiSend className="w-3.5 h-3.5" />
                    {resendStatus.loading
                      ? 'Sending...'
                      : resendStatus.sent
                      ? 'Verification Sent!'
                      : 'Resend Verification Email'}
                  </button>

                  <Link
                    to="/verify-email"
                    className="text-xs font-semibold text-secondary-dark hover:text-accent ml-auto flex items-center gap-1"
                  >
                    Go to Verification <FiArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Error Banner */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-3.5 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-3 text-red-600 text-sm font-body"
              >
                <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{authError}</p>
                  {(authError.toLowerCase().includes('sign up') ||
                    authError.toLowerCase().includes('no account') ||
                    authError.toLowerCase().includes('verify your credentials')) && (
                    <Link
                      to="/signup"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-accent underline hover:text-accent-dark"
                    >
                      Create a new account now <FiArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-50/80 text-secondary-dark font-body font-semibold text-sm border border-gray-200 shadow-sm flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-md hover:border-accent/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isGoogleSubmitting ? (
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <FcGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-gray-200/80" />
            <span className="absolute px-3 bg-white/70 backdrop-blur-md text-xs font-medium uppercase tracking-wider text-secondary-dark/50 font-body">
              or sign in with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthFormInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={FiMail}
              required
              autoComplete="email"
              disabled={isSubmitting || isGoogleSubmitting}
            />

            <AuthFormInput
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={FiLock}
              required
              autoComplete="current-password"
              disabled={isSubmitting || isGoogleSubmitting}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-secondary-dark/40 hover:text-accent transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-accent focus:ring-accent border-gray-300 transition-colors accent-[#F8B8C8]"
                />
                <span className="text-xs font-body font-medium text-secondary-dark/70">
                  Remember me
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-body font-semibold text-accent-dark hover:text-accent transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-accent via-accent-dark to-accent text-white font-body font-semibold text-sm shadow-[0_8px_20px_rgba(248,184,200,0.4)] hover:shadow-[0_12px_28px_rgba(248,184,200,0.6)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm font-body text-secondary-dark/60">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-accent-dark hover:text-accent transition-colors inline-flex items-center gap-1"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
