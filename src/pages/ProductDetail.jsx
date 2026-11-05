import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiShoppingCart,
  FiCheck,
  FiStar,
  FiShield,
  FiTruck,
  FiGift,
  FiCheckCircle,
  FiHeart,
} from 'react-icons/fi';
import clsx from 'clsx';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useWishlist } from '../context/WishlistContext';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [added, setAdded] = useState(false);

  const product = PRODUCTS.find((p) => String(p.id) === String(productId)) || PRODUCTS[0];
  const isSaved = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!currentUser) {
      openAuthModal({
        title: 'Sign in to continue!',
        message:
          'Create an account or log in to enjoy a seamless shopping experience, save items to your cart, and manage your orders.',
        pendingAction: {
          type: 'ADD_TO_CART',
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
          },
        },
        redirectTo: `/product/${product.id}`,
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlistToggle = () => {
    if (!currentUser) return;
    toggleWishlist(product);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-24 bg-primary-bg px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-secondary-lavender/30 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute top-[40%] -left-20 w-[600px] h-[600px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none opacity-50" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Breadcrumb / Back button */}
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-body font-semibold text-secondary-dark/70 hover:text-accent transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>

          <span className="text-xs font-body font-semibold uppercase tracking-wider text-accent-dark bg-pink-50 border border-pink-100 py-1 px-3 rounded-full">
            {product.category}
          </span>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Product Image Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-10 rounded-[32px] bg-white border overflow-hidden relative"
            style={{
              border: '1px solid rgba(255, 160, 185, 0.20)',
              boxShadow: '0 12px 35px rgba(225, 145, 170, 0.08)',
            }}
          >
            {/* Account-Only Saved Heart indicator if in wishlist */}
            {currentUser && isSaved && (
              <div
                title="Saved to your Wishlist"
                className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-pink-300/50"
              >
                <FiHeart className="w-5 h-5 fill-white" />
              </div>
            )}

            <div className="aspect-square w-full rounded-[24px] overflow-hidden bg-[#FAF7F7] flex items-center justify-center p-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-[20px] drop-shadow-sm hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 text-center font-body text-xs text-secondary-dark/70">
              <div className="p-3 rounded-2xl bg-[#FAF7F7] border border-pink-50 flex flex-col items-center gap-1">
                <FiGift className="w-4 h-4 text-accent-dark" />
                <span className="font-semibold text-secondary-dark">Custom Gift</span>
                <span className="text-[10px] text-gray-500">Free Box</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F7] border border-pink-50 flex flex-col items-center gap-1">
                <FiTruck className="w-4 h-4 text-accent-dark" />
                <span className="font-semibold text-secondary-dark">Free Shipping</span>
                <span className="text-[10px] text-gray-500">All India</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F7] border border-pink-50 flex flex-col items-center gap-1">
                <FiShield className="w-4 h-4 text-accent-dark" />
                <span className="font-semibold text-secondary-dark">Quality Assured</span>
                <span className="text-[10px] text-gray-500">100% Luxury</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Information & Interactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <p className="text-xs font-body font-semibold uppercase tracking-wider text-accent-dark dark:text-pink-300 mb-1">
                {product.category}
              </p>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-secondary-dark tracking-tight">
                {product.name}
              </h1>

              {/* Rating and Price */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pb-6 border-b border-gray-200/80">
                <div className="text-3xl font-body font-bold text-accent">
                  {product.price}
                </div>

                <div className="flex items-center gap-1.5 bg-yellow-50/80 border border-yellow-200/60 py-1 px-3 rounded-full text-xs font-body font-semibold text-yellow-700">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{product.rating} / 5.0 Customer Rating</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-secondary-dark/60 mb-2">
                About this item
              </h2>
              <p className="font-body text-secondary-dark/80 text-sm sm:text-base leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Key Features */}
            {product.features && (
              <div>
                <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-secondary-dark/60 mb-3">
                  Product Features
                </h2>
                <ul className="space-y-2 font-body text-xs sm:text-sm text-secondary-dark/80">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-accent/20 text-accent-dark flex items-center justify-center shrink-0 mt-0.5">
                        <FiCheck className="w-2.5 h-2.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && (
              <div className="pt-2">
                <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-secondary-dark/60 mb-3">
                  Specifications
                </h2>
                <div className="grid grid-cols-2 gap-3 font-body text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-white border border-pink-50"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-dark/50 capitalize mb-0.5">
                        {key}
                      </p>
                      <p className="font-medium text-secondary-dark">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart & Wishlist CTA */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-accent via-accent-dark to-accent text-white font-body font-semibold text-base shadow-[0_10px_25px_rgba(248,184,200,0.5)] hover:shadow-[0_14px_32px_rgba(248,184,200,0.7)] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  {added ? (
                    <>
                      <FiCheckCircle className="w-5 h-5 text-white" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <FiShoppingCart className="w-5 h-5" />
                      <span>Add to Cart • {product.price}</span>
                    </>
                  )}
                </motion.button>

                {/* Account-Only Wishlist Control: Visible ONLY for Logged-In Users */}
                {currentUser && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleWishlistToggle}
                    title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    className={clsx(
                      'p-4 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm',
                      isSaved
                        ? 'bg-pink-50 border-accent text-accent-dark'
                        : 'bg-white border-pink-100 text-secondary-dark hover:border-accent hover:text-accent'
                    )}
                  >
                    <FiHeart
                      className={clsx(
                        'w-6 h-6 transition-transform',
                        isSaved ? 'fill-accent text-accent scale-110' : ''
                      )}
                    />
                  </motion.button>
                )}
              </div>

              {!currentUser && (
                <p className="text-center text-xs font-body text-secondary-dark/50">
                  Guest viewing enabled. Signing in is required only when adding to cart.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
