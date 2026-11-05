import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { FiShoppingCart } from 'react-icons/fi';
import PremiumButton from '../common/PremiumButton';
import { useQuote } from '../../context/QuoteContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { openQuoteModal } = useQuote();
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop Gifts', path: '/shop' },
    { name: 'Services', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <motion.header
      className={clsx(
        'fixed top-0 left-0 right-0 z-[90] transition-all duration-500',
        scrolled ? 'py-4 glass-nav scale-95 md:scale-100' : 'py-6 bg-transparent'
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-heading font-bold text-secondary-dark tracking-tight">
          Visit <span className="text-accent">&</span> Gift
        </NavLink>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) => clsx(
                "relative font-body text-sm font-medium transition-colors hover:text-accent group interactive",
                isActive ? "text-accent" : "text-secondary-dark/80"
              )}
            >
              {({ isActive }) => (
                <>
                  {link.name}
                  <motion.div
                    className={clsx(
                      "absolute -bottom-1 left-0 h-[2px] bg-accent",
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    )}
                    layoutId={isActive ? "activeTab" : undefined}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/cart" className="relative group text-secondary-dark hover:text-accent transition-colors interactive">
            <FiShoppingCart className="w-6 h-6" />
            <motion.span 
              className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: totalItems > 0 ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {totalItems}
            </motion.span>
          </NavLink>
          <PremiumButton variant={scrolled ? 'gradient' : 'primary'} className="py-2.5 px-6" onClick={openQuoteModal}>
            Get Quote
          </PremiumButton>
        </div>

        {/* Mobile menu button could go here */}
      </div>
    </motion.header>
  );
};

export default Navbar;
