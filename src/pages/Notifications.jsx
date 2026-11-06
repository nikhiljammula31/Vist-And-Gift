import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiPackage,
  FiHeart,
  FiUser,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiExternalLink,
  FiInfo,
  FiArrowRight,
  FiAlertCircle,
} from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';
import { formatRelativeTime, NOTIFICATION_TYPES } from '../firebase/notificationService';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'read'
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Filter items based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeTab === 'read') {
      return notifications.filter((n) => n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  const readCount = useMemo(() => {
    return notifications.filter((n) => n.isRead).length;
  }, [notifications]);

  // Handle Mark All as Read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || actionInProgress) return;
    setActionInProgress(true);
    try {
      await markAllAsRead();
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle Clear All Notifications
  const handleConfirmClearAll = async () => {
    setActionInProgress(true);
    try {
      await clearAllNotifications();
      setShowClearConfirm(false);
    } finally {
      setActionInProgress(false);
    }
  };

  // Returns icon and styling for notification type
  const getTypeBadge = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.ORDER:
        return {
          icon: FiPackage,
          bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          label: 'Order',
        };
      case NOTIFICATION_TYPES.WISHLIST:
        return {
          icon: FiHeart,
          bg: 'bg-pink-50 text-accent-dark border-pink-200/80',
          label: 'Wishlist',
        };
      case NOTIFICATION_TYPES.ACCOUNT:
        return {
          icon: FiUser,
          bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          label: 'Account',
        };
      case NOTIFICATION_TYPES.STOCK:
        return {
          icon: FiAlertCircle,
          bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
          label: 'Inventory',
        };
      default:
        return {
          icon: FiInfo,
          bg: 'bg-gray-50 text-secondary-dark/80 border-gray-200',
          label: 'Update',
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F7] pt-28 pb-20 font-body text-secondary-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* ========================================================= */}
        {/* 1. Header Banner & Actions                                */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#F8B8C8]/50">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-pink-100/80 border border-pink-200 flex items-center justify-center text-accent shadow-xs">
                <FiBell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-accent text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-secondary-dark/60">
              Stay updated on your orders, wishlist activity, and account notices.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={actionInProgress}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-pink-200 hover:border-accent text-xs font-semibold text-secondary-dark/80 hover:text-accent shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <FiCheckCircle className="w-4 h-4 text-accent" />
                <span>Mark all as read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                disabled={actionInProgress}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 text-xs font-semibold text-gray-500 hover:text-red-600 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Filter Tabs                                            */}
        {/* ========================================================= */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'bg-white text-secondary-dark/70 hover:bg-pink-50/50 border border-pink-100/70'
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'bg-white text-secondary-dark/70 hover:bg-pink-50/50 border border-pink-100/70'
            }`}
          >
            Unread ({unreadCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('read')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'read'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'bg-white text-secondary-dark/70 hover:bg-pink-50/50 border border-pink-100/70'
            }`}
          >
            Read ({readCount})
          </button>
        </div>

        {/* ========================================================= */}
        {/* 3. Notification List Canvas                               */}
        {/* ========================================================= */}
        <div className="mt-6 space-y-3">
          {loading ? (
            /* Loading Skeleton */
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white border border-pink-100/80 shadow-xs animate-pulse flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-100/50 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200/70 rounded-md w-1/3" />
                    <div className="h-3 bg-gray-100 rounded-md w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded-md w-1/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="p-8 rounded-3xl bg-red-50/60 border border-red-200 text-center">
              <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-red-800">
                Failed to load notifications
              </h3>
              <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto">{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-6 rounded-3xl bg-white border border-[#F8B8C8]/60 shadow-xs text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-accent mb-4 shadow-xs">
                <FiBell className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-lg text-secondary-dark">
                {activeTab === 'unread'
                  ? "You're all caught up!"
                  : activeTab === 'read'
                  ? 'No read notifications'
                  : 'No notifications yet'}
              </h3>
              <p className="text-xs text-secondary-dark/60 mt-1 max-w-sm">
                {activeTab === 'unread'
                  ? 'There are no unread notifications right now. Check back soon for updates on your orders and wishlist.'
                  : 'Notifications regarding your personalized gifts, orders, and account will appear here.'}
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white text-xs font-semibold shadow-md shadow-accent/25 hover:bg-accent-dark transition-all"
              >
                <span>Browse Gifts</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Notifications Cards */
            <AnimatePresence initial={false}>
              {filteredNotifications.map((notification) => {
                const badge = getTypeBadge(notification.type);
                const BadgeIcon = badge.icon;
                const isUnread = !notification.isRead;

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`relative p-4 sm:p-5 rounded-2xl border transition-all ${
                      isUnread
                        ? 'bg-gradient-to-r from-pink-50/80 via-white to-white border-pink-300/80 shadow-xs border-l-4 border-l-accent'
                        : 'bg-white border-pink-100/80 hover:border-pink-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Type Badge Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-5 h-5" />
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border bg-white text-secondary-dark/70">
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-secondary-dark/50 font-medium">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-pink-100/60 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                              Unread
                            </span>
                          )}
                        </div>

                        <h4 className="mt-1 font-bold text-sm text-secondary-dark tracking-tight">
                          {notification.title}
                        </h4>
                        <p className="mt-1 text-xs text-secondary-dark/75 leading-relaxed break-words">
                          {notification.message}
                        </p>

                        {/* Interactive Context Links */}
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          {notification.relatedOrderId && (
                            <Link
                              to={`/order/${notification.relatedOrderId}`}
                              onClick={() => markAsRead(notification.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
                            >
                              <FiPackage className="w-3.5 h-3.5" />
                              <span>View Order #{notification.relatedOrderId}</span>
                              <FiArrowRight className="w-3 h-3" />
                            </Link>
                          )}

                          {notification.relatedProductId && (
                            <Link
                              to={`/product/${notification.relatedProductId}`}
                              onClick={() => markAsRead(notification.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" />
                              <span>View Product</span>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Right Control Action Buttons */}
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-accent hover:bg-pink-50 transition-colors cursor-pointer"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete notification"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. Clear All Confirmation Modal                           */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-pink-200 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mx-auto mb-4">
                <FiTrash2 className="w-6 h-6" />
              </div>
              <h3 className="text-center font-heading font-bold text-lg text-secondary-dark">
                Clear all notifications?
              </h3>
              <p className="text-center text-xs text-secondary-dark/60 mt-1.5">
                This will permanently delete all {notifications.length} notification records from your history. This action cannot be undone.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={actionInProgress}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-secondary-dark/70 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearAll}
                  disabled={actionInProgress}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/25 transition-colors cursor-pointer"
                >
                  {actionInProgress ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
