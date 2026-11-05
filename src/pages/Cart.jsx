import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiTrash2,
  FiMinus,
  FiPlus,
  FiArrowRight,
  FiCheckCircle,
  FiTruck,
  FiAlertCircle,
  FiLock,
  FiPackage,
  FiShoppingBag,
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { createOrder, normalizeIndianPhone } from '../firebase/orderService';
import { getUserAddressesService } from '../firebase/addressService';
import PremiumButton from '../components/common/PremiumButton';

const CHECKOUT_STORAGE_KEY = 'visit_and_gift_checkout_form';

// Helper to parse price strings safely
const parsePrice = (priceStr) => {
  if (typeof priceStr === 'number') return priceStr;
  return parseFloat(String(priceStr || 0).replace(/[^0-9.]/g, '')) || 0;
};

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { currentUser, userProfile, isEmailVerified } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  // Animation and order states
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Form states with local storage persistence
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      fullName: '',
      email: '',
      phone: '',
      addressLine: '',
      city: '',
      state: '',
      pincode: '',
    };
  });

  const [formErrors, setFormErrors] = useState({});

  // Auto-fill from authenticated user profile and default saved address if available
  useEffect(() => {
    if (currentUser || userProfile) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || userProfile?.fullName || currentUser?.displayName || '',
        email: prev.email || userProfile?.email || currentUser?.email || '',
        phone: prev.phone || userProfile?.phone || '',
      }));
    }

    if (currentUser?.uid) {
      getUserAddressesService(currentUser.uid)
        .then((addresses) => {
          if (!addresses || addresses.length === 0) return;
          const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
          if (defaultAddr) {
            setFormData((prev) => ({
              ...prev,
              fullName: prev.fullName || defaultAddr.fullName || '',
              phone: prev.phone || defaultAddr.phone || '',
              addressLine:
                prev.addressLine ||
                `${defaultAddr.houseStreet}${
                  defaultAddr.areaLocality ? ', ' + defaultAddr.areaLocality : ''
                }`.trim(),
              city: prev.city || defaultAddr.city || '',
              state: prev.state || defaultAddr.state || '',
              pincode: prev.pincode || defaultAddr.pincode || '',
            }));
          }
        })
        .catch(() => {
          // Gracefully continue without auto-fill on failure
        });
    }
  }, [currentUser, userProfile]);

  // Save form data to localStorage so it survives login redirects
  useEffect(() => {
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Could not persist checkout form:', e);
    }
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (orderError) {
      setOrderError(null);
    }
  };

  const { subtotal, gst, grandTotal } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + parsePrice(item.price) * item.quantity, 0);
    const tax = sub * 0.18; // 18% GST
    return { subtotal: sub, gst: tax, grandTotal: sub + tax };
  }, [cartItems]);

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name is required (min 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      errors.email = 'A valid email address is required.';
    }

    const cleanPhone = normalizeIndianPhone(formData.phone);
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Valid 10-digit Indian mobile number is required (starts with 6-9).';
    }

    if (!formData.addressLine || formData.addressLine.trim().length < 5) {
      errors.addressLine = 'Street address is required (min 5 characters).';
    }

    if (!formData.city || formData.city.trim().length < 2) {
      errors.city = 'City is required.';
    }

    if (!formData.state || formData.state.trim().length < 2) {
      errors.state = 'State is required.';
    }

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!formData.pincode || !pincodeRegex.test(formData.pincode.trim())) {
      errors.pincode = 'Valid 6-digit Indian PIN code is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePurchase = async () => {
    // 1. Check authentication
    if (!currentUser) {
      openAuthModal({
        title: 'Sign in to Place Order',
        message:
          'Create an account or log in to complete your checkout, manage your orders and track deliveries.',
        pendingAction: { type: 'CHECKOUT' },
        redirectTo: '/cart',
      });
      return;
    }

    // 2. Check email verification
    if (!isEmailVerified) {
      navigate('/verify-email', { state: { from: location } });
      return;
    }

    // 3. Check cart validity
    if (cartItems.length === 0) {
      setOrderError('Your cart is empty. Please add items before checking out.');
      return;
    }

    // 4. Validate checkout information
    if (!validateForm()) {
      setOrderError('Please correct the highlighted fields in the delivery form.');
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      // 5. Create order in Firestore (simplified order placement, no payment step)
      const result = await createOrder({
        userId: currentUser.uid,
        items: cartItems,
        subtotal,
        deliveryCharge: 0,
        totalAmount: grandTotal,
        customerDetails: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          addressLine: formData.addressLine,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
      });

      if (!result.success || !result.orderId) {
        throw new Error('Order creation could not be completed. Please try again.');
      }

      // Store order details snapshot for the confirmation popup
      setCreatedOrder(result.order);

      // 6. Clear cart & clean local checkout draft ONLY after Firestore confirms order
      clearCart();
      try {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      } catch {
        // ignore
      }

      // 7. Trigger existing gift-box animation sequence
      // Sequence: Ribbon Wrap (1s) -> Confetti & Checkmark (1s) -> Popup
      setIsPurchasing(true);
      setTimeout(() => {
        setPurchaseSuccess(true);
      }, 2000);
    } catch (err) {
      console.error('Order creation error:', err);
      // IMPORTANT: Never clear the cart or show success animation if saving fails
      setOrderError(err.message || 'Failed to place order. Your cart is preserved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-primary-bg min-h-screen relative overflow-hidden pt-32 pb-24">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary-lavender/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-60"></div>
      <div className="absolute top-[40%] left-[-200px] w-[600px] h-[600px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-50"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary-dark mb-12">
          Your <span className="text-accent">Shopping Cart</span>
        </h1>

        {cartItems.length === 0 && !purchaseSuccess ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-heading font-semibold text-secondary-dark mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-500 font-body mb-8">
              Looks like you haven't added any premium gifts yet.
            </p>
            <PremiumButton onClick={() => navigate('/shop')} variant="primary">
              Continue Shopping
            </PremiumButton>
          </div>
        ) : !purchaseSuccess ? (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column: Cart Items + Delivery Details */}
            <div className="w-full lg:w-2/3 space-y-8">
              {/* Section 1: Cart Items */}
              <div className="space-y-4">
                <h2 className="text-xl font-heading font-semibold text-secondary-dark flex items-center gap-2">
                  <FiPackage className="text-accent" />
                  <span>Items in your Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
                </h2>

                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -50 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-[0_8px_30px_rgba(248,184,200,0.15)] transition-all"
                    >
                      <div className="w-32 h-32 rounded-2xl bg-white/50 p-2 overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="text-center sm:text-left">
                          <h3 className="font-heading font-semibold text-xl text-secondary-dark mb-1">
                            {item.name}
                          </h3>
                          <p className="font-body text-accent font-bold mb-4 sm:mb-0">
                            ₹{parsePrice(item.price).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 bg-white/40 rounded-full px-2 py-1 border border-white/20">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-white text-secondary-dark flex items-center justify-center hover:text-accent hover:shadow-sm transition-all interactive"
                              aria-label="Decrease quantity"
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <span className="font-body font-semibold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-white text-secondary-dark flex items-center justify-center hover:text-accent hover:shadow-sm transition-all interactive"
                              aria-label="Increase quantity"
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors interactive"
                            aria-label="Remove item"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Section 2: Delivery & Shipping Address */}
              <div className="glass-card p-6 sm:p-8 space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-heading font-bold text-secondary-dark flex items-center gap-2">
                    <FiTruck className="text-accent" />
                    <span>Shipping & Delivery Information</span>
                  </h2>
                  <p className="text-xs font-body text-secondary-dark/60 mt-1">
                    Enter the destination address where your gifts should be delivered.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-body font-semibold text-secondary-dark mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white/70 text-sm font-body text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                        formErrors.fullName ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-body font-semibold text-secondary-dark mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. priya@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white/70 text-sm font-body text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                        formErrors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-body font-semibold text-secondary-dark mb-1">
                      Mobile Number (India) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-secondary-dark/50 font-body">
                        +91
                      </span>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-12 pr-4 py-2.5 rounded-xl border bg-white/70 text-sm font-body text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                          formErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Address Line */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-body font-semibold text-secondary-dark mb-1">
                      Delivery Address (House/Flat No., Building, Street) *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 402, Lotus Residency, 14th Cross, Indiranagar"
                      value={formData.addressLine}
                      onChange={(e) => handleInputChange('addressLine', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white/70 text-sm font-body text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none ${
                        formErrors.addressLine ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.addressLine && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.addressLine}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-body font-semibold text-secondary-dark mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white/70 text-sm font-body text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                        formErrors.city ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.city && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-body font-semibold text-secondary-dark mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Karnataka"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white/70 text-sm font-body text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                        formErrors.state ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.state && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.state}</p>
                    )}
                  </div>

                  {/* PIN Code */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-body font-semibold text-secondary-dark mb-1">
                      PIN Code (6 digits) *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 560038"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white/70 text-sm font-body text-secondary-dark focus:outline-none focus:ring-2 focus:ring-accent/40 max-w-xs ${
                        formErrors.pincode ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.pincode && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.pincode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-32 glass-card p-8 space-y-6">
                <h3 className="text-2xl font-heading font-semibold text-secondary-dark border-b border-gray-100 pb-4">
                  Order Summary
                </h3>

                <div className="space-y-4 font-body text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-secondary-dark">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span className="font-semibold text-secondary-dark">
                      {formatCurrency(gst)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                  <span className="font-heading font-bold text-xl text-secondary-dark">
                    Total Amount
                  </span>
                  <span className="font-body font-bold text-2xl text-accent">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                {/* Friendly Error Notice */}
                {orderError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-body flex items-start gap-2"
                  >
                    <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <div className="flex-1">{orderError}</div>
                  </motion.div>
                )}

                <PremiumButton
                  variant="gradient"
                  className="w-full py-4 text-lg flex items-center justify-center gap-2"
                  onClick={handlePurchase}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Placing Order...</span>
                    </>
                  ) : !currentUser ? (
                    <>
                      <FiLock className="w-4 h-4" />
                      <span>Sign In to Place Order</span>
                    </>
                  ) : (
                    <>
                      <FiShoppingBag className="w-4 h-4" />
                      <span>Place Order</span>
                    </>
                  )}
                </PremiumButton>

                <div className="text-[11px] text-center font-body text-secondary-dark/50 flex items-center justify-center gap-1.5">
                  <FiLock className="w-3 h-3 text-emerald-600" />
                  <span>Secure Direct Order Placement</span>
                </div>

                <button
                  onClick={() => navigate('/shop')}
                  className="w-full mt-2 py-3 font-body font-semibold text-gray-500 hover:text-accent transition-colors interactive flex justify-center items-center gap-2"
                >
                  <FiArrowRight className="w-4 h-4 rotate-180" /> Continue Shopping
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Purchase Animation Modal */}
        <AnimatePresence>
          {isPurchasing && (
            <motion.div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md"></div>

              {!purchaseSuccess ? (
                /* Wrapping Animation (EXACT 2-second timing & ribbon wrap preserved) */
                <motion.div
                  className="relative z-10 w-64 h-64 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border border-gray-100"
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring' }}
                >
                  {/* Gift Ribbon Wrapping Effect */}
                  <motion.div
                    className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 bg-accent"
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, ease: 'easeInOut', delay: 0.5 }}
                  />
                  <motion.div
                    className="absolute z-20 w-16 h-16 rounded-full bg-accent-dark flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 1.5 }}
                  >
                    <span className="text-white font-bold text-xl">V&G</span>
                  </motion.div>
                </motion.div>
              ) : (
                /* Success Popup with Order Confirmation Details */
                <motion.div
                  className="relative z-10 glass-card bg-white p-8 sm:p-10 max-w-lg w-full text-center rounded-3xl shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto"
                  initial={{ scale: 0.5, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  {/* Confetti Particles (EXACT) */}
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={`confetti-${i}`}
                      className="absolute w-3 h-3 rounded-sm pointer-events-none"
                      style={{
                        backgroundColor: [
                          '#F8B8C8',
                          '#FDE4EA',
                          '#E6F7FF',
                          '#EBF7F2',
                          '#fde047',
                        ][Math.floor(Math.random() * 5)],
                        top: '50%',
                        left: '50%',
                      }}
                      animate={{
                        x: (Math.random() - 0.5) * 600,
                        y: (Math.random() - 0.5) * 600 + (Math.random() * 200),
                        rotate: Math.random() * 360,
                        opacity: [1, 1, 0],
                      }}
                      transition={{ duration: 2.5, ease: 'easeOut' }}
                    />
                  ))}

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <FiCheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                  </motion.div>

                  <h2 className="text-3xl font-heading font-bold text-secondary-dark mb-2 flex items-center justify-center gap-2">
                    <span className="text-2xl">🎉</span> Order Placed Successfully!
                  </h2>
                  <p className="text-gray-500 font-body text-sm mb-6">
                    Thank you for shopping with Visit & Gift. Your order has been placed successfully
                    and recorded in our system.
                  </p>

                  {/* Order Confirmation Summary Badge */}
                  {createdOrder && (
                    <div className="bg-primary-bg/70 rounded-2xl p-4 mb-6 border border-pink-100 text-left font-body text-xs space-y-2.5">
                      <div className="flex justify-between items-center pb-2 border-b border-pink-100/60">
                        <span className="text-secondary-dark/60">Order ID:</span>
                        <span className="font-mono font-bold text-secondary-dark bg-white px-2.5 py-0.5 rounded-full border border-pink-100">
                          {createdOrder.orderId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary-dark/60">Customer Name:</span>
                        <span className="font-semibold text-secondary-dark">
                          {createdOrder.customerDetails?.fullName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary-dark/60">Order Status:</span>
                        <span className="font-semibold text-emerald-600 capitalize">
                          {createdOrder.orderStatus}
                        </span>
                      </div>
                      <div className="pt-1">
                        <span className="text-secondary-dark/60 block mb-1">Purchased Products:</span>
                        <div className="space-y-1 bg-white/80 p-2.5 rounded-xl border border-pink-100/50">
                          {createdOrder.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-secondary-dark">
                              <span className="truncate pr-2 font-medium">{it.productName}</span>
                              <span className="font-semibold shrink-0">Qty: {it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-1">
                        <span className="text-secondary-dark/60 block">Delivery Address:</span>
                        <p className="font-medium text-secondary-dark mt-0.5 leading-relaxed">
                          {createdOrder.shippingAddress?.addressLine}, {createdOrder.shippingAddress?.city},{' '}
                          {createdOrder.shippingAddress?.state} -{' '}
                          <span className="font-mono">{createdOrder.shippingAddress?.pincode}</span>
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-pink-100/60">
                        <span className="font-bold text-secondary-dark text-sm">Total Amount:</span>
                        <span className="font-bold text-accent text-base">
                          {formatCurrency(createdOrder.totalAmount)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setIsPurchasing(false);
                        setPurchaseSuccess(false);
                        navigate('/shop');
                      }}
                      className="w-full py-3 rounded-full bg-accent hover:bg-accent-dark text-white font-body font-semibold text-sm transition-colors shadow-md"
                    >
                      Continue Shopping
                    </button>
                    {createdOrder?.orderId && (
                      <button
                        onClick={() => {
                          setIsPurchasing(false);
                          setPurchaseSuccess(false);
                          navigate(`/order/${createdOrder.orderId}`);
                        }}
                        className="w-full py-2.5 rounded-full border border-gray-200 text-sm font-body font-semibold text-secondary-dark hover:bg-gray-50 transition-colors interactive"
                      >
                        View Order Details
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsPurchasing(false);
                        setPurchaseSuccess(false);
                        navigate('/');
                      }}
                      className="font-body text-xs font-semibold text-gray-500 hover:text-accent transition-colors interactive pt-1"
                    >
                      Go Home
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Cart;
