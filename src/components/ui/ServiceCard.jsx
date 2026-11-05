import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const ServiceCard = React.memo(({ title, description, image }) => {
  return (
    <motion.div
      className="glass-card group relative p-8 h-full flex flex-col interactive overflow-hidden"
      whileHover={{ scale: 1.05, rotate: 2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Animated gradient border glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent via-secondary-skyblue to-accent opacity-0 group-hover:opacity-10 transition-opacity duration-500 z-0 rounded-[30px]" />
      
      {/* Background color transition on hover */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/40 transition-colors duration-500 z-0 rounded-[30px]" />
      
      <div className="relative z-10 flex-grow">
        <div className="w-full h-48 mb-8 rounded-2xl overflow-hidden relative shadow-md bg-white">
          <motion.img 
            src={image} 
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover origin-center transform group-hover:scale-115 transition-transform duration-700 ease-out"
          />
        </div>
        
        <h3 className="text-2xl font-heading font-semibold mb-3 text-secondary-dark group-hover:text-accent transition-colors duration-300">
          {title}
        </h3>
        
        <p className="font-body text-gray-600 text-sm mb-6 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="relative z-10 mt-auto">
        <motion.button 
          className="flex items-center gap-2 font-body font-semibold text-secondary-dark group-hover:text-accent transition-colors"
          whileHover={{ x: 5 }}
        >
          Explore Service
          <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors shadow-sm">
            <FiArrowRight />
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
});

export default ServiceCard;
