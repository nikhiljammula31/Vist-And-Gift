import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage,
  FiShoppingBag,
  FiArrowRight,
  FiArrowLeft,
  FiSearch,
  FiCalendar,
  FiX,
  FiLayers,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getCustomerOrders, getOrderTimestamp } from '../firebase/orderService';
import PremiumButton from '../components/common/PremiumButton';

const MyOrders = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadedSuccessfully, setIsLoadedSuccessfully] = useState(false);

  // Search and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

  const displayName = userProfile?.fullName || currentUser?.displayName || 'Customer';

  // Format currency helper in INR
  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

  // Format timestamp helper
  const formatOrderDate = (order) => {
    const ms = getOrderTimestamp(order);
    if (!ms) return 'Recently';
    return new Date(ms).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getCustomerOrders(currentUser.uid, 'desc');
      if (isMountedRef.current) {
        setOrders(data || []);
        setIsLoadedSuccessfully(true);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error loading customer orders:', err);
        setIsLoadedSuccessfully(false);
        const friendlyMessage =
          err?.code === 'permission-denied'
            ? 'Access to orders was not authorized. Please verify your login session.'
            : err?.code === 'failed-precondition'
            ? 'Firestore query indexing is required. Please check your Firestore index settings.'
            : err?.message || 'Unable to load your order history. Please try again.';
        setError(friendlyMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!authLoading && currentUser?.uid) {
      fetchOrders();
    } else if (!authLoading && !currentUser) {
      setLoading(false);
    }
  }, [authLoading, currentUser, fetchOrders]);

  // Dashboard Statistics calculated strictly upon genuine successful order retrieval
  const stats = useMemo(() => {
    if (!isLoadedSuccessfully || error) {
      return { totalOrders: null, totalItems: null, totalValue: null };
    }
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, ord) => {
      const itemsCount = ord.items?.reduce((s, it) => s + (parseInt(it.quantity, 10) || 1), 0) || 0;
      return sum + itemsCount;
    }, 0);
    const totalValue = orders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);

    return { totalOrders, totalItems, totalValue };
  }, [orders, isLoadedSuccessfully, error]);

  // Filtered & Sorted orders list
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // Search filter: Order ID or Product Name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((ord) => {
        const matchesId = (ord.orderId || '').toLowerCase().includes(q);
        const matchesProduct = ord.items?.some((it) =>
          (it.productName || it.name || '').toLowerCase().includes(q)
        );
        return matchesId || matchesProduct;
      });
    }

    // Sort order: Newest first vs Oldest first
    result.sort((a, b) => {
      const timeA = getOrderTimestamp(a);
      const timeB = getOrderTimestamp(b);
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [orders, searchQuery, sortBy]);

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-primary-bg">
      {/* Decorative Background Glows */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-accent/20 rounded-full filter blur-[100px] pointer-events-none animate-float" />
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-secondary-lavender/40 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-sm font-body font-semibold text-secondary-dark/70 hover:text-accent transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Link>
          <span className="text-xs font-body uppercase tracking-wider text-secondary-dark/40 font-semibold">
            Customer Dashboard
          </span>
        </div>

        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card p-6 sm:p-10 mb-8 border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(248,184,200,0.2)]"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-light via-white to-accent/30 shadow-md shadow-accent/20 border border-white flex items-center justify-center shrink-0">
                <FiPackage className="w-8 h-8 text-accent-dark" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark">
                  My <span className="text-accent">Orders</span>
                </h1>
                <p className="text-sm font-body text-secondary-dark/60 mt-1">
                  Welcome back, <span className="font-semibold text-secondary-dark">{displayName}</span>. Review all your previous purchases and order details.
                </p>
              </div>
            </div>

            <Link
              to="/shop"
              className="py-2.5 px-6 rounded-full bg-white hover:bg-gray-50 text-secondary-dark font-body text-xs font-semibold border border-gray-200 hover:border-accent/40 shadow-sm flex items-center gap-2 transition-all shrink-0"
            >
              <FiShoppingBag className="w-4 h-4 text-accent-dark" />
              <span>Explore Shop</span>
            </Link>
          </div>

          {/* Section 2: Dashboard Statistics Cards - rendered only upon successful retrieval, never displaying false zero statistics on error */}
          {!error && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
              {/* Total Orders */}
              <div className="p-4 rounded-2xl bg-white/60 border border-pink-100/70 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body font-semibold text-secondary-dark/60">
                    Total Orders
                  </span>
                  <span className="p-2 rounded-xl bg-accent-light/50 text-accent-dark">
                    <FiPackage className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-2xl font-heading font-bold text-secondary-dark mt-2">
                  {loading ? '...' : isLoadedSuccessfully ? stats.totalOrders : '--'}
                </p>
                <p className="text-[11px] font-body text-secondary-dark/50 mt-0.5">
                  Lifetime completed purchases
                </p>
              </div>

              {/* Total Items Purchased */}
              <div className="p-4 rounded-2xl bg-white/60 border border-pink-100/70 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body font-semibold text-secondary-dark/60">
                    Items Purchased
                  </span>
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <FiLayers className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-2xl font-heading font-bold text-secondary-dark mt-2">
                  {loading ? '...' : isLoadedSuccessfully ? stats.totalItems : '--'}
                </p>
                <p className="text-[11px] font-body text-secondary-dark/50 mt-0.5">
                  Total gift units ordered
                </p>
              </div>

              {/* Total Order Value in INR */}
              <div className="p-4 rounded-2xl bg-white/60 border border-pink-100/70 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body font-semibold text-secondary-dark/60">
                    Total Order Value
                  </span>
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs">
                    ₹
                  </span>
                </div>
                <p className="text-2xl font-heading font-bold text-accent mt-2">
                  {loading ? '...' : isLoadedSuccessfully ? formatCurrency(stats.totalValue) : '--'}
                </p>
                <p className="text-[11px] font-body text-secondary-dark/50 mt-0.5">
                  Inclusive of GST & delivery
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Section 5: Search & Sort Controls (Shown when orders exist) */}
        {!loading && orders.length > 0 && (
          <div className="glass-card p-4 sm:p-5 mb-8 border border-white/60 bg-white/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute left-3.5 top-3 w-4 h-4 text-secondary-dark/40" />
              <input
                type="text"
                placeholder="Search by Order ID or Product Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-gray-200 bg-white/80 text-xs font-body text-secondary-dark placeholder-secondary-dark/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-secondary-dark/40 hover:text-secondary-dark"
                  aria-label="Clear search"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center justify-between w-full md:w-auto gap-3 text-xs font-body">
              <span className="text-secondary-dark/50 hidden sm:inline">Sort:</span>
              <div className="inline-flex rounded-xl p-1 bg-white border border-gray-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setSortBy('newest')}
                  className={`py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                    sortBy === 'newest'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-secondary-dark/60 hover:text-accent'
                  }`}
                >
                  Newest First
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('oldest')}
                  className={`py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                    sortBy === 'oldest'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-secondary-dark/60 hover:text-accent'
                  }`}
                >
                  Oldest First
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {authLoading || loading ? (
          /* Loading Skeletons */
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-card p-6 border border-white/60 bg-white/70 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded"></div>
                </div>
                <div className="h-16 bg-gray-100 rounded-xl"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  <div className="h-9 w-28 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 border border-white/60 bg-white/80 text-center space-y-4 max-w-md mx-auto"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-bold text-xl text-secondary-dark">
              Unable to Load Orders
            </h3>
            <p className="text-xs font-body text-secondary-dark/60">{error}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 py-2 px-6 rounded-full bg-accent text-white text-xs font-body font-semibold shadow hover:bg-accent-dark transition-colors cursor-pointer"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </motion.div>
        ) : orders.length === 0 ? (
          /* Section 6: Empty Order History */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 sm:p-16 border border-white/60 bg-white/80 backdrop-blur-xl text-center space-y-4 max-w-2xl mx-auto shadow-lg"
          >
            <div className="w-20 h-20 rounded-3xl bg-accent-light/60 text-accent-dark border border-pink-100 flex items-center justify-center mx-auto mb-2">
              <FiShoppingBag className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark">
              No Orders Yet!
            </h2>

            <p className="text-sm font-body text-secondary-dark/60 max-w-md mx-auto leading-relaxed">
              Your order history is waiting for its first special purchase. Explore our premium gifts and visiting cards to get started.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <PremiumButton
                onClick={() => navigate('/shop')}
                variant="gradient"
                className="py-3 px-8 text-sm"
              >
                Continue Shopping
              </PremiumButton>

              <Link
                to="/services"
                className="py-3 px-6 rounded-full font-body font-semibold text-sm text-secondary-dark/80 hover:text-accent bg-white border border-gray-200 hover:border-accent/40 transition-all inline-flex items-center gap-1.5"
              >
                <span>Visiting Cards</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ) : filteredAndSortedOrders.length === 0 ? (
          /* No Search Results */
          <div className="glass-card p-12 text-center border border-white/60 bg-white/75 space-y-3">
            <FiSearch className="w-8 h-8 text-secondary-dark/40 mx-auto" />
            <h3 className="text-lg font-heading font-bold text-secondary-dark">
              No orders matching &ldquo;{searchQuery}&rdquo;
            </h3>
            <p className="text-xs font-body text-secondary-dark/60">
              Try searching with another order ID or product keyword.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSearchQuery('')}
                className="py-2 px-5 rounded-full border border-gray-200 text-xs font-body font-semibold text-secondary-dark hover:bg-white transition-colors"
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          /* Section 3: Order History Cards */
          <div className="space-y-6">
            <AnimatePresence>
              {filteredAndSortedOrders.map((order) => {
                const totalItemQuantity =
                  order.items?.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 1), 0) || 0;
                const uniqueProductCount = order.items?.length || 0;
                const primaryItem = order.items?.[0] || {};
                const otherCount = uniqueProductCount - 1;

                return (
                  <motion.div
                    key={order.orderId}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="glass-card p-6 sm:p-8 border border-white/70 bg-white/85 backdrop-blur-xl rounded-3xl shadow-md hover:shadow-xl transition-all"
                  >
                    {/* Top Row: Order ID & Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-accent/10 text-accent border border-pink-100">
                          #{order.orderId}
                        </span>
                        <span className="text-xs font-body text-secondary-dark/50">
                          {uniqueProductCount} product{uniqueProductCount === 1 ? '' : 's'} &bull; {totalItemQuantity} unit{totalItemQuantity === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-body text-secondary-dark/60">
                        <FiCalendar className="w-3.5 h-3.5 text-accent" />
                        <span>{formatOrderDate(order)}</span>
                      </div>
                    </div>

                    {/* Middle Row: Product Preview & Details */}
                    <div className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        {/* Product Image / Thumbnails */}
                        <div className="flex -space-x-4 shrink-0">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="w-16 h-16 rounded-2xl bg-white p-1.5 border-2 border-white shadow-sm overflow-hidden shrink-0 relative z-[3]"
                              style={{ zIndex: 3 - idx }}
                            >
                              <img
                                src={item.image}
                                alt={item.productName || 'Product'}
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                            </div>
                          ))}
                          {otherCount > 2 && (
                            <div className="w-16 h-16 rounded-2xl bg-pink-50 border-2 border-white shadow-sm flex items-center justify-center text-xs font-body font-bold text-accent shrink-0">
                              +{otherCount - 2}
                            </div>
                          )}
                        </div>

                        {/* Product Summary */}
                        <div className="space-y-1">
                          <h3 className="font-heading font-semibold text-base text-secondary-dark leading-snug">
                            {primaryItem.productName || 'Customized Gift'}
                            {otherCount > 0 && (
                              <span className="text-xs font-normal text-secondary-dark/60 block sm:inline sm:ml-1">
                                + {otherCount} other item{otherCount === 1 ? '' : 's'}
                              </span>
                            )}
                          </h3>
                          <p className="text-xs font-body text-secondary-dark/50">
                            Purchased quantity: <span className="font-semibold text-secondary-dark">{totalItemQuantity}</span>
                          </p>
                        </div>
                      </div>

                      {/* Financial Amount & Action Button */}
                      <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                        <div>
                          <span className="text-[11px] font-body text-secondary-dark/50 block">
                            Total Order Amount
                          </span>
                          <span className="font-heading font-bold text-xl text-accent">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/order/${order.orderId}`)}
                          className="py-2.5 px-6 rounded-full bg-accent hover:bg-accent-dark text-white font-body font-semibold text-xs transition-all shadow-md shadow-accent/20 flex items-center gap-1.5 shrink-0 interactive"
                        >
                          <span>View Details</span>
                          <FiArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
