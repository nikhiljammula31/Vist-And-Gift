import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiArrowLeft,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiCheckCircle,
  FiExternalLink,
  FiBell,
  FiTrash2,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
  formatRelativeTime,
  NOTIFICATION_TYPES,
} from '../../firebase/notificationService';

const AdminLayout = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const adminNotifRef = useRef(null);

  // Subscribe to real-time administrative notifications
  useEffect(() => {
    const unsubscribe = subscribeAdminNotifications(
      ({ notifications, unreadCount }) => {
        setAdminNotifs(notifications);
        setAdminUnreadCount(unreadCount);
      },
      (err) => {
        console.warn('Admin notifications subscription error:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle outside click to close admin notifications dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (adminNotifRef.current && !adminNotifRef.current.contains(e.target)) {
        setAdminNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adminName = userProfile?.fullName || currentUser?.displayName || 'Administrator';
  const adminEmail = userProfile?.email || currentUser?.email || '';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      to: '/admin',
      label: 'Overview',
      icon: FiGrid,
      end: true,
    },
    {
      to: '/admin/orders',
      label: 'Order Management',
      icon: FiPackage,
      end: false,
    },
    {
      to: '/admin/customers',
      label: 'Customers',
      icon: FiUsers,
      end: false,
    },
    {
      to: '/admin/products',
      label: 'Products Catalog',
      icon: FiShoppingBag,
      end: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F7] text-secondary-dark font-body flex">
      {/* ------------------------------------------------------------- */}
      {/* 1. Desktop & Mobile Sidebar                                   */}
      {/* ------------------------------------------------------------- */}
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-[#F8B8C8]/50 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } shadow-sm lg:shadow-none`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-pink-100 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent to-accent-dark flex items-center justify-center text-white shadow-md shadow-accent/25">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading font-bold text-lg text-secondary-dark tracking-tight block">
                  Visit &amp; Gift
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100 inline-block">
                  Admin Portal
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-gray-400 hover:text-secondary-dark hover:bg-gray-100 cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-secondary-dark/40">
              Management
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-50 to-pink-100/60 text-accent-dark border border-pink-200/80 shadow-xs'
                        : 'text-secondary-dark/70 hover:text-accent hover:bg-pink-50/40'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / Account Section */}
        <div className="p-4 border-t border-pink-100 space-y-3">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-pink-50/70 text-secondary-dark text-xs font-semibold border border-gray-200/80 transition-all"
          >
            <div className="flex items-center gap-2">
              <FiExternalLink className="w-3.5 h-3.5 text-accent" />
              <span>Customer Store</span>
            </div>
            <span className="text-[10px] text-gray-400">&rarr;</span>
          </Link>

          {/* Admin Profile Details */}
          <div className="p-3 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {adminName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-secondary-dark truncate">
                  {adminName}
                </p>
                <p className="text-[10px] text-gray-500 truncate" title={adminEmail}>
                  {adminEmail}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout from Admin Portal"
              className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-white transition-colors cursor-pointer"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Content Canvas                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#F8B8C8]/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-secondary-dark hover:bg-gray-100 cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-semibold text-secondary-dark/50 hidden sm:inline">
                Admin Console &bull;
              </span>{' '}
              <span className="text-xs font-bold text-accent-dark">
                Visit &amp; Gift E-Commerce
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Notifications Bell & Dropdown */}
            <div className="relative" ref={adminNotifRef}>
              <button
                type="button"
                onClick={() => setAdminNotifOpen(!adminNotifOpen)}
                className="relative p-2 rounded-xl bg-white hover:bg-pink-50 text-secondary-dark hover:text-accent border border-pink-200/80 shadow-xs transition-all cursor-pointer"
                title="Management Alerts"
                aria-label="Management Alerts"
              >
                <FiBell className="w-4 h-4 text-secondary-dark/70 hover:text-accent" />
                {adminUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {adminNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white border border-pink-200 shadow-xl py-3 z-50 font-body"
                  >
                    <div className="px-4 pb-2.5 border-b border-pink-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-secondary-dark">Management Alerts</span>
                        {adminUnreadCount > 0 && (
                          <span className="bg-pink-100 text-accent-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {adminUnreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {adminUnreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllAdminNotificationsAsRead()}
                            className="text-[11px] font-semibold text-accent hover:text-accent-dark cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        {adminNotifs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => clearAllAdminNotifications()}
                            className="text-[11px] font-semibold text-gray-400 hover:text-red-500 cursor-pointer"
                            title="Clear all alerts"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-pink-50 scrollbar-none">
                      {adminNotifs.length === 0 ? (
                        <div className="py-8 text-center px-4">
                          <FiBell className="w-8 h-8 text-pink-200 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-secondary-dark">No management alerts</p>
                          <p className="text-[11px] text-secondary-dark/50 mt-0.5">
                            New customer orders and account registrations will alert here.
                          </p>
                        </div>
                      ) : (
                        adminNotifs.slice(0, 6).map((notif) => {
                          const isUnread = !notif.isRead;
                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                if (isUnread) markAdminNotificationAsRead(notif.id);
                                setAdminNotifOpen(false);
                                if (notif.relatedOrderId) {
                                  navigate('/admin/orders');
                                } else if (notif.type === 'stock') {
                                  navigate('/admin/products');
                                } else if (notif.type === 'account') {
                                  navigate('/admin/customers');
                                }
                              }}
                              className={`px-4 py-3 flex items-start gap-3 hover:bg-pink-50/50 transition-colors cursor-pointer ${
                                isUnread ? 'bg-pink-50/40' : ''
                              }`}
                            >
                              <div className="w-8 h-8 rounded-xl bg-pink-100 border border-pink-200 flex items-center justify-center shrink-0 text-accent mt-0.5">
                                {notif.type === NOTIFICATION_TYPES.ORDER ? (
                                  <FiPackage className="w-4 h-4 text-amber-600" />
                                ) : notif.type === NOTIFICATION_TYPES.ACCOUNT ? (
                                  <FiUsers className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <FiBell className="w-4 h-4 text-accent" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h5 className="text-xs font-bold text-secondary-dark truncate">{notif.title}</h5>
                                  <span className="text-[10px] text-secondary-dark/50 shrink-0">
                                    {formatRelativeTime(notif.createdAt)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-secondary-dark/70 line-clamp-2 mt-0.5 leading-snug">
                                  {notif.message}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAdminNotification(notif.id);
                                  }}
                                  className="p-1 text-gray-300 hover:text-red-500 rounded cursor-pointer"
                                  title="Delete alert"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Cloud Firestore</span>
            </span>

            <Link
              to="/"
              className="py-1.5 px-3.5 rounded-full bg-white hover:bg-pink-50 text-secondary-dark text-xs font-semibold border border-pink-200 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <FiArrowLeft className="w-3 h-3 text-accent" />
              <span>Exit Admin</span>
            </Link>
          </div>
        </header>

        {/* Viewport for Child Route */}
        <main className="p-6 sm:p-8 lg:p-10 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
