import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';

export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  ACCOUNT: 'account',
  WISHLIST: 'wishlist',
  SYSTEM: 'system',
  STOCK: 'stock',
};

/**
 * Formats a Firestore timestamp, JS Date, or ISO string into a human-friendly relative time string.
 * Examples: "Just now", "5m ago", "2h ago", "Yesterday", "3d ago"
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';

  let date;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) return 'Just now';
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Normalizes a raw Firestore notification document into standard application shape.
 */
export const mapNotificationDoc = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId || '',
    title: data.title || 'Notification',
    message: data.message || '',
    type: data.type || NOTIFICATION_TYPES.SYSTEM,
    relatedOrderId: data.relatedOrderId || null,
    relatedProductId: data.relatedProductId || null,
    relatedUserId: data.relatedUserId || null,
    isRead: Boolean(data.isRead),
    metadata: data.metadata || {},
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

/**
 * Compares two notification items newest-first based on createdAt.
 */
export const sortNotificationsDesc = (a, b) => {
  const timeA = a.createdAt?.seconds
    ? a.createdAt.seconds * 1000
    : a.createdAt?.toDate
    ? a.createdAt.toDate().getTime()
    : a.createdAt
    ? new Date(a.createdAt).getTime()
    : 0;
  const timeB = b.createdAt?.seconds
    ? b.createdAt.seconds * 1000
    : b.createdAt?.toDate
    ? b.createdAt.toDate().getTime()
    : b.createdAt
    ? new Date(b.createdAt).getTime()
    : 0;
  return timeB - timeA;
};

// =====================================================================
// CUSTOMER NOTIFICATIONS (users/{userId}/notifications/{notificationId})
// =====================================================================

/**
 * Creates a notification in a customer's private notifications subcollection.
 * Uses deterministic document ID if provided to prevent duplicate alerts.
 */
export const createNotification = async (userId, notificationData) => {
  if (!userId) throw new Error('User ID is required to create a notification.');
  if (!notificationData?.title || !notificationData?.message) {
    throw new Error('Notification title and message are required.');
  }

  const notificationsColRef = collection(db, 'users', userId, 'notifications');
  const notificationId =
    notificationData.id || doc(notificationsColRef).id;

  const docRef = doc(db, 'users', userId, 'notifications', notificationId);

  const payload = {
    id: notificationId,
    userId,
    title: String(notificationData.title).trim(),
    message: String(notificationData.message).trim(),
    type: notificationData.type || NOTIFICATION_TYPES.SYSTEM,
    isRead: Boolean(notificationData.isRead || false),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (notificationData.relatedOrderId) {
    payload.relatedOrderId = String(notificationData.relatedOrderId).trim();
  }
  if (notificationData.relatedProductId) {
    payload.relatedProductId = String(notificationData.relatedProductId).trim();
  }
  if (notificationData.metadata && typeof notificationData.metadata === 'object') {
    payload.metadata = notificationData.metadata;
  }

  await setDoc(docRef, payload, { merge: true });

  return {
    ...payload,
    id: notificationId,
  };
};

/**
 * Fetches all notifications for a customer from Firestore.
 */
export const getUserNotifications = async (userId) => {
  if (!userId) return [];
  const colRef = collection(db, 'users', userId, 'notifications');
  const snapshot = await getDocs(colRef);
  const items = snapshot.docs.map(mapNotificationDoc);
  return items.sort(sortNotificationsDesc);
};

/**
 * Subscribes to customer notifications in real time using onSnapshot.
 */
export const subscribeUserNotifications = (userId, onUpdate, onError) => {
  if (!userId) {
    onUpdate({ notifications: [], unreadCount: 0 });
    return () => {};
  }

  const colRef = collection(db, 'users', userId, 'notifications');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map(mapNotificationDoc).sort(sortNotificationsDesc);
      const unreadCount = items.filter((item) => !item.isRead).length;
      onUpdate({ notifications: items, unreadCount });
    },
    (err) => {
      console.error(`Error in customer notifications listener (${userId}):`, err);
      if (onError) onError(err);
    }
  );
};

/**
 * Marks a single customer notification as read.
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  if (!userId || !notificationId) return;
  const docRef = doc(db, 'users', userId, 'notifications', notificationId);
  await updateDoc(docRef, {
    isRead: true,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Marks all unread customer notifications as read using a batch write.
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return 0;
  const colRef = collection(db, 'users', userId, 'notifications');
  const snapshot = await getDocs(colRef);

  const unreadDocs = snapshot.docs.filter((d) => !d.data().isRead);
  if (unreadDocs.length === 0) return 0;

  const batch = writeBatch(db);
  unreadDocs.forEach((d) => {
    batch.update(d.ref, {
      isRead: true,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return unreadDocs.length;
};

/**
 * Deletes a single customer notification.
 */
export const deleteNotification = async (userId, notificationId) => {
  if (!userId || !notificationId) return;
  const docRef = doc(db, 'users', userId, 'notifications', notificationId);
  await deleteDoc(docRef);
};

/**
 * Clears all notifications for a customer using a batch write.
 */
export const clearAllNotifications = async (userId) => {
  if (!userId) return 0;
  const colRef = collection(db, 'users', userId, 'notifications');
  const snapshot = await getDocs(colRef);

  if (snapshot.empty) return 0;

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();
  return snapshot.size;
};

// =====================================================================
// ADMINISTRATOR NOTIFICATIONS (adminNotifications/{notificationId})
// =====================================================================

/**
 * Creates an administrative alert for management events (new orders, new users, stock).
 */
export const createAdminNotification = async (notificationData) => {
  if (!notificationData?.title || !notificationData?.message) {
    throw new Error('Admin notification title and message are required.');
  }

  const colRef = collection(db, 'adminNotifications');
  const notificationId = notificationData.id || doc(colRef).id;
  const docRef = doc(db, 'adminNotifications', notificationId);

  const payload = {
    id: notificationId,
    title: String(notificationData.title).trim(),
    message: String(notificationData.message).trim(),
    type: notificationData.type || NOTIFICATION_TYPES.SYSTEM,
    isRead: Boolean(notificationData.isRead || false),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (notificationData.relatedOrderId) {
    payload.relatedOrderId = String(notificationData.relatedOrderId).trim();
  }
  if (notificationData.relatedProductId) {
    payload.relatedProductId = String(notificationData.relatedProductId).trim();
  }
  if (notificationData.relatedUserId) {
    payload.relatedUserId = String(notificationData.relatedUserId).trim();
  }
  if (notificationData.metadata && typeof notificationData.metadata === 'object') {
    payload.metadata = notificationData.metadata;
  }

  await setDoc(docRef, payload, { merge: true });

  return {
    ...payload,
    id: notificationId,
  };
};

/**
 * Fetches all administrative alerts from Firestore.
 */
export const getAdminNotifications = async () => {
  const colRef = collection(db, 'adminNotifications');
  const snapshot = await getDocs(colRef);
  const items = snapshot.docs.map(mapNotificationDoc);
  return items.sort(sortNotificationsDesc);
};

/**
 * Subscribes to administrative alerts in real time using onSnapshot.
 */
export const subscribeAdminNotifications = (onUpdate, onError) => {
  const colRef = collection(db, 'adminNotifications');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map(mapNotificationDoc).sort(sortNotificationsDesc);
      const unreadCount = items.filter((item) => !item.isRead).length;
      onUpdate({ notifications: items, unreadCount });
    },
    (err) => {
      console.error('Error in admin notifications listener:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Marks a single administrator notification as read.
 */
export const markAdminNotificationAsRead = async (notificationId) => {
  if (!notificationId) return;
  const docRef = doc(db, 'adminNotifications', notificationId);
  await updateDoc(docRef, {
    isRead: true,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Marks all unread administrator notifications as read.
 */
export const markAllAdminNotificationsAsRead = async () => {
  const colRef = collection(db, 'adminNotifications');
  const snapshot = await getDocs(colRef);
  const unreadDocs = snapshot.docs.filter((d) => !d.data().isRead);
  if (unreadDocs.length === 0) return 0;

  const batch = writeBatch(db);
  unreadDocs.forEach((d) => {
    batch.update(d.ref, {
      isRead: true,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return unreadDocs.length;
};

/**
 * Deletes a single administrator notification.
 */
export const deleteAdminNotification = async (notificationId) => {
  if (!notificationId) return;
  const docRef = doc(db, 'adminNotifications', notificationId);
  await deleteDoc(docRef);
};

/**
 * Clears all administrator notifications.
 */
export const clearAllAdminNotifications = async () => {
  const colRef = collection(db, 'adminNotifications');
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) return 0;

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();
  return snapshot.size;
};
