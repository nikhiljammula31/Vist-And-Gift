import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiShield } from 'react-icons/fi';

/**
 * Route protection guard for administrative dashboard pages.
 * Ensures the user is authenticated and possesses valid administrator role or custom claims.
 * Non-admins are redirected safely to prevent unauthorized interface rendering.
 */
const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary-bg p-6">
        <div className="w-14 h-14 rounded-2xl bg-accent-light/60 border border-pink-200 flex items-center justify-center shadow-md animate-pulse">
          <FiShield className="w-7 h-7 text-accent" />
        </div>
        <p className="mt-4 font-body text-xs font-semibold uppercase tracking-wider text-secondary-dark/60">
          Verifying Administrator Privileges...
        </p>
      </div>
    );
  }

  // If not signed in at all, redirect to unified login page in admin mode
  if (!currentUser) {
    return (
      <Navigate
        to="/login?mode=admin"
        state={{
          from: location,
          message: 'Please sign in with your administrator account to access the Admin Portal.',
        }}
        replace
      />
    );
  }

  // If authenticated but role is not admin, redirect to unified login page with access denied notice
  if (!isAdmin) {
    return (
      <Navigate
        to="/login?mode=admin"
        state={{
          from: location,
          error: 'Access Denied: Administrator privileges are required to view this area.',
        }}
        replace
      />
    );
  }

  return children;
};

export default AdminRoute;
