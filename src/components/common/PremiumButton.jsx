import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const PremiumButton = ({ children, variant = 'primary', className, onClick, icon = true }) => {
  const baseClasses = "relative overflow-hidden inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body font-semibold text-sm transition-all duration-300 group";
  
  const variants = {
    primary: "bg-primary-bg text-secondary-dark border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(248,184,200,0.3)] hover:border-accent/30",
    gradient: "text-white shadow-[0_8px_20px_rgba(248,184,200,0.4)] hover:shadow-[0_12px_30px_rgba(248,184,200,0.6)]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={twMerge(clsx(baseClasses, variants[variant], className))}
      onClick={onClick}
    >
      {/* Gradient Background for gradient variant */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-dark to-accent opacity-100 group-hover:opacity-90 transition-opacity duration-300" />
      )}
      
      {/* Hover Ripple/Glow Effect for primary variant */}
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-secondary-skyblue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
      )}
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon && (
          <motion.span
            className="inline-block"
            initial={{ x: 0 }}
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FiArrowRight className="w-4 h-4" />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
};

export default PremiumButton;
