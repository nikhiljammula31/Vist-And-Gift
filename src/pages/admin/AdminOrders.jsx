import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiPackage,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiMapPin,
  FiChevronDown,
} from 'react-icons/fi';
import {
  getAllOrders,
  updateOrderStatus,
  ALLOWED_ORDER_STATUSES,
} from '../../services/adminService';
import { formatOrderDate } from '../../firebase/orderService';

const statusBadgeClasses = {
  placed: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status updating state
  const [updatingId, setUpdatingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const fetchOrdersData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getAllOrders();
      setOrders(data);
      setSelectedOrder((prev) =>
        prev ? data.find((o) => o.id === prev.id) || prev : null
      );
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Unable to load orders from Firestore.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;
    setUpdatingId(orderId);
    setStatusMessage(null);

    try {
      await updateOrderStatus(orderId, newStatus);
      // Update local state
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? { ...ord, orderStatus: newStatus, updatedAt: new Date() }
            : ord
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newStatus,
          updatedAt: new Date(),
        }));
      }
      setStatusMessage({
        type: 'success',
        text: `Order ${orderId} successfully updated to "${newStatus}".`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to update order status:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update order status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesStatus =
        statusFilter === 'all' || ord.orderStatus === statusFilter;

      if (!matchesStatus) return false;

      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      const orderId = (ord.orderId || ord.id || '').toLowerCase();
      const customerName = (ord.customerDetails?.fullName || '').toLowerCase();
      const customerEmail = (ord.customerDetails?.email || '').toLowerCase();
      const phone = (ord.customerDetails?.phone || '').toLowerCase();

      return (
        orderId.includes(term) ||
        customerName.includes(term) ||
        customerEmail.includes(term) ||
        phone.includes(term)
      );
    });
  }, [orders, statusFilter, searchTerm]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark tracking-tight">
            Order Management
          </h1>
          <p className="text-sm text-secondary-light mt-1">
            Track, inspect, and update customer fulfillment across all channels.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrdersData(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-secondary-dark bg-white border border-[#F8B8C8] rounded-xl hover:bg-pink-50 transition cursor-pointer disabled:opacity-50 shadow-xs self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Orders'}</span>
        </button>
      </div>

      {/* Global Status Message Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm border shadow-xs animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <FiAlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="flex-1 font-medium">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
          <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error Loading Orders</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchOrdersData(true)}
            className="text-xs font-bold underline hover:text-red-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Search & Filter Toolbar                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, customer, email, or phone..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-pink-50/40 border border-pink-200/60 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 text-xs text-secondary-light">
            <span>Showing:</span>
            <span className="font-bold text-secondary-dark">{filteredOrders.length}</span>
            <span>of</span>
            <span className="font-bold text-secondary-dark">{orders.length}</span>
            <span>orders</span>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-pink-50 scrollbar-none">
          <span className="text-xs font-semibold text-secondary-light flex items-center gap-1 shrink-0 mr-1">
            <FiFilter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {['all', ...ALLOWED_ORDER_STATUSES].map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  active
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-pink-50/70 text-secondary-light hover:bg-pink-100 hover:text-secondary-dark border border-pink-200/50'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Orders Table                                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-pink-50/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center px-4">
            <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-secondary-dark font-heading">
              No orders found
            </h3>
            <p className="text-xs text-secondary-light mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filter selection to find orders.'
                : 'Customer orders will appear here as soon as patrons place them in the shop.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F7] border-b border-pink-100 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Date Placed</th>
                  <th className="py-3 px-4 font-semibold">Items</th>
                  <th className="py-3 px-4 font-semibold">Total Amount</th>
                  <th className="py-3 px-4 font-semibold">Fulfillment Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => {
                  const statusClass =
                    statusBadgeClasses[ord.orderStatus] || 'bg-gray-50 text-gray-700 border-gray-200';
                  const isUpdating = updatingId === ord.id;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-pink-50/40 transition-colors group"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-secondary-dark">
                        {ord.orderId || ord.id.slice(0, 10)}
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-secondary-dark">
                          {ord.customerDetails?.fullName || 'Customer'}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {ord.customerDetails?.email || '—'}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-secondary-light whitespace-nowrap">
                        {formatOrderDate(ord.createdAt)}
                      </td>

                      {/* Items count */}
                      <td className="py-3.5 px-4 text-secondary-dark">
                        <span className="font-semibold">{ord.items?.length || 0}</span> item(s)
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-bold text-secondary-dark whitespace-nowrap">
                        {formatCurrency(ord.totalAmount)}
                      </td>

                      {/* Order Status & Dropdown Quick Changer */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <select
                            disabled={isUpdating}
                            value={ord.orderStatus}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                            className={`text-[10px] font-bold uppercase tracking-wider py-1 pl-2.5 pr-6 rounded-full border appearance-none cursor-pointer transition focus:outline-hidden ${statusClass} ${
                              isUpdating ? 'opacity-50 cursor-wait' : ''
                            }`}
                          >
                            {ALLOWED_ORDER_STATUSES.map((st) => (
                              <option key={st} value={st} className="bg-white text-secondary-dark">
                                {st}
                              </option>
                            ))}
                          </select>
                          <FiChevronDown className="w-3 h-3 text-current pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                        </div>
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary-dark bg-white border border-[#F8B8C8] rounded-xl hover:bg-pink-50 transition cursor-pointer shadow-2xs"
                        >
                          <FiEye className="w-3.5 h-3.5 text-accent" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Detailed Order Modal                                          */}
      {/* ------------------------------------------------------------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-pink-100 flex flex-col max-h-[90vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-pink-100 flex items-center justify-between bg-[#FAF7F7]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-pink-100 px-2 py-0.5 rounded-full inline-block mb-1">
                  Order Details
                </span>
                <h3 className="text-xl font-heading font-bold text-secondary-dark">
                  {selectedOrder.orderId || selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-secondary-dark hover:bg-pink-50 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-secondary-dark">
              {/* Status Bar in Modal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                    Current Fulfillment Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${
                        statusBadgeClasses[selectedOrder.orderStatus] ||
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {selectedOrder.orderStatus}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      Placed on {formatOrderDate(selectedOrder.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Change Status Control */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-secondary-light">Change to:</span>
                  <select
                    disabled={updatingId === selectedOrder.id}
                    value={selectedOrder.orderStatus}
                    onChange={(e) =>
                      handleStatusChange(selectedOrder.id, e.target.value)
                    }
                    className="py-1.5 px-3 text-xs font-semibold bg-white border border-pink-300 rounded-xl focus:outline-hidden focus:border-accent cursor-pointer shadow-xs"
                  >
                    {ALLOWED_ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer & Shipping Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="p-4 rounded-2xl border border-pink-100 bg-[#FAF7F7]/60 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-secondary-dark text-xs pb-2 border-b border-pink-100">
                    <FiUser className="w-4 h-4 text-accent" />
                    <span>Customer Details</span>
                  </div>
                  <p>
                    <span className="text-gray-400">Name:</span>{' '}
                    <span className="font-semibold">
                      {selectedOrder.customerDetails?.fullName || 'Not provided'}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">Email:</span>{' '}
                    <span className="font-semibold">
                      {selectedOrder.customerDetails?.email || 'Not provided'}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">Phone:</span>{' '}
                    <span className="font-semibold">
                      {selectedOrder.customerDetails?.phone || 'Not provided'}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 font-mono">
                    User UID: {selectedOrder.userId || 'Guest'}
                  </p>
                </div>

                {/* Shipping Address */}
                <div className="p-4 rounded-2xl border border-pink-100 bg-[#FAF7F7]/60 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-secondary-dark text-xs pb-2 border-b border-pink-100">
                    <FiMapPin className="w-4 h-4 text-accent" />
                    <span>Shipping Destination</span>
                  </div>
                  <p className="font-semibold text-secondary-dark">
                    {selectedOrder.shippingAddress?.addressLine || '—'}
                  </p>
                  <p className="text-gray-500">
                    {[
                      selectedOrder.shippingAddress?.city,
                      selectedOrder.shippingAddress?.state,
                      selectedOrder.shippingAddress?.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>

              {/* Purchased Line Items */}
              <div>
                <h4 className="font-heading font-bold text-sm text-secondary-dark mb-3">
                  Ordered Products ({selectedOrder.items?.length || 0})
                </h4>
                <div className="border border-pink-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-pink-50/20 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-pink-100 shrink-0"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-secondary-dark truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Unit Price: {item.price} &times; {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-bold text-secondary-dark shrink-0">
                        {formatCurrency(
                          (typeof item.numericPrice === 'number'
                            ? item.numericPrice
                            : Number(String(item.price).replace(/[^0-9.]/g, '')) || 0) *
                            (item.quantity || 1)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2 text-xs">
                <div className="flex justify-between text-secondary-light">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-secondary-dark">
                    {formatCurrency(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-secondary-light">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-secondary-dark">
                    {selectedOrder.deliveryCharge === 0
                      ? 'FREE'
                      : formatCurrency(selectedOrder.deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-secondary-dark pt-2 border-t border-pink-200">
                  <span>Grand Total</span>
                  <span className="text-accent">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-pink-100 bg-[#FAF7F7] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-xl transition cursor-pointer shadow-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
