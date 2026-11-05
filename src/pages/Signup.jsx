import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiArrowRight,
  FiGift,
  FiShield,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import AuthFormInput from '../components/auth/AuthFormInput';
import { getFriendlyErrorMessage } from '../utils/authErrors';

const Signup = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination =
    typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
      : '/';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Real-time password criteria
  const passwordCriteria = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[@$!%*?&#^()_\-+=<>~`]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) setAuthError('');
  };

  const validate = () => {
    const newErrors = {};

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters long.';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Mobile Number (Indian format: 10 digits starting with 6, 7, 8, or 9, optional +91 or 0 prefix)
    const cleanedPhone = formData.phone.replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required.';
    } else if (!indianPhoneRegex.test(cleanedPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).';
    }

    // Password criteria
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (!isPasswordValid) {
      newErrors.password =
        'Password must meet all security requirements listed below.';
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // Terms
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions.';
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

    try {
      // Normalize phone number (strip leading 0 or +91 for clean 10-digit standard or keep full)
      const cleanPhone = formData.phone.replace(/[\s\-()]/g, '').replace(/^(?:\+91|91|0)/, '');

      await signup({
        fullName: formData.fullName,
        email: formData.email,
        phone: cleanPhone,
        password: formData.password,
      });

      // Navigate to verification confirmation page, preserving destination
      navigate('/verify-email', { replace: true, state: { from: { pathname: destination } } });
    } catch (err) {
      console.error('Signup error:', err);
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting || isGoogleSubmitting) return;

    setIsGoogleSubmitting(true);
    setAuthError('');

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

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-24 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="absolute top-20 -right-24 w-96 h-96 bg-accent/20 rounded-full filter blur-[110px] pointer-events-none animate-float" />
      <div className="absolute bottom-20 -left-24 w-96 h-96 bg-secondary-lavender/40 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-secondary-peach/25 rounded-full filter blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Brand Header */}
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
            Create an <span className="text-accent">Account</span>
          </h1>
          <p className="mt-2 text-sm font-body text-secondary-dark/60">
            Join Visit & Gift for premium visiting cards and curated gift shopping.
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="glass-card p-6 sm:p-10 shadow-[0_20px_50px_rgba(248,184,200,0.25)] border border-white/60 bg-white/70 backdrop-blur-xl">
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
                  {(authError.toLowerCase().includes('already exists') ||
                    authError.toLowerCase().includes('already registered') ||
                    authError.toLowerCase().includes('sign in')) && (
                    <Link
                      to="/login"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-accent underline hover:text-accent-dark"
                    >
                      Sign In to your existing account <FiArrowRight className="w-3 h-3" />
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
              or register with email
            </span>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthFormInput
              label="Full Name"
              name="fullName"
              placeholder="e.g. Aditi Sharma"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              leftIcon={FiUser}
              required
              autoComplete="name"
              disabled={isSubmitting || isGoogleSubmitting}
            />

            <AuthFormInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="aditi@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={FiMail}
              required
              autoComplete="email"
              disabled={isSubmitting || isGoogleSubmitting}
            />

            <AuthFormInput
              label="Mobile Number (India)"
              name="phone"
              type="tel"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              leftIcon={FiPhone}
              required
              autoComplete="tel"
              disabled={isSubmitting || isGoogleSubmitting}
            />

            <AuthFormInput
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={FiLock}
              required
              autoComplete="new-password"
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

            {/* Password Validation Checklist */}
            {formData.password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-2xl bg-white/60 border border-pink-100 text-xs font-body space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-secondary-dark/70 font-semibold mb-1">
                  <FiShield className="w-3.5 h-3.5 text-accent-dark" />
                  <span>Password Requirements:</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.length ? 'text-green-600 font-medium' : 'text-gray-400'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[10px]">
                      {passwordCriteria.length ? '✓' : '•'}
                    </span>
                    <span>8+ characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.upper ? 'text-green-600 font-medium' : 'text-gray-400'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[10px]">
                      {passwordCriteria.upper ? '✓' : '•'}
                    </span>
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.lower ? 'text-green-600 font-medium' : 'text-gray-400'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[10px]">
                      {passwordCriteria.lower ? '✓' : '•'}
                    </span>
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.number ? 'text-green-600 font-medium' : 'text-gray-400'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[10px]">
                      {passwordCriteria.number ? '✓' : '•'}
                    </span>
                    <span>Number (0-9)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 col-span-2 ${
                      passwordCriteria.special ? 'text-green-600 font-medium' : 'text-gray-400'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[10px]">
                      {passwordCriteria.special ? '✓' : '•'}
                    </span>
                    <span>Special character (!@#$%^&*...)</span>
                  </div>
                </div>
              </motion.div>
            )}

            <AuthFormInput
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              leftIcon={FiLock}
              required
              autoComplete="new-password"
              disabled={isSubmitting || isGoogleSubmitting}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-secondary-dark/40 hover:text-accent transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="w-4 h-4" />
                  ) : (
                    <FiEye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {/* Terms and Conditions */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded text-accent focus:ring-accent border-gray-300 transition-colors accent-[#F8B8C8]"
                />
                <span className="text-xs font-body text-secondary-dark/70 leading-relaxed">
                  I agree to the{' '}
                  <span className="text-secondary-dark font-semibold">Visit & Gift</span> Terms of
                  Service and Privacy Policy.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs font-medium text-red-500 mt-1 pl-6 font-body">
                  • {errors.acceptTerms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full mt-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-accent via-accent-dark to-accent text-white font-body font-semibold text-sm shadow-[0_8px_20px_rgba(248,184,200,0.4)] hover:shadow-[0_12px_28px_rgba(248,184,200,0.6)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm font-body text-secondary-dark/60">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-accent-dark hover:text-accent transition-colors inline-flex items-center gap-1"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
