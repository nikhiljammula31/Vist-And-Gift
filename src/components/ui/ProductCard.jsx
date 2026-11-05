import React from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiEye, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

const ProductCard = React.memo(({ id, name, price, rating, image }) => {
  const { addToCart } = useCart();
  return (
    <motion.div
      className="glass-card overflow-hidden group interactive relative"
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Animated gradient border glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent via-transparent to-secondary-skyblue opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-[30px] pointer-events-none" />

      <div className="relative h-64 overflow-hidden bg-white/40 p-6 flex items-center justify-center border-b border-white/20">
        <motion.img 
          src={image} 
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        
        {/* Quick Action Buttons */}
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            whileHover={{ scale: 1.1, backgroundColor: '#F8B8C8', color: 'white' }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-white text-secondary-dark flex items-center justify-center transition-colors translate-y-8 group-hover:translate-y-0 group-hover:opacity-100 shadow-xl"
            style={{ transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0s' }}
          >
            <FiEye className="w-5 h-5" />
          </motion.button>
          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            whileHover={{ scale: 1.1, backgroundColor: '#F8B8C8', color: 'white' }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-white text-secondary-dark flex items-center justify-center transition-colors translate-y-8 group-hover:translate-y-0 group-hover:opacity-100 shadow-xl"
            style={{ transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s' }}
          >
            <FiHeart className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
      
      <div className="p-6 relative z-10 bg-white/30 backdrop-blur-md">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-heading font-semibold text-lg text-secondary-dark">{name}</h4>
          <span className="font-body font-bold text-accent">{price}</span>
        </div>
        
        <div className="flex items-center gap-1 mb-6 text-yellow-400 text-sm">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-gray-500 font-body text-xs ml-1">({rating})</span>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => addToCart({ id, name, price, image })}
          className="w-full py-3 rounded-xl border-2 border-white bg-white/50 font-body text-sm font-semibold text-secondary-dark flex items-center justify-center gap-2 hover:bg-accent hover:text-white hover:border-accent transition-colors interactive shadow-sm"
        >
          <FiShoppingCart className="w-4 h-4" /> Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
});

export default ProductCard;
