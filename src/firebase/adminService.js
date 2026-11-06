import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { getOrderTimestamp } from './orderService.js';
import {
  createNotification,
  createAdminNotification,
  NOTIFICATION_TYPES,
} from './notificationService.js';

export const ALLOWED_ORDER_STATUSES = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

/**
 * Retrieves all registered customers from Firestore users collection.
 * Excludes sensitive fields.
 */
export const getAllCustomers = async () => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  const customers = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      id: d.id,
      fullName: data.fullName || 'Customer',
      email: data.email || 'No email',
      phone: data.phone || 'Not provided',
      photoURL: data.photoURL || null,
      provider: data.provider || 'password',
      role: data.role || 'customer',
      emailVerified: Boolean(data.emailVerified),
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  });

  // Sort newest customers first
  return customers.sort((a, b) => {
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });
};

/**
 * Retrieves all customer orders across the platform for administrative management.
 */
export const getAllOrders = async () => {
  const ordersRef = collection(db, 'orders');
  const snapshot = await getDocs(ordersRef);

  const orders = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      orderId: data.orderId || d.id,
      userId: data.userId || '',
      items: Array.isArray(data.items) ? data.items : [],
      subtotal: Number(data.subtotal) || 0,
      deliveryCharge: Number(data.deliveryCharge) || 0,
      totalAmount: Number(data.totalAmount) || 0,
      customerDetails: data.customerDetails || {
        fullName: 'Customer',
        email: '',
        phone: '',
      },
      shippingAddress: data.shippingAddress || {
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
      },
      orderStatus: data.orderStatus || 'placed',
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  });

  // Sort newest first
  return orders.sort((a, b) => {
    const timeA = getOrderTimestamp(a);
    const timeB = getOrderTimestamp(b);
    return timeB - timeA;
  });
};

/**
 * Updates the fulfillment status of an order.
 * Validates the status against ALLOWED_ORDER_STATUSES, prevents duplicate
 * notifications on repeated updates, and dispatches status notifications to customer and admin.
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  if (!orderId) throw new Error('Order ID is required.');
  const normalizedStatus = String(newStatus).toLowerCase().trim();

  if (!ALLOWED_ORDER_STATUSES.includes(normalizedStatus)) {
    throw new Error(
      `Invalid order status. Allowed: ${ALLOWED_ORDER_STATUSES.join(', ')}`
    );
  }

  const orderDocRef = doc(db, 'orders', orderId);
  const orderSnap = await getDoc(orderDocRef);
  if (!orderSnap.exists()) {
    throw new Error(`Order ${orderId} does not exist.`);
  }

  const orderData = orderSnap.data();
  const previousStatus = orderData.orderStatus;

  // Prevent duplicate writes and repeated notification spam if status is unchanged
  if (previousStatus === normalizedStatus) {
    return { success: true, orderId, orderStatus: normalizedStatus, unvaried: true };
  }

  await updateDoc(orderDocRef, {
    orderStatus: normalizedStatus,
    updatedAt: serverTimestamp(),
  });

  // Create order status transition notification for the customer
  try {
    const titles = {
      processing: 'Order Confirmed & Processing',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled',
      placed: 'Order Placed',
    };
    const messages = {
      processing: `Your order #${orderId} has been confirmed and is now being carefully prepared.`,
      shipped: `Great news! Your order #${orderId} has been shipped and is on its way.`,
      delivered: `Your order #${orderId} has been successfully delivered. We hope you love your bespoke gifts!`,
      cancelled: `Your order #${orderId} has been cancelled. If you have questions, please reach out to our team.`,
      placed: `Your order #${orderId} has been received.`,
    };

    if (orderData.userId) {
      await createNotification(orderData.userId, {
        id: `order_${orderId}_${normalizedStatus}`,
        title: titles[normalizedStatus] || 'Order Status Updated',
        message:
          messages[normalizedStatus] ||
          `Your order #${orderId} status has been updated to "${normalizedStatus}".`,
        type: NOTIFICATION_TYPES.ORDER,
        relatedOrderId: orderId,
        metadata: {
          orderId,
          status: normalizedStatus,
          previousStatus,
          totalAmount: orderData.totalAmount || 0,
        },
      });
    }

    // Also record admin alert
    await createAdminNotification({
      id: `admin_order_${orderId}_${normalizedStatus}`,
      title: `Order #${orderId} ${normalizedStatus.toUpperCase()}`,
      message: `Order #${orderId} status changed from "${previousStatus}" to "${normalizedStatus}".`,
      type: NOTIFICATION_TYPES.ORDER,
      relatedOrderId: orderId,
      relatedUserId: orderData.userId || null,
      metadata: {
        orderId,
        status: normalizedStatus,
        previousStatus,
      },
    });
  } catch (notifErr) {
    console.warn('Order status transition notification notice:', notifErr?.message || notifErr);
  }

  return { success: true, orderId, orderStatus: normalizedStatus };
};

/**
 * Retrieves all orders for a specific customer.
 */
export const getCustomerOrdersAdmin = async (userId) => {
  if (!userId) return [];
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const orders = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  return orders.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
};

/**
 * Computes live administrative metrics directly from Firestore collections.
 */
export const getAdminDashboardMetrics = async () => {
  const [customers, orders] = await Promise.all([
    getAllCustomers(),
    getAllOrders(),
  ]);

  const totalCustomers = customers.length;
  const totalOrders = orders.length;

  // Calculate gross revenue exclusively from valid placed/shipped/delivered orders (excluding cancelled)
  const validOrders = orders.filter((o) => o.orderStatus !== 'cancelled');
  const grossRevenue = validOrders.reduce(
    (acc, ord) => acc + (Number(ord.totalAmount) || 0),
    0
  );

  return {
    totalCustomers,
    totalOrders,
    grossRevenue,
    recentOrders: orders.slice(0, 6),
    recentCustomers: customers.slice(0, 6),
  };
};
