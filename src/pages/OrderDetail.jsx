import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiAlertCircle,
  FiShoppingBag,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getOrderById } from '../firebase/orderService';
import PremiumButton from '../components/common/PremiumButton';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      if (!orderId) {
        setError('No order ID specified.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const orderData = await getOrderById(orderId, currentUser?.uid);

        if (!isMounted) return;

        if (!orderData) {
          setError('Order not found. Please verify the order ID or check your order history.');
          setOrder(null);
        } else if (currentUser && orderData.userId !== currentUser.uid) {
          setError('You are not authorized to view this order.');
          setOrder(null);
        } else {
          setOrder(orderData);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching order:', err);
        setError(err.message || 'Unable to retrieve order details.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchOrder();
    }

    return () => {
      isMounted = false;
    };
  }, [orderId, currentUser, authLoading]);

  // Format currency in INR
  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

  // Format timestamp safely
  const formatOrderDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    const d = new Date(timestamp);
    return isNaN(d.getTime())
      ? 'Recently'
      : d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-primary-bg">
      {/* Decorative ambient blobs */}
      <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-secondary-lavender/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-200px] w-[600px] h-[600px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 pointer-events-none"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/my-orders"
            className="inline-flex items-center gap-2 text-sm font-body font-semibold text-secondary-dark/70 hover:text-accent transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to My Orders</span>
          </Link>

          <Link
            to="/shop"
            className="text-xs font-body font-semibold text-secondary-dark/50 hover:text-accent transition-colors"
          >
            Browse Catalog
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="glass-card p-12 text-center border border-white/60 bg-white/70 backdrop-blur-xl space-y-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-heading font-medium text-secondary-dark">
              Loading your order details...
            </p>
          </div>
        ) : error ? (
          /* Error / Not Found State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 text-center border border-white/60 bg-white/80 backdrop-blur-xl max-w-lg mx-auto space-y-5"
          >
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-secondary-dark">Order Notice</h2>
            <p className="text-sm font-body text-secondary-dark/70 leading-relaxed">{error}</p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/my-orders')}
                className="py-2.5 px-6 rounded-full bg-accent hover:bg-accent-dark text-white text-xs font-body font-semibold shadow transition-colors"
              >
                Back to My Orders
              </button>
              <button
                onClick={() => navigate('/shop')}
                className="py-2.5 px-6 rounded-full border border-gray-200 text-xs font-body font-semibold text-secondary-dark hover:bg-white transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        ) : order ? (
          /* Order Details Card */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header Card */}
            <div className="glass-card p-6 sm:p-8 border border-white/60 bg-white/85 backdrop-blur-xl shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs font-mono font-bold tracking-wide uppercase px-3 py-1 rounded-full bg-accent/10 text-accent border border-pink-100">
                      Order #{order.orderId}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark">
                    Order Details
                  </h1>
                </div>

                <div className="sm:text-right font-body text-xs text-secondary-dark/60 flex sm:flex-col gap-2 sm:gap-1 items-start sm:items-end">
                  <span className="flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5 text-accent" />
                    <span>Date of Purchase:</span>
                  </span>
                  <span className="font-semibold text-secondary-dark">
                    {formatOrderDate(order.createdAt)}
                  </span>
                </div>
              </div>

              {/* Summary Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                <div className="p-4 rounded-2xl bg-white/60 border border-gray-100/80">
                  <div className="flex items-center gap-2 text-xs font-body text-secondary-dark/60 mb-1">
                    <FiPackage className="w-4 h-4 text-accent" />
                    <span>Total Items Purchased</span>
                  </div>
                  <p className="font-heading font-semibold text-sm text-secondary-dark">
                    {order.items?.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 1), 0) ||
                      0}{' '}
                    units
                  </p>
                  <p className="text-xs font-body text-secondary-dark/50 mt-0.5">
                    {order.items?.length || 0} unique product
                    {order.items?.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-gray-100/80">
                  <div className="flex items-center gap-2 text-xs font-body text-secondary-dark/60 mb-1">
                    <FiShoppingBag className="w-4 h-4 text-accent" />
                    <span>Final Order Total</span>
                  </div>
                  <p className="font-heading font-bold text-xl text-accent">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-xs font-body text-emerald-600 mt-0.5">
                    Inclusive of GST & delivery
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Details & Shipping Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Information / Customer Details */}
              <div className="glass-card p-6 border border-white/60 bg-white/80 backdrop-blur-xl">
                <div className="flex items-center gap-2 font-heading font-semibold text-base text-secondary-dark mb-4 pb-3 border-b border-gray-100">
                  <FiUser className="w-4 h-4 text-accent" />
                  <span>Customer Information</span>
                </div>
                <div className="space-y-3 font-body text-sm text-secondary-dark/80">
                  <div>
                    <span className="text-xs text-secondary-dark/50 block">Customer Name</span>
                    <span className="font-semibold text-secondary-dark">
                      {order.customerDetails?.fullName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="w-3.5 h-3.5 text-accent" />
                    <span>{order.customerDetails?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-3.5 h-3.5 text-accent" />
                    <span>+91 {order.customerDetails?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="glass-card p-6 border border-white/60 bg-white/80 backdrop-blur-xl">
                <div className="flex items-center gap-2 font-heading font-semibold text-base text-secondary-dark mb-4 pb-3 border-b border-gray-100">
                  <FiMapPin className="w-4 h-4 text-accent" />
                  <span>Delivery Address</span>
                </div>
                <div className="space-y-2 font-body text-sm text-secondary-dark/80">
                  <p className="font-semibold text-secondary-dark">
                    {order.customerDetails?.fullName}
                  </p>
                  <p className="leading-relaxed">{order.shippingAddress?.addressLine}</p>
                  <p>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                    <span className="font-mono font-semibold">
                      {order.shippingAddress?.pincode}
                    </span>
                  </p>
                  <p className="text-xs text-secondary-dark/50">India</p>
                </div>
              </div>
            </div>

            {/* Purchased Products Table / List */}
            <div className="glass-card p-6 sm:p-8 border border-white/60 bg-white/85 backdrop-blur-xl">
              <h2 className="font-heading font-bold text-xl text-secondary-dark mb-6">
                Purchased Products
              </h2>

              <div className="divide-y divide-gray-100">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 rounded-xl bg-white/70 p-1.5 border border-gray-100 shrink-0 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-base text-secondary-dark">
                          {item.productName}
                        </h3>
                        <p className="font-body text-xs text-secondary-dark/60">
                          Unit Price: {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto font-body text-sm">
                      <div className="text-secondary-dark/70">
                        <span className="text-xs text-secondary-dark/50 mr-1">Quantity:</span>
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                      <div className="font-heading font-bold text-base text-secondary-dark min-w-[90px] text-right">
                        {formatCurrency(item.subtotal || item.unitPrice * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary Financial Breakdown */}
              <div className="border-t border-gray-100 mt-6 pt-6 space-y-3 font-body text-sm">
                <div className="flex justify-between text-secondary-dark/70">
                  <span>Subtotal</span>
                  <span className="font-semibold text-secondary-dark">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-secondary-dark/70">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-emerald-600">
                    {order.deliveryCharge === 0 || !order.deliveryCharge
                      ? 'FREE'
                      : formatCurrency(order.deliveryCharge)}
                  </span>
                </div>
                <div className="border-t border-gray-200/60 pt-3 flex justify-between items-center text-base">
                  <span className="font-heading font-bold text-secondary-dark">Final Total</span>
                  <span className="font-heading font-bold text-2xl text-accent">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-2">
              <button
                onClick={() => navigate('/my-orders')}
                className="py-3 px-8 rounded-full border border-gray-200 text-sm font-body font-semibold text-secondary-dark hover:bg-white/80 transition-colors w-full sm:w-auto text-center"
              >
                Back to My Orders
              </button>

              <PremiumButton
                onClick={() => navigate('/shop')}
                variant="primary"
                className="py-3 px-8 text-sm w-full sm:w-auto"
              >
                Continue Shopping
              </PremiumButton>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderDetail;
