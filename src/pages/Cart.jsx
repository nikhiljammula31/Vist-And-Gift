import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import PremiumButton from '../components/common/PremiumButton';

// Helper to parse price (e.g., "$24.00" -> 24.00 or "₹199" -> 199)
const parsePrice = (priceStr) => {
  return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
};

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const { subtotal, gst, grandTotal } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + parsePrice(item.price) * item.quantity, 0);
    const tax = sub * 0.18; // 18% GST
    return { subtotal: sub, gst: tax, grandTotal: sub + tax };
  }, [cartItems]);

  // Formatting currency to INR since we are converting to Indian Region
  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  const handlePurchase = () => {
    setIsPurchasing(true);
    // Sequence: Ribbon Wrap (1s) -> Confetti & Checkmark (1s) -> Popup
    setTimeout(() => {
      setPurchaseSuccess(true);
      clearCart();
    }, 2000);
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
            <h2 className="text-2xl font-heading font-semibold text-secondary-dark mb-4">Your cart is empty</h2>
            <p className="text-gray-500 font-body mb-8">Looks like you haven't added any premium gifts yet.</p>
            <PremiumButton onClick={() => navigate('/shop')} variant="primary">
              Continue Shopping
            </PremiumButton>
          </div>
        ) : !purchaseSuccess ? (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Cart Items */}
            <div className="w-full lg:w-2/3 space-y-6">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -50 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-[0_8px_30px_rgba(248,184,200,0.15)] transition-all"
                  >
                    <div className="w-32 h-32 rounded-2xl bg-white/50 p-2 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    
                    <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="text-center sm:text-left">
                        <h3 className="font-heading font-semibold text-xl text-secondary-dark mb-1">{item.name}</h3>
                        <p className="font-body text-accent font-bold mb-4 sm:mb-0">₹{parsePrice(item.price).toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 bg-white/40 rounded-full px-2 py-1 border border-white/20">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-white text-secondary-dark flex items-center justify-center hover:text-accent hover:shadow-sm transition-all interactive"
                          >
                            <FiMinus className="w-3 h-3" />
                          </button>
                          <span className="font-body font-semibold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-white text-secondary-dark flex items-center justify-center hover:text-accent hover:shadow-sm transition-all interactive"
                          >
                            <FiPlus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {/* Remove */}
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors interactive"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-32 glass-card p-8">
                <h3 className="text-2xl font-heading font-semibold text-secondary-dark mb-6 border-b border-gray-100 pb-4">Order Summary</h3>
                
                <div className="space-y-4 font-body text-gray-600 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-secondary-dark">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span className="font-semibold text-secondary-dark">{formatCurrency(gst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-green-500">Free</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6 mb-8 flex justify-between items-center">
                  <span className="font-heading font-bold text-xl text-secondary-dark">Grand Total</span>
                  <span className="font-body font-bold text-2xl text-accent">{formatCurrency(grandTotal)}</span>
                </div>

                <PremiumButton variant="gradient" className="w-full py-4 text-lg" onClick={handlePurchase}>
                  Purchase Order
                </PremiumButton>
                
                <button 
                  onClick={() => navigate('/shop')}
                  className="w-full mt-4 py-3 font-body font-semibold text-gray-500 hover:text-accent transition-colors interactive flex justify-center items-center gap-2"
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
              className="fixed inset-0 z-[110] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md"></div>
              
              {!purchaseSuccess ? (
                /* Wrapping Animation */
                <motion.div 
                  className="relative z-10 w-64 h-64 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border border-gray-100"
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring" }}
                >
                  {/* Gift Ribbon Wrapping Effect */}
                  <motion.div 
                    className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 bg-accent"
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                  <motion.div 
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
                  />
                  <motion.div 
                    className="absolute z-20 w-16 h-16 rounded-full bg-accent-dark flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.5 }}
                  >
                    <span className="text-white font-bold text-xl">V&G</span>
                  </motion.div>
                </motion.div>
              ) : (
                /* Success Popup */
                <motion.div
                  className="relative z-10 glass-card bg-white p-10 max-w-md w-full text-center rounded-3xl"
                  initial={{ scale: 0.5, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  {/* Confetti Particles */}
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={`confetti-${i}`}
                      className="absolute w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: ['#F8B8C8', '#FDE4EA', '#E6F7FF', '#EBF7F2', '#fde047'][Math.floor(Math.random() * 5)],
                        top: '50%',
                        left: '50%',
                      }}
                      animate={{
                        x: (Math.random() - 0.5) * 600,
                        y: (Math.random() - 0.5) * 600 + (Math.random() * 200),
                        rotate: Math.random() * 360,
                        opacity: [1, 1, 0],
                      }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                    />
                  ))}
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <FiCheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-heading font-bold text-secondary-dark mb-4 flex items-center justify-center gap-2">
                    <span className="text-2xl">🎉</span> Order Placed!
                  </h2>
                  <p className="text-gray-500 font-body mb-8">
                    Thank you for shopping with Visit & Gift. Your premium order has been successfully confirmed.
                  </p>
                  
                  <div className="flex flex-col gap-4">
                    <PremiumButton variant="gradient" onClick={() => {
                      setIsPurchasing(false);
                      setPurchaseSuccess(false);
                      navigate('/');
                    }}>
                      Go Home
                    </PremiumButton>
                    <button 
                      onClick={() => {
                        setIsPurchasing(false);
                        setPurchaseSuccess(false);
                        navigate('/shop');
                      }}
                      className="font-body font-semibold text-gray-500 hover:text-accent transition-colors interactive"
                    >
                      Continue Shopping
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
