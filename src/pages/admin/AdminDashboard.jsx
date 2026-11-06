import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiTrendingUp,
  FiArrowRight,
  FiRefreshCw,
  FiAlertCircle,
  FiPlus,
} from 'react-icons/fi';
import { getAdminDashboardMetrics } from '../../services/adminService';
import { getAllProducts } from '../../services/productService';
import { formatOrderDate } from '../../firebase/orderService';

const statusBadgeClasses = {
  placed: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    grossRevenue: 0,
    totalProducts: 0,
    recentOrders: [],
    recentCustomers: [],
  });

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [dashMetrics, products] = await Promise.all([
        getAdminDashboardMetrics(),
        getAllProducts(),
      ]);

      setMetrics({
        ...dashMetrics,
        totalProducts: products.length,
      });
    } catch (err) {
      console.error('Failed to load admin dashboard metrics:', err);
      setError(err.message || 'Unable to load administrative overview metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-secondary-light mt-1">
            Real-time business performance, customer growth, and fulfillment overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-secondary-dark bg-white border border-[#F8B8C8] rounded-xl hover:bg-pink-50 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>

          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-xl shadow-md shadow-accent/20 transition cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
          <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to fetch live metrics</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="text-xs font-bold underline hover:text-red-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. Core Summary Metrics Cards                                */}
      {/* ------------------------------------------------------------- */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-pink-100 shadow-xs animate-pulse space-y-3">
              <div className="w-10 h-10 bg-pink-100 rounded-xl" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-7 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Gross Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-xs hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-50 text-accent border border-pink-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Sales
              </span>
            </div>
            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider">Gross Revenue</p>
            <p className="text-2xl font-bold font-heading text-secondary-dark mt-1">
              {formatCurrency(metrics.grossRevenue)}
            </p>
            <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
              <span>Excludes cancelled orders</span>
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-xs hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FiPackage className="w-6 h-6" />
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <span>View all</span>
                <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold font-heading text-secondary-dark mt-1">
              {metrics.totalOrders}
            </p>
            <p className="text-[11px] text-gray-500 mt-2">
              All time client transactions
            </p>
          </div>

          {/* Registered Customers */}
          <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-xs hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FiUsers className="w-6 h-6" />
              </div>
              <Link
                to="/admin/customers"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View all</span>
                <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider">Customers</p>
            <p className="text-2xl font-bold font-heading text-secondary-dark mt-1">
              {metrics.totalCustomers}
            </p>
            <p className="text-[11px] text-gray-500 mt-2">
              Registered user accounts
            </p>
          </div>

          {/* Catalog Products */}
          <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-xs hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FiShoppingBag className="w-6 h-6" />
              </div>
              <Link
                to="/admin/products"
                className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
              >
                <span>Catalog</span>
                <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider">Products</p>
            <p className="text-2xl font-bold font-heading text-secondary-dark mt-1">
              {metrics.totalProducts}
            </p>
            <p className="text-[11px] text-gray-500 mt-2">
              Active gift items
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Recent Orders & Recent Customers Side-by-Side              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-pink-50 mb-4">
            <div>
              <h2 className="text-lg font-heading font-bold text-secondary-dark">
                Recent Orders
              </h2>
              <p className="text-xs text-secondary-light">
                Latest customer purchases requiring fulfillment
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-dark transition"
            >
              <span>Manage all orders</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-pink-50/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : metrics.recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <FiPackage className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-secondary-dark">No orders yet</p>
              <p className="text-xs text-secondary-light mt-0.5">
                New customer orders will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4 font-semibold">Order ID</th>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Amount</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {metrics.recentOrders.map((ord) => {
                    const statusClass =
                      statusBadgeClasses[ord.orderStatus] || 'bg-gray-50 text-gray-700 border-gray-200';
                    return (
                      <tr key={ord.id} className="hover:bg-pink-50/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-secondary-dark font-mono">
                          {ord.orderId || ord.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-secondary-dark line-clamp-1">
                            {ord.customerDetails?.fullName || 'Customer'}
                          </p>
                          <p className="text-[11px] text-gray-400 line-clamp-1">
                            {ord.customerDetails?.email || '—'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-secondary-light whitespace-nowrap">
                          {formatOrderDate(ord.createdAt)}
                        </td>
                        <td className="py-3 px-4 font-bold text-secondary-dark whitespace-nowrap">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusClass}`}
                          >
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to="/admin/orders"
                            className="text-xs font-semibold text-accent hover:text-accent-dark transition underline"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Customers (1 Column) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-pink-50 mb-4">
              <div>
                <h2 className="text-lg font-heading font-bold text-secondary-dark">
                  New Customers
                </h2>
                <p className="text-xs text-secondary-light">
                  Recently joined patrons
                </p>
              </div>
              <Link
                to="/admin/customers"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-dark transition"
              >
                <span>All</span>
                <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-pink-50/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : metrics.recentCustomers.length === 0 ? (
              <div className="py-12 text-center">
                <FiUsers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-secondary-dark">No customers yet</p>
                <p className="text-xs text-secondary-light mt-0.5">
                  Registered accounts will be listed here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.recentCustomers.map((cust) => {
                  const initial = (cust.fullName || cust.email || 'C')[0].toUpperCase();
                  return (
                    <div
                      key={cust.uid}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-pink-50/50 transition border border-transparent hover:border-pink-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent/20 to-pink-200 border border-[#F8B8C8] flex items-center justify-center font-bold text-accent text-xs shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-secondary-dark truncate">
                            {cust.fullName}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {cust.email}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            cust.provider === 'google'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {cust.provider}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-pink-50 text-center">
            <Link
              to="/admin/customers"
              className="w-full inline-block py-2 text-xs font-semibold text-secondary-dark bg-pink-50/70 hover:bg-pink-100/70 border border-pink-200/50 rounded-xl transition cursor-pointer"
            >
              Browse Complete Customer Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
