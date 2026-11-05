import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Validates Indian PIN code format (6 numeric digits).
 */
export const isValidPincode = (pincode) => {
  if (!pincode) return false;
  return /^\d{6}$/.test(String(pincode).trim());
};

/**
 * Validates 10-digit Indian mobile number.
 */
export const isValidIndianPhone = (phone) => {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
};

/**
 * Validates address fields.
 */
export const validateAddressPayload = (data) => {
  const errors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full Name must be at least 2 characters';
  }

  const cleanPhone = String(data.phone || '').replace(/\D/g, '');
  if (!cleanPhone || (cleanPhone.length !== 10 && cleanPhone.length !== 12)) {
    errors.phone = 'Please enter a valid 10-digit mobile number';
  }

  if (!data.houseStreet || data.houseStreet.trim().length < 3) {
    errors.houseStreet = 'House / Building / Street address is required';
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'City is required';
  }

  if (!data.state || data.state.trim().length < 2) {
    errors.state = 'State is required';
  }

  if (!isValidPincode(data.pincode)) {
    errors.pincode = 'PIN Code must be exactly 6 digits';
  }

  const validTypes = ['Home', 'Work', 'Other'];
  if (!data.addressType || !validTypes.includes(data.addressType)) {
    errors.addressType = 'Address type must be Home, Work, or Other';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Adds a new delivery address for the user.
 * If isDefault is true, all other addresses for this user are updated to isDefault: false.
 */
export const addAddressService = async (userId, addressData) => {
  if (!userId) throw new Error('User ID is required to add an address');

  const validation = validateAddressPayload(addressData);
  if (!validation.isValid) {
    const msg = Object.values(validation.errors).join(', ');
    throw new Error(`Validation failed: ${msg}`);
  }

  const addressesCol = collection(db, 'users', userId, 'addresses');
  const existingDocsSnap = await getDocs(addressesCol);
  const isFirstAddress = existingDocsSnap.empty;

  // If this is the only address, make it default automatically
  const shouldBeDefault = isFirstAddress ? true : Boolean(addressData.isDefault);

  const batch = writeBatch(db);

  // If this address should be default, unset all existing defaults
  if (shouldBeDefault) {
    existingDocsSnap.forEach((docSnap) => {
      if (docSnap.data().isDefault) {
        batch.update(docSnap.ref, {
          isDefault: false,
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  const newAddressRef = doc(addressesCol);
  const newAddressData = {
    id: newAddressRef.id,
    fullName: addressData.fullName.trim(),
    phone: String(addressData.phone).trim(),
    houseStreet: addressData.houseStreet.trim(),
    areaLocality: (addressData.areaLocality || '').trim(),
    city: addressData.city.trim(),
    state: addressData.state.trim(),
    pincode: String(addressData.pincode).trim(),
    addressType: addressData.addressType || 'Home',
    isDefault: shouldBeDefault,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(newAddressRef, newAddressData);
  await batch.commit();

  return newAddressData;
};

/**
 * Updates an existing delivery address.
 */
export const updateAddressService = async (userId, addressId, addressData) => {
  if (!userId || !addressId) throw new Error('User ID and Address ID are required');

  const validation = validateAddressPayload(addressData);
  if (!validation.isValid) {
    const msg = Object.values(validation.errors).join(', ');
    throw new Error(`Validation failed: ${msg}`);
  }

  const batch = writeBatch(db);

  // If marked as default, unset any other defaults
  if (addressData.isDefault) {
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const existingDocsSnap = await getDocs(addressesCol);
    existingDocsSnap.forEach((docSnap) => {
      if (docSnap.id !== addressId && docSnap.data().isDefault) {
        batch.update(docSnap.ref, {
          isDefault: false,
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  const targetDocRef = doc(db, 'users', userId, 'addresses', addressId);
  const updatePayload = {
    fullName: addressData.fullName.trim(),
    phone: String(addressData.phone).trim(),
    houseStreet: addressData.houseStreet.trim(),
    areaLocality: (addressData.areaLocality || '').trim(),
    city: addressData.city.trim(),
    state: addressData.state.trim(),
    pincode: String(addressData.pincode).trim(),
    addressType: addressData.addressType || 'Home',
    isDefault: Boolean(addressData.isDefault),
    updatedAt: serverTimestamp(),
  };

  batch.update(targetDocRef, updatePayload);
  await batch.commit();

  return { id: addressId, ...updatePayload };
};

/**
 * Deletes an address.
 * If the deleted address was default and other addresses remain, sets the first remaining as default.
 */
export const deleteAddressService = async (userId, addressId) => {
  if (!userId || !addressId) throw new Error('User ID and Address ID are required');

  const targetDocRef = doc(db, 'users', userId, 'addresses', addressId);
  const addressesCol = collection(db, 'users', userId, 'addresses');
  const snapshot = await getDocs(addressesCol);

  const targetDoc = snapshot.docs.find((d) => d.id === addressId);
  const wasDefault = targetDoc?.data()?.isDefault;

  const batch = writeBatch(db);
  batch.delete(targetDocRef);

  // If deleted address was default, promote another address to default
  if (wasDefault) {
    const remaining = snapshot.docs.filter((d) => d.id !== addressId);
    if (remaining.length > 0) {
      batch.update(remaining[0].ref, {
        isDefault: true,
        updatedAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
};

/**
 * Sets an address as the default address, unsetting all others.
 */
export const setDefaultAddressService = async (userId, addressId) => {
  if (!userId || !addressId) throw new Error('User ID and Address ID are required');

  const addressesCol = collection(db, 'users', userId, 'addresses');
  const snapshot = await getDocs(addressesCol);

  const batch = writeBatch(db);

  snapshot.forEach((docSnap) => {
    if (docSnap.id === addressId) {
      batch.update(docSnap.ref, {
        isDefault: true,
        updatedAt: serverTimestamp(),
      });
    } else if (docSnap.data().isDefault) {
      batch.update(docSnap.ref, {
        isDefault: false,
        updatedAt: serverTimestamp(),
      });
    }
  });

  await batch.commit();
};

/**
 * Fetches all addresses for a user once.
 */
export const getUserAddressesService = async (userId) => {
  if (!userId) return [];
  const addressesCol = collection(db, 'users', userId, 'addresses');
  const snapshot = await getDocs(addressesCol);
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });
};

/**
 * Listens to addresses for a user in real-time.
 */
export const subscribeAddressesService = (userId, onUpdate, onError) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const addressesCol = collection(db, 'users', userId, 'addresses');
  return onSnapshot(
    addressesCol,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      // Sort default first, then newest
      items.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Addresses subscription error:', error);
      if (onError) onError(error);
    }
  );
};
