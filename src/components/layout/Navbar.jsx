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
  FiShield,
  FiBell,
} from 'react-icons/fi';
import PremiumButton from '../common/PremiumButton';
import { useQuote } from '../../context/QuoteContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  formatRelativeTime,
  NOTIFICATION_TYPES,
} from '../../firebase/notificationService';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  const { openQuoteModal } = useQuote();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { currentUser, userProfile, isEmailVerified, isAdmin, loading, logout } = useAuth();
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

  // Handle outside click for user dropdown & notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
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

              {/* Notification Bell & Dropdown */}
              <div className="relative" ref={notifDropdownRef}>
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative group text-secondary-dark hover:text-accent transition-colors p-1 cursor-pointer interactive"
                  aria-label="Notifications"
                >
                  <FiBell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                <AnimatePresence>
                  {notifDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-pink-200/80 shadow-[0_15px_35px_rgba(248,184,200,0.35)] py-3 z-[100] font-body"
                    >
                      {/* Header */}
                      <div className="px-4 pb-2.5 border-b border-pink-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-secondary-dark">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-pink-100 text-accent-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] font-semibold text-accent hover:text-accent-dark transition-colors cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification Items List */}
                      <div className="max-h-72 overflow-y-auto divide-y divide-pink-50/80 scrollbar-none">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center px-4">
                            <FiBell className="w-8 h-8 text-pink-200 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-secondary-dark">No notifications yet</p>
                            <p className="text-[11px] text-secondary-dark/50 mt-0.5">
                              Updates on your orders and wishlist will appear here.
                            </p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => {
                            const isUnread = !n.isRead;
                            return (
                              <div
                                key={n.id}
                                onClick={() => {
                                  if (isUnread) markAsRead(n.id);
                                  setNotifDropdownOpen(false);
                                  if (n.relatedOrderId) {
                                    navigate(`/order/${n.relatedOrderId}`);
                                  } else if (n.relatedProductId) {
                                    navigate(`/product/${n.relatedProductId}`);
                                  } else {
                                    navigate('/notifications');
                                  }
                                }}
                                className={`px-4 py-3 flex items-start gap-3 hover:bg-pink-50/50 transition-colors cursor-pointer ${
                                  isUnread ? 'bg-pink-50/30' : ''
                                }`}
                              >
                                <div className="w-8 h-8 rounded-xl bg-pink-100/70 border border-pink-200/60 flex items-center justify-center shrink-0 text-accent mt-0.5">
                                  {n.type === NOTIFICATION_TYPES.ORDER ? (
                                    <FiPackage className="w-4 h-4 text-amber-600" />
                                  ) : n.type === NOTIFICATION_TYPES.WISHLIST ? (
                                    <FiHeart className="w-4 h-4 text-accent" />
                                  ) : (
                                    <FiBell className="w-4 h-4 text-accent" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-bold text-secondary-dark truncate">{n.title}</h5>
                                    <span className="text-[10px] text-secondary-dark/50 shrink-0">
                                      {formatRelativeTime(n.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-secondary-dark/70 line-clamp-2 mt-0.5 leading-snug">
                                    {n.message}
                                  </p>
                                </div>

                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="pt-2.5 px-4 border-t border-pink-100 flex items-center justify-center">
                        <Link
                          to="/notifications"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1"
                        >
                          <span>View all notifications</span>
                          <span>&rarr;</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-accent hover:bg-pink-50 transition-colors border-b border-pink-100/60"
                          >
                            <FiShield className="w-4 h-4 text-accent" />
                            <span>Admin Portal</span>
                          </Link>
                        )}

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

                        <Link
                          to="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs font-medium text-secondary-dark/80 hover:text-accent hover:bg-pink-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <FiBell className="w-4 h-4 text-accent-dark" />
                            <span>Notifications</span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {unreadCount}
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
          {/* Notifications Icon visible ONLY when logged in */}
          {isAuthedAndVerified && (
            <NavLink
              to="/notifications"
              className="relative group text-secondary-dark hover:text-accent transition-colors p-1"
              aria-label="Notifications"
            >
              <FiBell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          )}

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
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-bold text-accent pb-2 border-b border-pink-100"
                    >
                      <FiShield className="w-4 h-4 text-accent" />
                      <span>Admin Portal</span>
                    </Link>
                  )}

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

                  <Link
                    to="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-sm font-semibold text-secondary-dark"
                  >
                    <div className="flex items-center gap-2">
                      <FiBell className="w-4 h-4 text-accent" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
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
