import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AppBackground from './components/common/AppBackground';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';

// Lazy load pages
const Home = React.lazy(() => import('./pages/Home'));
const Services = React.lazy(() => import('./pages/Services'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const MyOrders = React.lazy(() => import('./pages/MyOrders'));
const OrderDetail = React.lazy(() => import('./pages/OrderDetail'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Notifications = React.lazy(() => import('./pages/Notifications'));

// Admin Dashboard Pages (Phase 5)
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = React.lazy(() => import('./pages/admin/AdminCustomers'));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts'));

// Premium loading fallback for suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-transparent">
    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <>
      <AppBackground />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="about" element={<About />} />
            <Route path="product/:productId" element={<ProductDetail />} />
            <Route
              path="contact"
              element={
                <ProtectedRoute requireVerified={false}>
                  <Contact />
                </ProtectedRoute>
              }
            />
            <Route
              path="shop"
              element={
                <ProtectedRoute requireVerified={false}>
                  <Shop />
                </ProtectedRoute>
              }
            />
            <Route path="cart" element={<Cart />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute requireVerified={true}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="wishlist"
              element={
                <ProtectedRoute requireVerified={true}>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute requireVerified={true}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-orders"
              element={
                <ProtectedRoute requireVerified={true}>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="order/:orderId"
              element={
                <ProtectedRoute requireVerified={true}>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <ProtectedRoute requireVerified={true}>
                  <Cart />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect /admin/login to unified /login?mode=admin */}
          <Route path="admin/login" element={<Navigate to="/login?mode=admin" replace />} />

          {/* Admin Dashboard Protected Routes (Phase 5) */}
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="products" element={<AdminProducts />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
