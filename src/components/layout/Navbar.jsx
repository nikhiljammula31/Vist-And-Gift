import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiPackage,
  FiChevronDown,
  FiMenu,
  FiX,
  FiCheckCircle,
  FiHeart,
} from 'react-icons/fi';
import PremiumButton from '../common/PremiumButton';
import { useQuote } from '../../context/QuoteContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { openQuoteModal } = useQuote();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { currentUser, userProfile, isEmailVerified, loading, logout } = useAuth();
  const navigate = useNavigate();

  // User is considered fully authenticated only when loading is complete, user exists, and email is verified
  const isAuthedAndVerified = Boolean(!loading && currentUser && isEmailVerified);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle outside click for user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Conditionally configure navigation links based on authentication state
  // Logged-in: Home | Shop Gifts | Services | About | Contact
  // Logged-out: Home | Services | About
  const navLinks = isAuthedAndVerified
    ? [
        { name: 'Home', path: '/' },
        { name: 'Shop Gifts', path: '/shop' },
        { name: 'Services', path: '/services' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
        { name: 'About', path: '/about' },
      ];

  const displayName = userProfile?.fullName || currentUser?.displayName || 'Customer';

  const getInitials = (name) => {
    if (!name) return 'VG';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

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
        {/* Brand Logo */}
        <NavLink
          to="/"
          className="text-2xl font-heading font-bold text-secondary-dark tracking-tight"
        >
          Visit <span className="text-accent">&</span> Gift
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                clsx(
                  'relative font-body text-sm font-medium transition-colors hover:text-accent group interactive',
                  isActive ? 'text-accent' : 'text-secondary-dark/80'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.name}
                  <motion.div
                    className={clsx(
                      'absolute -bottom-1 left-0 h-[2px] bg-accent',
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    )}
                    layoutId={isActive ? 'activeTab' : undefined}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Action Cluster */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthedAndVerified ? (
            <>
              {/* Shopping Cart Icon */}
              <NavLink
                to="/cart"
                className="relative group text-secondary-dark hover:text-accent transition-colors interactive"
                aria-label="Shopping Cart"
              >
                <FiShoppingCart className="w-6 h-6" />
                <motion.span
                  className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: totalItems > 0 ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  {totalItems}
                </motion.span>
              </NavLink>

              {/* Customer Profile Icon & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 py-1.5 px-3 rounded-full bg-white/70 hover:bg-white border border-pink-100 hover:border-accent/40 shadow-sm transition-all text-secondary-dark font-body text-sm cursor-pointer select-none"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={displayName}
                      className="w-7 h-7 rounded-full object-cover border border-white"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs">
                      {getInitials(displayName)}
                    </div>
                  )}
                  <span className="font-medium max-w-[110px] truncate">{displayName}</span>
                  <FiChevronDown
                    className={clsx(
                      'w-3.5 h-3.5 text-secondary-dark/60 transition-transform duration-200',
                      dropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-60 rounded-2xl bg-white/95 backdrop-blur-xl border border-pink-100 shadow-[0_15px_35px_rgba(248,184,200,0.3)] py-2 z-[100] font-body"
                    >
                      {/* Customer summary */}
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-xs font-semibold text-secondary-dark truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-secondary-dark/60 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-green-600">
                          <FiCheckCircle className="w-3 h-3" /> Email Verified
                        </span>
                      </div>

                      {/* Dropdown Items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-secondary-dark/80 hover:text-accent hover:bg-pink-50/50 transition-colors"
                        >
                          <FiUser className="w-4 h-4 text-accent-dark" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          to="/my-orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-secondary-dark/80 hover:text-accent hover:bg-pink-50/50 transition-colors"
                        >
                          <FiPackage className="w-4 h-4 text-accent-dark" />
                          <span>My Orders</span>
                        </Link>

                        <Link
                          to="/wishlist"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs font-medium text-secondary-dark/80 hover:text-accent hover:bg-pink-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <FiHeart className="w-4 h-4 text-accent-dark" />
                            <span>Wishlist</span>
                          </div>
                          {wishlistCount > 0 && (
                            <span className="bg-pink-100 text-accent-dark text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50/60 transition-colors cursor-pointer text-left"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Get Quote Button */}
              <PremiumButton
                variant={scrolled ? 'gradient' : 'primary'}
                className="py-2.5 px-6"
                onClick={openQuoteModal}
              >
                Get Quote
              </PremiumButton>
            </>
          ) : (
            /* Logged-out: Display ONLY Sign In */
            <NavLink
              to="/login"
              className="text-sm font-body font-semibold text-secondary-dark/80 hover:text-accent transition-colors flex items-center gap-1.5 interactive"
            >
              <FiUser className="w-4 h-4" />
              <span>Sign In</span>
            </NavLink>
          )}
        </div>

        {/* Mobile Header Icons */}
        <div className="flex items-center gap-4 md:hidden">
          {/* Cart Icon visible ONLY when logged in */}
          {isAuthedAndVerified && (
            <NavLink
              to="/cart"
              className="relative group text-secondary-dark hover:text-accent transition-colors p-1"
              aria-label="Shopping Cart"
            >
              <FiShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/70 text-secondary-dark hover:text-accent border border-pink-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-nav border-t border-white/40 px-6 py-6 font-body space-y-4"
          >
            {/* Nav links matching conditional visibility */}
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'text-base font-medium py-1 transition-colors',
                      isActive ? 'text-accent font-semibold' : 'text-secondary-dark/80'
                    )
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              {isAuthedAndVerified ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-secondary-dark"
                  >
                    <FiUser className="w-4 h-4 text-accent" />
                    <span>My Profile ({displayName})</span>
                  </Link>

                  <Link
                    to="/my-orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-secondary-dark"
                  >
                    <FiPackage className="w-4 h-4 text-accent" />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    to="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-sm font-semibold text-secondary-dark"
                  >
                    <div className="flex items-center gap-2">
                      <FiHeart className="w-4 h-4 text-accent" />
                      <span>Wishlist</span>
                    </div>
                    {wishlistCount > 0 && (
                      <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-semibold text-red-500 w-full"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>

                  <div className="pt-2">
                    <PremiumButton
                      variant="gradient"
                      className="w-full py-3"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openQuoteModal();
                      }}
                    >
                      Get Quote
                    </PremiumButton>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-accent-dark"
                >
                  <FiUser className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
