import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationService,
  clearAllNotifications as clearAllNotificationsService,
} from '../firebase/notificationService';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to real-time notification stream for authenticated user
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeUserNotifications(
      currentUser.uid,
      ({ notifications: items, unreadCount: unread }) => {
        setNotifications(items);
        setUnreadCount(unread);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load notifications stream:', err);
        setError(err.message || 'Unable to load notifications.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!currentUser?.uid || !notificationId) return;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await markNotificationAsRead(currentUser.uid, notificationId);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [currentUser?.uid]
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead(currentUser.uid);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [currentUser?.uid]);

  const deleteNotification = useCallback(
    async (notificationId) => {
      if (!currentUser?.uid || !notificationId) return;
      const target = notifications.find((n) => n.id === notificationId);
      const wasUnread = target && !target.isRead;

      // Optimistic removal
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await deleteNotificationService(currentUser.uid, notificationId);
      } catch (err) {
        console.error('Failed to delete notification:', err);
      }
    },
    [currentUser?.uid, notifications]
  );

  const clearAllNotifications = useCallback(async () => {
    if (!currentUser?.uid) return;
    setNotifications([]);
    setUnreadCount(0);

    try {
      await clearAllNotificationsService(currentUser.uid);
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  }, [currentUser?.uid]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

