// src/pages/admin/ManageBookings.jsx

import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    search: '',
    staff_id: '',
    page: 1,
  });

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filters]);

  const loadStaff = async () => {
    try {
      const res = await adminAPI.getStaff();
      setStaff(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = { ...filters, per_page: 15 };
      if (params.status === 'all') delete params.status;
      if (!params.date) delete params.date;
      if (!params.search) delete params.search;
      if (!params.staff_id) delete params.staff_id;

      const res = await adminAPI.getBookings(params);
      setBookings(res.data.data.data || []);
      setPagination({
        current_page: res.data.data.current_page,
        last_page: res.data.data.last_page,
        total: res.data.data.total,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, status) => {
    const confirmMsg = {
      cancelled: 'Cancel this booking?',
      no_show: 'Mark as no-show?',
      completed: 'Mark as completed?',
      confirmed: 'Confirm this booking?',
    };

    if (confirmMsg[status] && !confirm(confirmMsg[status])) return;

    try {
      await adminAPI.updateBookingStatus(bookingId, status);
      toast.success(`Status updated to ${status}`);
      loadBookings();
    } catch (err) {
      // Handled by interceptor
    }
  };

  const handleCashPayment = async (bookingId) => {
    if (!confirm('Accept cash payment and confirm booking?')) return;
    try {
      await adminAPI.cashPayment(bookingId);
      toast.success('Cash payment accepted');
      loadBookings();
    } catch (err) {
      // Handled by interceptor
    }
  };

  const statusOptions = [
    'all', 'pending', 'confirmed', 'checked_in',
    'in_progress', 'completed', 'cancelled', 'no_show'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-500 mt-1">
            {pagination.total || 0} total bookings
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="input-field !py-2 text-sm"
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All Statuses' : s.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={e => setFilters({ ...filters, date: e.target.value, page: 1 })}
                className="input-field !py-2 text-sm"
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="input-field !py-2 text-sm"
                placeholder="Search by ref, name, phone..."
              />
            </div>

            {/* Staff Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Staff</label>
              <select
                value={filters.staff_id}
                onChange={e => setFilters({ ...filters, staff_id: e.target.value, page: 1 })}
                className="input-field !py-2 text-sm"
              >
                <option value="">All Staff</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: 'all', date: '', search: '', staff_id: '', page: 1 })}
                className="text-sm text-purple-600 hover:underline px-3 py-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? <Loader /> : (
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Ref</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Service</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Staff</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date / Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Payment</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{b.booking_ref}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{b.user?.name}</p>
                        <p className="text-xs text-gray-400">{b.user?.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{b.service?.name}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">{b.staff?.name || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900">{b.date}</p>
                        <p className="text-xs text-gray-400">{b.time_slot}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs">{b.type === 'salon' ? '🏪' : '🏠'} {b.type}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold">₹{b.total_price}</td>
                      <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                      <td className="py-3 px-4">
                        {b.payment ? (
                          <StatusBadge status={b.payment.status} />
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {b.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(b.id, 'confirmed')}
                                className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleCashPayment(b.id)}
                                className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100"
                              >
                                Cash Pay
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => updateStatus(b.id, 'checked_in')}
                              className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs hover:bg-indigo-100"
                            >
                              Check In
                            </button>
                          )}
                          {(b.status === 'checked_in' || b.status === 'in_progress') && (
                            <button
                              onClick={() => updateStatus(b.id, 'completed')}
                              className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100"
                            >
                              Complete
                            </button>
                          )}
                          {['pending', 'confirmed'].includes(b.status) && (
                            <button
                              onClick={() => updateStatus(b.id, 'cancelled')}
                              className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"
                            >
                              Cancel
                            </button>
                          )}
                          {b.status === 'no_show' && (
                            <button
                              onClick={async () => {
                                try {
                                  await adminAPI.lateArrival(b.id);
                                  toast.success('Rescheduled!');
                                  loadBookings();
                                } catch (e) {}
                              }}
                              className="px-2 py-1 bg-orange-50 text-orange-600 rounded text-xs hover:bg-orange-100"
                            >
                              Reschedule
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setFilters({ ...filters, page })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      pagination.current_page === page
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;