import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiEye, FiShoppingCart } from 'react-icons/fi';
import clsx from 'clsx';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useWishlist } from '../../context/WishlistContext';

const ProductCard = React.memo(({ id, name, price, rating, image, category }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isSaved = isInWishlist(id);

  const handleAddToCart = () => {
    const product = { id, name, price, image };
    if (!currentUser) {
      openAuthModal({
        title: 'Sign in to continue!',
        message:
          'Create an account or log in to enjoy a seamless shopping experience, manage your orders and access your personalized account.',
        pendingAction: {
          type: 'ADD_TO_CART',
          product,
        },
      });
      return;
    }
    addToCart(product);
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    toggleWishlist({ id, name, price, image, category });
  };

  return (
    <motion.div
      className="group interactive relative rounded-[30px] p-5 bg-white border transition-all duration-300 flex flex-col justify-between h-full"
      style={{
        border: '1px solid rgba(255, 160, 185, 0.20)',
        boxShadow: '0 12px 35px rgba(225, 145, 170, 0.08)',
      }}
      whileHover={{
        y: -6,
        boxShadow: '0 18px 42px rgba(225, 145, 170, 0.16)',
        borderColor: 'rgba(255, 160, 185, 0.40)',
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <div>
        {/* Product Image Container: Clean rounded rectangle, no dark backgrounds */}
        <div
          onClick={() => navigate(`/product/${id}`)}
          className="relative h-60 sm:h-64 w-full rounded-[20px] overflow-hidden bg-[#FAF7F7] flex items-center justify-center cursor-pointer select-none"
        >
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover rounded-[20px] transform group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Quick View Button: Floating top-left, clean and subtle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${id}`);
            }}
            title="View Product Details"
            className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-secondary-dark hover:text-accent shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-pink-100/60"
          >
            <FiEye className="w-4 h-4" />
          </button>

          {/* Account-Only Wishlist Button: Floating top-right, visible ONLY for logged-in users */}
          {currentUser && (
            <button
              type="button"
              onClick={handleWishlistToggle}
              title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all cursor-pointer border border-pink-100/60"
            >
              <FiHeart
                className={clsx(
                  'w-4 h-4 transition-transform duration-200',
                  isSaved
                    ? 'fill-accent text-accent scale-110'
                    : 'text-secondary-dark/60 hover:text-accent'
                )}
              />
            </button>
          )}
        </div>

        {/* Product Information Section: Direct on clean light background */}
        <div className="pt-4 px-1 pb-1">
          {/* Product Name (left) & Price (right) */}
          <div className="flex justify-between items-start gap-3 mb-1.5">
            <h4
              onClick={() => navigate(`/product/${id}`)}
              className="font-heading font-semibold text-base sm:text-lg text-secondary-dark cursor-pointer hover:text-accent transition-colors leading-snug line-clamp-1"
              title={name}
            >
              {name}
            </h4>
            <span className="font-body font-bold text-base sm:text-lg text-accent shrink-0">
              {price}
            </span>
          </div>

          {/* Rating Stars underneath name + Review count */}
          <div className="flex items-center gap-1.5 mb-5 text-amber-400 text-xs">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-400 font-body text-xs font-medium">({rating})</span>
          </div>
        </div>
      </div>

      {/* Add to Cart Button: White/transparent, soft pink border, dark text, shopping cart icon */}
      <div className="px-1 pt-1 pb-1">
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#FDE4EA]/70 border border-[#F8B8C8] hover:border-accent-dark font-body text-sm font-semibold text-secondary-dark flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_2px_10px_rgba(248,184,200,0.15)] hover:shadow-[0_6px_20px_rgba(248,184,200,0.3)] cursor-pointer"
        >
          <FiShoppingCart className="w-4 h-4 text-secondary-dark" />
          <span>Add to Cart</span>
        </motion.button>
      </div>
    </motion.div>
  );
});

export default ProductCard;
