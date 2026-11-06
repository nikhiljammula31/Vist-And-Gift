import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
} from 'react-icons/fi';
import {
  getAllCustomers,
  getCustomerOrdersAdmin,
} from '../../services/adminService';
import { formatOrderDate } from '../../firebase/orderService';

const statusBadgeClasses = {
  placed: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Selected customer modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomersData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err.message || 'Unable to load customer directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomersData();
  }, [fetchCustomersData]);

  // When a customer is selected, fetch their order history
  const handleSelectCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    try {
      const orders = await getCustomerOrdersAdmin(cust.uid);
      setCustomerOrders(orders);
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase().trim();

    return customers.filter((cust) => {
      const name = (cust.fullName || '').toLowerCase();
      const email = (cust.email || '').toLowerCase();
      const phone = (cust.phone || '').toLowerCase();
      const uid = (cust.uid || '').toLowerCase();

      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        uid.includes(term)
      );
    });
  }, [customers, searchTerm]);

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    try {
      return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark tracking-tight">
            Customer Management
          </h1>
          <p className="text-sm text-secondary-light mt-1">
            Browse registered patrons, inspect order history, and monitor account status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchCustomersData(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-secondary-dark bg-white border border-[#F8B8C8] rounded-xl hover:bg-pink-50 transition cursor-pointer disabled:opacity-50 shadow-xs self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Directory'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
          <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error Loading Customers</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchCustomersData(true)}
            className="text-xs font-bold underline hover:text-red-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, email, phone, or UID..."
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

        <div className="flex items-center gap-2 text-xs text-secondary-light">
          <span>Showing:</span>
          <span className="font-bold text-secondary-dark">{filteredCustomers.length}</span>
          <span>of</span>
          <span className="font-bold text-secondary-dark">{customers.length}</span>
          <span>patrons</span>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-pink-50/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center px-4">
            <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-secondary-dark font-heading">
              No customers found
            </h3>
            <p className="text-xs text-secondary-light mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'No customer matched your search criteria.'
                : 'Registered patrons will be listed here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F7] border-b border-pink-100 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold">Auth Provider</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Joined Date</th>
                  <th className="py-3 px-4 font-semibold">Verification</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((cust) => {
                  const initial = (cust.fullName || cust.email || 'C')[0].toUpperCase();
                  const isVerified = Boolean(cust.emailVerified);

                  return (
                    <tr
                      key={cust.uid}
                      className="hover:bg-pink-50/40 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent/20 to-pink-200 border border-[#F8B8C8] flex items-center justify-center font-bold text-accent text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-secondary-dark">
                              {cust.fullName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              {cust.uid.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="text-secondary-dark font-medium">
                          {cust.email}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {cust.phone || 'Phone not set'}
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                            cust.provider === 'google'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {cust.provider}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                            cust.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-pink-50 text-accent border-pink-200'
                          }`}
                        >
                          {cust.role}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-secondary-light whitespace-nowrap">
                        {formatDate(cust.createdAt)}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                            <span>Unverified</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(cust)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary-dark bg-white border border-[#F8B8C8] rounded-xl hover:bg-pink-50 transition cursor-pointer shadow-2xs"
                        >
                          <FiEye className="w-3.5 h-3.5 text-accent" />
                          <span>Profile &amp; Orders</span>
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

      {/* Customer Detail & Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-pink-100 flex flex-col max-h-[90vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-6 border-b border-pink-100 flex items-center justify-between bg-[#FAF7F7]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-accent to-accent-dark text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {(selectedCustomer.fullName || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-secondary-dark">
                    {selectedCustomer.fullName}
                  </h3>
                  <p className="text-xs text-secondary-light">
                    {selectedCustomer.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-secondary-dark hover:bg-pink-50 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-secondary-dark">
              {/* Account Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                    Role
                  </span>
                  <span className="font-bold text-secondary-dark uppercase mt-0.5 inline-block">
                    {selectedCustomer.role}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                    Provider
                  </span>
                  <span className="font-bold text-secondary-dark capitalize mt-0.5 inline-block">
                    {selectedCustomer.provider}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                    Verified
                  </span>
                  <span className="font-bold text-emerald-700 mt-0.5 inline-block">
                    {selectedCustomer.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                    Phone
                  </span>
                  <span className="font-semibold text-secondary-dark mt-0.5 inline-block">
                    {selectedCustomer.phone || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                    Registered
                  </span>
                  <span className="font-semibold text-secondary-dark mt-0.5 inline-block">
                    {formatDate(selectedCustomer.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                    User UID
                  </span>
                  <span className="font-mono text-[11px] text-gray-600 truncate mt-0.5 block" title={selectedCustomer.uid}>
                    {selectedCustomer.uid.slice(0, 10)}...
                  </span>
                </div>
              </div>

              {/* Order History Sub-section */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-pink-100 mb-3">
                  <div className="flex items-center gap-2">
                    <FiPackage className="w-4 h-4 text-accent" />
                    <h4 className="font-heading font-bold text-sm text-secondary-dark">
                      Order History ({customerOrders.length})
                    </h4>
                  </div>
                </div>

                {loadingOrders ? (
                  <div className="space-y-2 py-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 bg-pink-50/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-gray-50 border border-gray-100">
                    <FiPackage className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-secondary-dark">No orders placed yet</p>
                    <p className="text-[11px] text-gray-400">
                      This patron has not completed any transactions on Visit &amp; Gift.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customerOrders.map((ord) => {
                      const statusClass =
                        statusBadgeClasses[ord.orderStatus] ||
                        'bg-gray-50 text-gray-700 border-gray-200';

                      return (
                        <div
                          key={ord.id}
                          className="p-3.5 rounded-2xl border border-pink-100 hover:border-pink-200 bg-white flex items-center justify-between gap-4 transition shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-secondary-dark">
                                {ord.orderId || ord.id.slice(0, 10)}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusClass}`}
                              >
                                {ord.orderStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {formatOrderDate(ord.createdAt)} &bull; {ord.items?.length || 0} items
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-secondary-dark block">
                              {formatCurrency(ord.totalAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-pink-100 bg-[#FAF7F7] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-xl transition cursor-pointer shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
