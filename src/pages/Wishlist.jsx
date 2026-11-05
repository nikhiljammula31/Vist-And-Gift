import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart,
  FiShoppingBag,
  FiShoppingCart,
  FiTrash2,
  FiEye,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import PremiumButton from '../components/common/PremiumButton';

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  // Track recently added item IDs for animated CTA feedback
  const [addedItems, setAddedItems] = useState({});

  // Merge saved wishlist snapshots with authoritative PRODUCTS catalogue
  const enrichedItems = useMemo(() => {
    return wishlistItems.map((item) => {
      const numId = Number(item.productId);
      const matched = PRODUCTS.find((p) => p.id === numId);

      if (matched) {
        return {
          ...matched,
          wishlistDocId: item.id,
          addedAt: item.addedAt,
          savedPrice: item.priceAtSave,
        };
      }

      // Fallback for custom or legacy items
      return {
        id: isNaN(numId) ? item.productId : numId,
        wishlistDocId: item.id,
        name: item.productName || 'Custom Gift',
        image: item.productImage || 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=600&auto=format&fit=crop',
        price: typeof item.priceAtSave === 'number' ? `₹${item.priceAtSave}` : (item.priceAtSave || '₹0'),
        category: item.category || 'Gifts',
        description: 'Premium customized Visit & Gift creation.',
        rating: 5.0,
        addedAt: item.addedAt,
        savedPrice: item.priceAtSave,
      };
    });
  }, [wishlistItems]);

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });

    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }, 1800);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-primary-bg">
      {/* Background Decor */}
      <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-secondary-lavender/30 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute top-[40%] -left-20 w-[600px] h-[600px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none opacity-50" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent via-accent-dark to-accent text-white flex items-center justify-center shadow-md shadow-accent/25">
                <FiHeart className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-heading font-bold text-secondary-dark tracking-tight">
                  My Wishlist
                </h1>
                <p className="text-sm font-body text-secondary-dark/60">
                  Your curated luxury gift collection and personalized favorites
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="py-2 px-4 rounded-full bg-pink-50 text-accent-dark text-xs font-semibold font-body border border-pink-200">
              {enrichedItems.length} {enrichedItems.length === 1 ? 'Saved Item' : 'Saved Items'}
            </span>
            <Link
              to="/shop"
              className="py-2 px-4 rounded-xl bg-white/80 hover:bg-white text-secondary-dark text-xs font-semibold font-body border border-gray-200 shadow-sm transition-all"
            >
              Browse Catalogue
            </Link>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-[30px] animate-pulse bg-white border border-[rgba(255,160,185,0.20)] shadow-[0_12px_35px_rgba(225,145,170,0.08)] space-y-4"
              >
                <div className="w-full h-60 bg-gray-100 rounded-[20px]" />
                <div className="h-5 bg-gray-100 rounded-md w-3/4" />
                <div className="h-4 bg-gray-100 rounded-md w-1/2" />
                <div className="h-10 bg-gray-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : enrichedItems.length === 0 ? (
          /* Empty State Requirement: "No Wishlist Items Yet!" */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 sm:p-16 border rounded-[32px] bg-white text-center max-w-2xl mx-auto"
            style={{
              border: '1px solid rgba(255, 160, 185, 0.20)',
              boxShadow: '0 12px 35px rgba(225, 145, 170, 0.08)',
            }}
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 rounded-full bg-pink-100 text-accent-dark flex items-center justify-center border-4 border-white shadow-lg shadow-pink-200/50 animate-pulse">
                <FiHeart className="w-12 h-12 fill-accent-light" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-accent">
                <FiShoppingBag className="w-4 h-4" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark mb-3">
              No Wishlist Items Yet!
            </h2>
            <p className="font-body text-sm sm:text-base text-secondary-dark/70 max-w-md mx-auto mb-8 leading-relaxed">
              Explore our boutique collection of visiting cards, custom corporate gifts, executive diaries, and personalized keepsakes. Save your favorites to purchase later!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <PremiumButton
                onClick={() => navigate('/shop')}
                variant="gradient"
                className="py-3.5 px-8 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <span>Continue Shopping</span>
                <FiArrowRight className="w-4 h-4" />
              </PremiumButton>
            </div>
          </motion.div>
        ) : (
          /* Wishlist Items Grid */
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch"
          >
            <AnimatePresence>
              {enrichedItems.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                  className="group relative rounded-[30px] p-5 bg-white border flex flex-col justify-between h-full transition-all duration-300"
                  style={{
                    border: '1px solid rgba(255, 160, 185, 0.20)',
                    boxShadow: '0 12px 35px rgba(225, 145, 170, 0.08)',
                  }}
                  whileHover={{
                    y: -6,
                    boxShadow: '0 18px 42px rgba(225, 145, 170, 0.16)',
                    borderColor: 'rgba(255, 160, 185, 0.40)',
                  }}
                >
                  <div>
                    {/* Clean Rounded Image Container: No dark background */}
                    <div className="relative h-60 sm:h-64 w-full rounded-[20px] overflow-hidden bg-[#FAF7F7] flex items-center justify-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-[20px] transform group-hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-body font-semibold text-accent-dark border border-pink-100 shadow-sm">
                        {product.category}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(product.id, product.name)}
                        title="Remove from wishlist"
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center shadow-sm transition-all cursor-pointer border border-red-100"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Information Section: Direct on clean light background */}
                    <div className="pt-4 px-1 pb-1">
                      <div className="flex justify-between items-start gap-3 mb-1.5">
                        <Link
                          to={`/product/${product.id}`}
                          className="font-heading font-semibold text-base sm:text-lg text-secondary-dark hover:text-accent transition-colors leading-snug line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <span className="font-body font-bold text-base sm:text-lg text-accent shrink-0">
                          {product.price}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 mb-2 text-amber-400 text-xs">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.floor(product.rating || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-gray-400 font-body text-xs font-medium">
                          ({product.rating || 5.0})
                        </span>
                      </div>

                      {/* Short Description */}
                      <p className="font-body text-xs text-secondary-dark/70 line-clamp-2 leading-relaxed mb-4">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-1 pt-1 pb-1 space-y-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#FDE4EA]/70 border border-[#F8B8C8] hover:border-accent-dark font-body text-sm font-semibold text-secondary-dark flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_2px_10px_rgba(248,184,200,0.15)] hover:shadow-[0_6px_20px_rgba(248,184,200,0.3)] cursor-pointer"
                    >
                      {addedItems[product.id] ? (
                        <>
                          <FiCheckCircle className="w-4 h-4 text-green-600" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <FiShoppingCart className="w-4 h-4 text-secondary-dark" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </motion.button>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/product/${product.id}`}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-pink-50/50 text-secondary-dark text-xs font-semibold font-body border border-pink-100 flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <FiEye className="w-3.5 h-3.5 text-secondary-dark/60" />
                        <span>View Details</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeFromWishlist(product.id, product.name)}
                        className="py-2.5 px-3 rounded-xl bg-red-50/70 hover:bg-red-100 text-red-500 text-xs font-semibold font-body border border-red-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
