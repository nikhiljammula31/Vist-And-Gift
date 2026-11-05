import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiLogOut,
  FiEdit2,
  FiSave,
  FiX,
  FiLock,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiHome,
  FiBriefcase,
  FiCopy,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import {
  addAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
  subscribeAddressesService,
  isValidIndianPhone,
  isValidPincode,
} from '../firebase/addressService';
import PremiumButton from '../components/common/PremiumButton';

const Profile = () => {
  const { currentUser, userProfile, isEmailVerified, logout } = useAuth();
  const navigate = useNavigate();

  // Active tab: 'profile' | 'addresses' | 'security'
  const [activeTab, setActiveTab] = useState('profile');

  // -------------------------------------------------------------
  // 1. Profile Editing States
  // -------------------------------------------------------------
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.fullName || currentUser?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Synchronize state when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || currentUser?.displayName || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile, currentUser]);

  // -------------------------------------------------------------
  // 2. Change Password States
  // -------------------------------------------------------------
  const isGoogleUser =
    userProfile?.provider === 'google' ||
    currentUser?.providerData?.some((p) => p.providerId === 'google.com');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // -------------------------------------------------------------
  // 3. Address Management States
  // -------------------------------------------------------------
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    fullName: '',
    phone: '',
    houseStreet: '',
    areaLocality: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home',
    isDefault: false,
  });
  const [addressFormError, setAddressFormError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Subscribe to addresses in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoadingAddresses(true);

    const unsubscribe = subscribeAddressesService(
      currentUser.uid,
      (items) => {
        setAddresses(items);
        setLoadingAddresses(false);
      },
      (err) => {
        console.error('Error fetching addresses:', err);
        setLoadingAddresses(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Account creation date helper
  const createdDate = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  // Avatar Initials
  const getInitials = (name) => {
    if (!name) return 'VG';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Copy UID helper
  const handleCopyUid = () => {
    if (!currentUser?.uid) return;
    navigator.clipboard.writeText(currentUser.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // -------------------------------------------------------------
  // Save Profile Handler
  // -------------------------------------------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isSavingProfile || !currentUser) return;
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Full Name is required.');
      return;
    }

    if (phone.trim() && !isValidIndianPhone(phone)) {
      setProfileError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSavingProfile(true);
    try {
      // 1. Update Firebase Auth displayName
      if (fullName.trim() !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: fullName.trim() });
      }

      // 2. Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        updatedAt: serverTimestamp(),
      });

      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setProfileSuccess('');
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // -------------------------------------------------------------
  // Change Password Handler
  // -------------------------------------------------------------
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (isChangingPassword || !currentUser || isGoogleUser) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // 1. Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Update password in Firebase Auth
      await updatePassword(currentUser, newPassword);

      setPasswordSuccess('Password changed successfully! Keep it safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('The current password entered is incorrect.');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('The new password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/too-many-requests') {
        setPasswordError('Too many attempts. Please try again in a few minutes.');
      } else {
        setPasswordError(err.message || 'Failed to update password. Please verify credentials.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // -------------------------------------------------------------
  // Address Management Handlers
  // -------------------------------------------------------------
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressFormData({
      fullName: userProfile?.fullName || currentUser?.displayName || '',
      phone: userProfile?.phone || '',
      houseStreet: '',
      areaLocality: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'Home',
      isDefault: addresses.length === 0,
    });
    setAddressFormError('');
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressFormData({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      houseStreet: addr.houseStreet || '',
      areaLocality: addr.areaLocality || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      addressType: addr.addressType || 'Home',
      isDefault: Boolean(addr.isDefault),
    });
    setAddressFormError('');
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (isSavingAddress || !currentUser) return;
    setAddressFormError('');

    if (!addressFormData.fullName.trim()) {
      setAddressFormError('Full Name is required.');
      return;
    }
    if (!isValidIndianPhone(addressFormData.phone)) {
      setAddressFormError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!addressFormData.houseStreet.trim()) {
      setAddressFormError('House / Building / Street address is required.');
      return;
    }
    if (!addressFormData.city.trim()) {
      setAddressFormError('City is required.');
      return;
    }
    if (!addressFormData.state.trim()) {
      setAddressFormError('State is required.');
      return;
    }
    if (!isValidPincode(addressFormData.pincode)) {
      setAddressFormError('PIN code must be exactly 6 numeric digits.');
      return;
    }

    setIsSavingAddress(true);
    try {
      if (editingAddressId) {
        await updateAddressService(currentUser.uid, editingAddressId, addressFormData);
      } else {
        await addAddressService(currentUser.uid, addressFormData);
      }
      setShowAddressModal(false);
    } catch (err) {
      console.error('Error saving address:', err);
      setAddressFormError(err.message || 'Failed to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addrId) => {
    if (!currentUser) return;
    try {
      await setDefaultAddressService(currentUser.uid, addrId);
    } catch (err) {
      console.error('Error setting default address:', err);
    }
  };

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete || !currentUser || isDeletingAddress) return;
    setIsDeletingAddress(true);
    try {
      await deleteAddressService(currentUser.uid, addressToDelete.id);
      setAddressToDelete(null);
    } catch (err) {
      console.error('Error deleting address:', err);
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-primary-bg dark:bg-secondary-dark">
      {/* Background Decor */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-accent/25 dark:bg-accent/10 rounded-full filter blur-[100px] pointer-events-none animate-float" />
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-secondary-lavender/40 dark:bg-secondary-lavender/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Profile Header Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card p-6 sm:p-10 mb-8 rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-secondary-dark/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(248,184,200,0.2)]"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={userProfile?.fullName || 'Customer Avatar'}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-white/20 shadow-lg shadow-accent/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-accent via-accent-dark to-accent text-white flex items-center justify-center font-heading font-bold text-3xl border-4 border-white dark:border-white/20 shadow-lg shadow-accent/30">
                  {getInitials(userProfile?.fullName || currentUser?.displayName)}
                </div>
              )}
              {isEmailVerified && (
                <div
                  title="Verified Customer"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center border-2 border-white dark:border-secondary-dark shadow"
                >
                  <FiCheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* User Meta Information */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark dark:text-white">
                    {userProfile?.fullName || currentUser?.displayName || 'Valued Customer'}
                  </h1>
                  <p className="text-sm font-body text-secondary-dark/60 dark:text-gray-300">
                    {currentUser?.email}
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-2">
                  {!isEditing && activeTab === 'profile' && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="py-2 px-4 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-secondary-dark dark:text-white text-xs font-semibold font-body border border-gray-200 dark:border-white/20 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FiEdit2 className="w-3.5 h-3.5 text-accent-dark dark:text-pink-300" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2 px-4 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-500 hover:text-white text-red-500 text-xs font-semibold font-body border border-red-100 dark:border-red-900/40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FiLogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-body bg-pink-50 dark:bg-pink-900/30 text-accent-dark dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                  <FiShield className="w-3 h-3" />
                  Role: Customer
                </span>

                {isGoogleUser ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-body bg-gray-100 dark:bg-white/10 text-secondary-dark dark:text-white border border-gray-200 dark:border-white/20">
                    <FcGoogle className="w-3.5 h-3.5" />
                    Google Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-body bg-gray-100 dark:bg-white/10 text-secondary-dark dark:text-white border border-gray-200 dark:border-white/20">
                    <FiMail className="w-3 h-3 text-secondary-dark/60 dark:text-gray-300" />
                    Email / Password
                  </span>
                )}

                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-body bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                    <FiCheckCircle className="w-3 h-3" />
                    Verified Email
                  </span>
                ) : (
                  <Link
                    to="/verify-email"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-body bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <FiAlertCircle className="w-3 h-3" />
                    Verify Email Now
                  </Link>
                )}

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-body text-secondary-dark/60 dark:text-gray-400 bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <FiCalendar className="w-3 h-3" />
                  Member since {createdDate}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clean Dashboard Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 border-b border-gray-200/80 dark:border-white/10 pb-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setIsEditing(false);
            }}
            className={`py-2 px-5 rounded-2xl font-body font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'text-secondary-dark/70 dark:text-gray-300 hover:text-accent hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            <FiUser className="w-4 h-4" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('addresses');
              setIsEditing(false);
            }}
            className={`py-2 px-5 rounded-2xl font-body font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'text-secondary-dark/70 dark:text-gray-300 hover:text-accent hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            <FiMapPin className="w-4 h-4" />
            <span>Delivery Addresses ({addresses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setIsEditing(false);
            }}
            className={`py-2 px-5 rounded-2xl font-body font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'text-secondary-dark/70 dark:text-gray-300 hover:text-accent hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            <FiLock className="w-4 h-4" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <AnimatePresence mode="wait">
          {/* TAB 1: PROFILE DETAILS & EDIT PROFILE */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 sm:p-8 rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-secondary-dark/70 backdrop-blur-xl shadow-[0_15px_35px_rgba(248,184,200,0.18)] space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold text-secondary-dark dark:text-white">
                    {isEditing ? 'Edit Customer Profile' : 'Customer Information'}
                  </h2>
                  <p className="text-xs font-body text-secondary-dark/60 dark:text-gray-400 mt-0.5">
                    {isEditing
                      ? 'Update your name and contact details. Email address is immutable.'
                      : 'Overview of your registered personal and account details.'}
                  </p>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="py-2 px-4 rounded-xl bg-accent text-white text-xs font-semibold font-body shadow-md shadow-accent/20 hover:shadow-accent/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-6">
                  {/* Grid of Profile Attributes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body">
                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                      <p className="text-xs font-semibold text-secondary-dark/50 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Full Name
                      </p>
                      <p className="text-base font-medium text-secondary-dark dark:text-white flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-accent-dark dark:text-pink-300" />
                        {userProfile?.fullName || currentUser?.displayName || 'Not specified'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                      <p className="text-xs font-semibold text-secondary-dark/50 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Registered Email (Immutable)
                      </p>
                      <p className="text-base font-medium text-secondary-dark dark:text-white flex items-center gap-2 truncate">
                        <FiMail className="w-4 h-4 text-accent-dark dark:text-pink-300 shrink-0" />
                        <span className="truncate">{currentUser?.email}</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                      <p className="text-xs font-semibold text-secondary-dark/50 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Mobile Number
                      </p>
                      <p className="text-base font-medium text-secondary-dark dark:text-white flex items-center gap-2">
                        <FiPhone className="w-4 h-4 text-accent-dark dark:text-pink-300" />
                        {userProfile?.phone || 'Not provided'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-secondary-dark/50 dark:text-gray-400 uppercase tracking-wider">
                          Account ID (UID)
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyUid}
                          className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedUid ? (
                            <>
                              <FiCheck className="w-3 h-3 text-green-500" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <FiCopy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-mono font-medium text-secondary-dark/70 dark:text-gray-300 truncate">
                        {currentUser?.uid}
                      </p>
                    </div>
                  </div>

                  {/* Account Information Section Requirement */}
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                    <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-secondary-dark/60 dark:text-gray-400 mb-3">
                      Account Information & Security
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body">
                      <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                        <span className="text-gray-400 block mb-0.5">Authentication Provider</span>
                        <span className="font-semibold text-secondary-dark dark:text-white capitalize">
                          {userProfile?.provider === 'google' ? 'Google OAuth' : 'Email & Password'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                        <span className="text-gray-400 block mb-0.5">Email Verification</span>
                        <span className={`font-semibold ${isEmailVerified ? 'text-green-600' : 'text-amber-600'}`}>
                          {isEmailVerified ? 'Verified Customer' : 'Unverified'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                        <span className="text-gray-400 block mb-0.5">Account Created</span>
                        <span className="font-semibold text-secondary-dark dark:text-white">
                          {createdDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit Profile Form */
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  {profileSuccess && (
                    <div className="p-3.5 rounded-2xl bg-green-50 text-green-700 text-sm font-body border border-green-200 flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4 shrink-0" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {profileError && (
                    <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 text-sm font-body border border-red-200 flex items-center gap-2">
                      <FiAlertCircle className="w-4 h-4 shrink-0" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 font-body uppercase mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. Priya Sharma"
                      className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-secondary-dark/60 border border-pink-100 dark:border-white/20 focus:border-accent focus:ring-4 focus:ring-accent/20 outline-none font-body text-sm text-secondary-dark dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 font-body uppercase mb-1.5">
                      Registered Email Address (Cannot be changed)
                    </label>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="w-full py-3 px-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-body text-sm text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-gray-400 font-body mt-1">
                      To protect your account, your primary email cannot be modified through normal profile edit.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 font-body uppercase mb-1.5">
                      Mobile Number (India)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number, e.g. 9876543210"
                      className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-secondary-dark/60 border border-pink-100 dark:border-white/20 focus:border-accent focus:ring-4 focus:ring-accent/20 outline-none font-body text-sm text-secondary-dark dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSavingProfile}
                      className="py-3 px-6 rounded-2xl bg-gradient-to-r from-accent to-accent-dark text-white font-body font-semibold text-sm shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <FiSave className="w-4 h-4" />
                      <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile'}</span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => {
                        setFullName(userProfile?.fullName || currentUser?.displayName || '');
                        setPhone(userProfile?.phone || '');
                        setIsEditing(false);
                      }}
                      className="py-3 px-5 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-secondary-dark dark:text-white font-body font-semibold text-sm hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiX className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* TAB 2: ADDRESS MANAGEMENT */}
          {activeTab === 'addresses' && (
            <motion.div
              key="addresses-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 sm:p-8 rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-secondary-dark/70 backdrop-blur-xl shadow-[0_15px_35px_rgba(248,184,200,0.18)] space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-heading font-bold text-secondary-dark dark:text-white">
                    Delivery Addresses
                  </h2>
                  <p className="text-xs font-body text-secondary-dark/60 dark:text-gray-400 mt-0.5">
                    Manage your shipping destinations for customized gifts, visiting cards, and corporate orders.
                  </p>
                </div>

                <PremiumButton
                  onClick={handleOpenAddAddress}
                  variant="gradient"
                  className="py-2.5 px-5 text-xs flex items-center gap-2 self-start sm:self-auto"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add New Address</span>
                </PremiumButton>
              </div>

              {loadingAddresses ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 animate-pulse space-y-3"
                    >
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="p-8 sm:p-12 text-center rounded-2xl bg-white/40 dark:bg-white/5 border border-dashed border-pink-200 dark:border-pink-900/40">
                  <div className="w-16 h-16 rounded-2xl bg-pink-100 dark:bg-pink-900/30 text-accent-dark dark:text-pink-300 flex items-center justify-center mx-auto mb-4">
                    <FiMapPin className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-secondary-dark dark:text-white mb-1">
                    No Saved Addresses
                  </h3>
                  <p className="text-xs font-body text-secondary-dark/60 dark:text-gray-400 max-w-sm mx-auto mb-6">
                    You haven&apos;t added any delivery addresses yet. Add your home, work, or corporate address for rapid checkout.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="py-2.5 px-6 rounded-xl bg-accent text-white font-body font-semibold text-xs shadow-md shadow-accent/20 cursor-pointer"
                  >
                    Add Address Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        addr.isDefault
                          ? 'bg-white/90 dark:bg-white/10 border-accent dark:border-pink-500 shadow-md shadow-pink-200/40 dark:shadow-none'
                          : 'bg-white/60 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-accent/40'
                      }`}
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-body bg-pink-50 dark:bg-pink-900/30 text-accent-dark dark:text-pink-300 border border-pink-100 dark:border-pink-800">
                              {addr.addressType === 'Home' && <FiHome className="w-3 h-3" />}
                              {addr.addressType === 'Work' && <FiBriefcase className="w-3 h-3" />}
                              {addr.addressType || 'Address'}
                            </span>

                            {addr.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-body bg-accent text-white shadow-sm">
                                <FiCheck className="w-3 h-3" /> DEFAULT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              title="Edit Address"
                              className="p-1.5 rounded-lg text-secondary-dark/60 dark:text-gray-300 hover:text-accent hover:bg-pink-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddressToDelete(addr)}
                              title="Delete Address"
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Recipient details */}
                        <h4 className="font-heading font-bold text-sm text-secondary-dark dark:text-white">
                          {addr.fullName}
                        </h4>
                        <p className="text-xs font-body text-secondary-dark/70 dark:text-gray-300 flex items-center gap-1 mt-0.5">
                          <FiPhone className="w-3 h-3 text-accent" />
                          <span>+91 {addr.phone}</span>
                        </p>

                        {/* Address body */}
                        <p className="text-xs font-body text-secondary-dark/80 dark:text-gray-300 mt-2 leading-relaxed">
                          {addr.houseStreet}
                          {addr.areaLocality && `, ${addr.areaLocality}`}
                          <br />
                          {addr.city}, {addr.state} -{' '}
                          <span className="font-mono font-semibold">{addr.pincode}</span>
                        </p>
                      </div>

                      {/* Default Action */}
                      {!addr.isDefault && (
                        <div className="pt-4 mt-3 border-t border-gray-100 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs font-body font-semibold text-accent hover:underline cursor-pointer"
                          >
                            Set as Default Address
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: SECURITY & CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <motion.div
              key="security-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 sm:p-8 rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-secondary-dark/70 backdrop-blur-xl shadow-[0_15px_35px_rgba(248,184,200,0.18)] space-y-6"
            >
              <div>
                <h2 className="text-xl font-heading font-bold text-secondary-dark dark:text-white">
                  Security & Password
                </h2>
                <p className="text-xs font-body text-secondary-dark/60 dark:text-gray-400 mt-0.5">
                  Update your authentication credentials and manage login security.
                </p>
              </div>

              {isGoogleUser ? (
                /* Google Authentication User Notice Requirement */
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/80 dark:border-blue-900/40 text-secondary-dark dark:text-white space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-secondary-dark shadow-sm flex items-center justify-center">
                      <FcGoogle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-secondary-dark dark:text-white">
                        Authenticated via Google Sign-In
                      </h3>
                      <p className="text-xs font-body text-secondary-dark/70 dark:text-gray-300">
                        Linked with {currentUser?.email}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-body leading-relaxed text-secondary-dark/80 dark:text-gray-300">
                    Your account uses secure Google OAuth authentication. You do not need a separate password for Visit & Gift. Password changes, two-factor authentication, and security preferences are safely managed directly through your Google Account.
                  </p>
                </div>
              ) : (
                /* Secure Change Password Form */
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  {passwordSuccess && (
                    <div className="p-3.5 rounded-2xl bg-green-50 text-green-700 text-sm font-body border border-green-200 flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 text-sm font-body border border-red-200 flex items-center gap-2">
                      <FiAlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 font-body uppercase mb-1.5">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Enter your current password"
                        className="w-full py-3 px-4 pr-11 rounded-2xl bg-white dark:bg-secondary-dark/60 border border-pink-100 dark:border-white/20 focus:border-accent focus:ring-4 focus:ring-accent/20 outline-none font-body text-sm text-secondary-dark dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent cursor-pointer"
                      >
                        {showCurrentPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 font-body uppercase mb-1.5">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="At least 6 characters"
                        className="w-full py-3 px-4 pr-11 rounded-2xl bg-white dark:bg-secondary-dark/60 border border-pink-100 dark:border-white/20 focus:border-accent focus:ring-4 focus:ring-accent/20 outline-none font-body text-sm text-secondary-dark dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent cursor-pointer"
                      >
                        {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 font-body uppercase mb-1.5">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                        className="w-full py-3 px-4 pr-11 rounded-2xl bg-white dark:bg-secondary-dark/60 border border-pink-100 dark:border-white/20 focus:border-accent focus:ring-4 focus:ring-accent/20 outline-none font-body text-sm text-secondary-dark dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent cursor-pointer"
                      >
                        {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isChangingPassword}
                      className="py-3 px-6 rounded-2xl bg-gradient-to-r from-accent to-accent-dark text-white font-body font-semibold text-sm shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <FiLock className="w-4 h-4" />
                      <span>{isChangingPassword ? 'Verifying & Updating...' : 'Update Password'}</span>
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------------------------------------------------- */}
        {/* MODAL 1: ADD / EDIT ADDRESS MODAL */}
        {/* ----------------------------------------------------------- */}
        <AnimatePresence>
          {showAddressModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddressModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-lg glass-card p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-secondary-dark/95 border border-pink-100 dark:border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-white/10">
                  <h3 className="font-heading font-bold text-lg text-secondary-dark dark:text-white">
                    {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4 font-body">
                  {addressFormError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-body border border-red-200">
                      {addressFormError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 uppercase mb-1">
                        Recipient Name *
                      </label>
                      <input
                        type="text"
                        value={addressFormData.fullName}
                        onChange={(e) =>
                          setAddressFormData({ ...addressFormData, fullName: e.target.value })
                        }
                        required
                        placeholder="e.g. Ramesh Patel"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-secondary-dark dark:text-white focus:border-accent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 uppercase mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={addressFormData.phone}
                        onChange={(e) =>
                          setAddressFormData({ ...addressFormData, phone: e.target.value })
                        }
                        required
                        placeholder="10-digit mobile"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-secondary-dark dark:text-white focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 uppercase mb-1">
                      House / Flat / Building / Street *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.houseStreet}
                      onChange={(e) =>
                        setAddressFormData({ ...addressFormData, houseStreet: e.target.value })
                      }
                      required
                      placeholder="e.g. Flat 402, Royal Palms, MG Road"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-secondary-dark dark:text-white focus:border-accent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 uppercase mb-1">
                      Area / Locality / Landmark
                    </label>
                    <input
                      type="text"
                      value={addressFormData.areaLocality}
                      onChange={(e) =>
                        setAddressFormData({ ...addressFormData, areaLocality: e.target.value })
                      }
                      placeholder="e.g. Near City Center"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-secondary-dark dark:text-white focus:border-accent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 uppercase mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={addressFormData.city}
                        onChange={(e) =>
                          setAddressFormData({ ...addressFormData, city: e.target.value })
                        }
                        required
                        placeholder="e.g. Mumbai"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-secondary-dark dark:text-white focus:border-accent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 uppercase mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={addressFormData.state}
                        onChange={(e) =>
                          setAddressFormData({ ...addressFormData, state: e.target.value })
                        }
                        required
                        placeholder="e.g. Maharashtra"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-secondary-dark dark:text-white focus:border-accent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 uppercase mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        value={addressFormData.pincode}
                        onChange={(e) =>
                          setAddressFormData({ ...addressFormData, pincode: e.target.value })
                        }
                        required
                        placeholder="6 digits"
                        maxLength={6}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-secondary-dark dark:text-white focus:border-accent outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Address Type */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary-dark/70 dark:text-gray-300 uppercase mb-1.5">
                      Address Type
                    </label>
                    <div className="flex items-center gap-3">
                      {['Home', 'Work', 'Other'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAddressFormData({ ...addressFormData, addressType: type })}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            addressFormData.addressType === type
                              ? 'bg-accent text-white border-accent shadow-sm'
                              : 'bg-white/50 dark:bg-white/5 text-secondary-dark/70 dark:text-gray-300 border-gray-200 dark:border-white/10'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Make Default Checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isDefaultCheckbox"
                      checked={addressFormData.isDefault}
                      onChange={(e) =>
                        setAddressFormData({ ...addressFormData, isDefault: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent"
                    />
                    <label
                      htmlFor="isDefaultCheckbox"
                      className="text-xs font-body text-secondary-dark/80 dark:text-gray-300 cursor-pointer select-none"
                    >
                      Set this as my default shipping address
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(false)}
                      className="py-2.5 px-5 rounded-xl bg-gray-100 dark:bg-white/10 text-secondary-dark dark:text-white text-xs font-semibold hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSavingAddress}
                      className="py-2.5 px-6 rounded-xl bg-accent text-white text-xs font-semibold shadow-md shadow-accent/25 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingAddress ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ----------------------------------------------------------- */}
        {/* MODAL 2: DELETE ADDRESS CONFIRMATION MODAL */}
        {/* ----------------------------------------------------------- */}
        <AnimatePresence>
          {addressToDelete && (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAddressToDelete(null)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-sm glass-card p-6 rounded-3xl bg-white/95 dark:bg-secondary-dark/95 border border-red-100 dark:border-red-900/30 shadow-2xl text-center space-y-4 font-body"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 mx-auto flex items-center justify-center">
                  <FiTrash2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-secondary-dark dark:text-white">
                  Delete Address?
                </h3>
                <p className="text-xs text-secondary-dark/70 dark:text-gray-300">
                  Are you sure you want to remove the address for{' '}
                  <span className="font-semibold text-secondary-dark dark:text-white">
                    {addressToDelete.fullName} ({addressToDelete.city})
                  </span>
                  ? This action cannot be undone.
                </p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddressToDelete(null)}
                    className="py-2 px-5 rounded-xl bg-gray-100 dark:bg-white/10 text-secondary-dark dark:text-white text-xs font-semibold cursor-pointer"
                  >
                    Keep Address
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteAddress}
                    disabled={isDeletingAddress}
                    className="py-2 px-5 rounded-xl bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-200 cursor-pointer disabled:opacity-50"
                  >
                    {isDeletingAddress ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
