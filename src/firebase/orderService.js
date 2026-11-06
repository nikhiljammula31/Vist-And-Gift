import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { PRODUCTS } from '../data/products.js';
import {
  createNotification,
  createAdminNotification,
  NOTIFICATION_TYPES,
} from './notificationService.js';

// In-flight submission lock to prevent duplicate orders across rapid clicks or network retries
const activeSubmissions = new Set();

/**
 * Normalizes an Indian phone number string by stripping extra characters
 * and country code prefixes (+91, 91, or 0).
 */
export const normalizeIndianPhone = (rawPhone) => {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
};

/**
 * Generates a unique, human-readable Order ID in the format:
 * VG-YYYYMMDD-XXXXXX (e.g., VG-20261105-8K3M9P)
 */
export const generateOrderId = () => {
  const dateStr = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VG-${dateStr}-${randomChars}`;
};

/**
 * Validates order payload before submission.
 */
export const validateOrderData = (data) => {
  const errors = {};

  if (!data.userId) {
    errors.userId = 'Customer must be authenticated.';
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.items = 'Cart must contain at least one item.';
  } else {
    for (const item of data.items) {
      if (!item.productId && !item.id) {
        errors.items = 'Cart item contains invalid product details.';
        break;
      }
      const rawPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(String(item.price || 0).replace(/[^0-9.]/g, ''));
      if (rawPrice <= 0) {
        errors.items = 'Cart item contains an invalid price.';
        break;
      }
      const qty = parseInt(item.quantity, 10);
      if (!Number.isInteger(qty) || qty < 1) {
        errors.items = 'Cart item contains an invalid quantity.';
        break;
      }
    }
  }

  if (typeof data.subtotal !== 'number' || data.subtotal <= 0) {
    errors.subtotal = 'Invalid order subtotal.';
  }

  if (typeof data.totalAmount !== 'number' || data.totalAmount <= 0) {
    errors.totalAmount = 'Invalid order total.';
  }

  // Customer details validation
  const cd = data.customerDetails || {};
  if (!cd.fullName || cd.fullName.trim().length < 2) {
    errors.fullName = 'Full name is required (at least 2 characters).';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cd.email || !emailRegex.test(cd.email.trim())) {
    errors.email = 'A valid email address is required.';
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = normalizeIndianPhone(cd.phone);
  if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
    errors.phone = 'Valid 10-digit Indian mobile number is required (starts with 6-9).';
  }

  // Shipping address validation
  const sa = data.shippingAddress || {};
  if (!sa.addressLine || sa.addressLine.trim().length < 5) {
    errors.addressLine = 'Delivery address is required (at least 5 characters).';
  }
  if (!sa.city || sa.city.trim().length < 2) {
    errors.city = 'City is required.';
  }
  if (!sa.state || sa.state.trim().length < 2) {
    errors.state = 'State is required.';
  }

  const pincodeRegex = /^[1-9][0-9]{5}$/;
  const cleanPin = (sa.pincode || '').trim();
  if (!cleanPin || !pincodeRegex.test(cleanPin)) {
    errors.pincode = 'Valid 6-digit Indian PIN code is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Creates a new order document in Cloud Firestore.
 * Ensures idempotency and validates prices against trusted product data.
 */
export const createOrder = async ({
  userId,
  items,
  subtotal,
  deliveryCharge = 0,
  totalAmount,
  customerDetails,
  shippingAddress,
  idempotencyKey,
}) => {
  // 1. Idempotency check to block concurrent submissions
  const submissionKey = idempotencyKey || userId;
  if (activeSubmissions.has(submissionKey)) {
    throw new Error('An order creation is already in progress. Please wait.');
  }

  activeSubmissions.add(submissionKey);

  try {
    // 2. Validate input format
    const validation = validateOrderData({
      userId,
      items,
      subtotal,
      deliveryCharge,
      totalAmount,
      customerDetails,
      shippingAddress,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Invalid order information.');
    }

    // 3. Generate human-readable Order ID
    const orderId = generateOrderId();

    // 4. Validate prices against authoritative Firestore catalog data (with static fallback) & create snapshots
    const itemSnapshots = await Promise.all(
      items.map(async (item) => {
        const pId = String(item.productId || item.id);
        let catalogItem = null;
        let unitPrice = null;

        try {
          const prodDocRef = doc(db, 'products', pId);
          const prodSnap = await getDoc(prodDocRef);
          if (prodSnap.exists()) {
            catalogItem = prodSnap.data();
            if (catalogItem.available === false) {
              throw new Error(
                `"${catalogItem.name || 'Gift item'}" is currently out of stock and cannot be ordered.`
              );
            }
            const rawPrice = catalogItem.price;
            unitPrice =
              typeof rawPrice === 'number'
                ? rawPrice
                : parseFloat(String(rawPrice || 0).replace(/[^0-9.]/g, ''));
          }
        } catch (err) {
          if (err.message && err.message.includes('out of stock')) {
            throw err;
          }
          console.warn(`Firestore price lookup for product ${pId} failed, checking fallback:`, err.message);
        }

        // Fallback to static PRODUCTS if not found in Firestore
        if (unitPrice === null || isNaN(unitPrice)) {
          const fallbackItem = PRODUCTS.find((p) => String(p.id) === pId);
          if (fallbackItem) {
            catalogItem = fallbackItem;
            unitPrice = parseFloat(String(fallbackItem.price).replace(/[^0-9.]/g, ''));
          } else if (typeof item.unitPrice === 'number' && item.unitPrice > 0) {
            unitPrice = item.unitPrice;
          } else {
            unitPrice = parseFloat(String(item.price || 0).replace(/[^0-9.]/g, '')) || 0;
          }
        }

        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        const itemSubtotal = Number((unitPrice * quantity).toFixed(2));

        return {
          productId: pId,
          productName: catalogItem?.name || item.productName || item.name || 'Gift Item',
          image: catalogItem?.image || item.image || '',
          unitPrice: Number(unitPrice.toFixed(2)),
          quantity,
          subtotal: itemSubtotal,
        };
      })
    );

    // 5. Authoritatively calculate subtotal, GST (18%), and grand total in INR
    const calculatedSubtotal = Number(itemSnapshots.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2));
    const calculatedDelivery = Number((deliveryCharge || 0).toFixed(2));
    const calculatedTax = Number((calculatedSubtotal * 0.18).toFixed(2));
    const calculatedTotal = Number((calculatedSubtotal + calculatedTax + calculatedDelivery).toFixed(2));

    // 6. Construct Firestore Order Document (no payment fields)
    const orderDoc = {
      orderId,
      userId,
      items: itemSnapshots,
      subtotal: calculatedSubtotal,
      deliveryCharge: calculatedDelivery,
      totalAmount: calculatedTotal,
      customerDetails: {
        fullName: customerDetails.fullName.trim(),
        email: customerDetails.email.trim().toLowerCase(),
        phone: normalizeIndianPhone(customerDetails.phone),
      },
      shippingAddress: {
        addressLine: shippingAddress.addressLine.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: shippingAddress.pincode.trim(),
      },
      orderStatus: 'placed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 7. Save to Firestore under orders/{orderId}
    const orderDocRef = doc(db, 'orders', orderId);
    await setDoc(orderDocRef, orderDoc);

    // 8. Dispatch Order Notifications (Customer Confirmation + Administrator Alert)
    try {
      await Promise.all([
        createNotification(userId, {
          id: `order_${orderId}_placed`,
          title: 'Order Placed Successfully',
          message: `Your order #${orderId} for ₹${calculatedTotal.toLocaleString('en-IN')} has been placed successfully and is awaiting processing.`,
          type: NOTIFICATION_TYPES.ORDER,
          relatedOrderId: orderId,
          metadata: {
            orderId,
            status: 'placed',
            totalAmount: calculatedTotal,
            itemsCount: itemSnapshots.length,
          },
        }),
        createAdminNotification({
          id: `admin_order_${orderId}_placed`,
          title: 'New Customer Order Received',
          message: `New order #${orderId} placed by ${customerDetails.fullName.trim()} for ₹${calculatedTotal.toLocaleString('en-IN')}.`,
          type: NOTIFICATION_TYPES.ORDER,
          relatedOrderId: orderId,
          relatedUserId: userId,
          metadata: {
            orderId,
            userId,
            customerName: customerDetails.fullName.trim(),
            totalAmount: calculatedTotal,
            itemsCount: itemSnapshots.length,
          },
        }),
      ]);
    } catch (notifErr) {
      console.warn('Order notification dispatch notice:', notifErr?.message || notifErr);
    }

    return {
      success: true,
      orderId,
      order: orderDoc,
    };
  } finally {
    // Release the submission lock
    activeSubmissions.delete(submissionKey);
  }
};

/**
 * Retrieves a single order by its unique Order ID or document ID.
 */
export const getOrderById = async (orderId, userId = null) => {
  if (!orderId) throw new Error('Order ID is required.');

  // Check direct document ID lookup
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (err) {
    console.warn(`Direct getDoc for order ${orderId} failed:`, err.message);
  }

  // Fallback: Query where orderId field matches.
  // Scope query by userId if authenticated to strictly satisfy Firestore security rules
  try {
    const currentUid = userId || auth.currentUser?.uid;
    const constraints = [where('orderId', '==', orderId)];
    if (currentUid) {
      constraints.push(where('userId', '==', currentUid));
    }
    const q = query(collection(db, 'orders'), ...constraints);
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const firstDoc = querySnap.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() };
    }
  } catch (err) {
    console.warn(`Query fallback for order ${orderId} failed:`, err.message);
  }

  return null;
};

/**
 * Safely extracts milliseconds timestamp from a Firestore order document.
 */
export const getOrderTimestamp = (order) => {
  if (!order || !order.createdAt) return 0;
  if (order.createdAt.seconds) return order.createdAt.seconds * 1000;
  if (order.createdAt.toDate && typeof order.createdAt.toDate === 'function') {
    return order.createdAt.toDate().getTime();
  }
  const parsed = new Date(order.createdAt).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Safely formats an order createdAt timestamp or order object into a localized date string.
 */
export const formatOrderDate = (orderOrDate) => {
  if (!orderOrDate) return 'Recently';
  let ms = 0;
  if (typeof orderOrDate === 'object' && ('createdAt' in orderOrDate)) {
    ms = getOrderTimestamp(orderOrDate);
  } else if (orderOrDate.seconds) {
    ms = orderOrDate.seconds * 1000;
  } else if (orderOrDate.toDate && typeof orderOrDate.toDate === 'function') {
    ms = orderOrDate.toDate().getTime();
  } else {
    const parsed = new Date(orderOrDate).getTime();
    ms = isNaN(parsed) ? 0 : parsed;
  }
  if (!ms) return 'Recently';
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Retrieves all orders placed by an authenticated customer.
 * 
 * - Strictly queries by the customer's authenticated UID.
 * - Handles missing composite Firestore index separately from permission or auth errors.
 * - If an index is missing, logs the index creation requirement and falls back to
 *   single-field equality filtering with deterministic in-memory sorting.
 * - Genuine permission or network errors are re-thrown for accurate error boundaries.
 */
export const getCustomerOrders = async (userId, sortOrder = 'desc') => {
  if (!userId) {
    throw new Error('Customer ID is required to retrieve orders.');
  }

  const cleanUserId = String(userId).trim();
  const ordersRef = collection(db, 'orders');
  let querySnap = null;

  try {
    // 1. Attempt server-side sorted query (requires composite index on userId ASC + createdAt DESC)
    const q = query(
      ordersRef,
      where('userId', '==', cleanUserId),
      orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc')
    );
    querySnap = await getDocs(q);
  } catch (err) {
    // 2. Separate Firestore index errors from permission and connection errors
    const isIndexError =
      err?.code === 'failed-precondition' ||
      err?.message?.toLowerCase().includes('index') ||
      err?.message?.includes('requires an index');

    if (isIndexError) {
      console.warn(
        'Firestore composite index (userId, createdAt) is not yet active. Falling back to in-memory sorting:',
        err.message
      );
      // Fallback query uses only single-field equality filter (single-field indexes are built-in and automatic)
      const fallbackQ = query(ordersRef, where('userId', '==', cleanUserId));
      querySnap = await getDocs(fallbackQ);
    } else {
      // Re-throw genuine permission, authentication, or network errors so they are not masked
      throw err;
    }
  }

  // 3. Normalize documents and safely handle missing optional fields
  const results = querySnap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      orderId: data.orderId || d.id,
      userId: data.userId || cleanUserId,
      items: Array.isArray(data.items) ? data.items : [],
      subtotal: Number(data.subtotal) || 0,
      deliveryCharge: Number(data.deliveryCharge) || 0,
      totalAmount: Number(data.totalAmount) || 0,
      customerDetails: data.customerDetails || {
        fullName: 'Valued Customer',
        email: '',
        phone: '',
      },
      shippingAddress: data.shippingAddress || {
        addressLine: 'Standard Delivery',
        city: '',
        state: '',
        pincode: '',
      },
      orderStatus: data.orderStatus || 'placed',
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  });

  // 4. Ensure deterministic client-side sorting by timestamp
  return results.sort((a, b) => {
    const timeA = getOrderTimestamp(a);
    const timeB = getOrderTimestamp(b);
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });
};
