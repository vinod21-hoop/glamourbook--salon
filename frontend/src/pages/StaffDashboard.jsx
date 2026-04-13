// src/pages/StaffDashboard.jsx

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staffPortalAPI } from '../Services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [todayBookingsData, setTodayBookingsData] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Tab from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Load dashboard data
  useEffect(() => {
    loadDashboard();
  }, []);

  // Load schedule when date changes
  useEffect(() => {
    if (activeTab === 'schedule') {
      loadSchedule(selectedDate);
    }
  }, [selectedDate, activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashRes, bookingsRes] = await Promise.all([
        staffPortalAPI.dashboard(),
        staffPortalAPI.todayBookings(),
      ]);

      setDashboardData(dashRes.data.data);
      setTodayBookingsData(bookingsRes.data.data || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async (date) => {
    try {
      const res = await staffPortalAPI.mySchedule(date);
      setScheduleData(res.data.data?.bookings || []);
    } catch (err) {
      console.error('Schedule load error:', err);
    }
  };

  // ── Staff Actions ──────────────────────────────

  const handleCollectCash = async (bookingId) => {
    if (!confirm('Confirm cash payment collected from customer?')) return;
    try {
      const res = await staffPortalAPI.collectCash(bookingId);
      toast.success(res.data.message || 'Cash collected successfully! 💰');
      loadDashboard();
    } catch (err) {
      toast.error('Failed to collect cash');
    }
  };

  const handleStartService = async (bookingId) => {
    try {
      await staffPortalAPI.startService(bookingId);
      toast.success('Service started! 💇');
      loadDashboard();
    } catch (err) {
      toast.error('Failed to start service');
    }
  };

  const handleCompleteService = async (bookingId) => {
    if (!confirm('Mark this service as completed?')) return;
    try {
      await staffPortalAPI.completeService(bookingId);
      toast.success('Service completed! 🎉');
      loadDashboard();
    } catch (err) {
      toast.error('Failed to complete service');
    }
  };

  // ── Loading & Error States ─────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button onClick={loadDashboard} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const staff = dashboardData?.staff || {};
  const today = dashboardData?.today || {};
  const revenue = dashboardData?.revenue || {};
  const performance = dashboardData?.performance || {};
  const topServices = dashboardData?.top_services || [];
  const recentReviews = dashboardData?.recent_reviews || [];

  // ── Tab Content ────────────────────────────────

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'bookings', label: '📅 Today\'s Bookings', icon: '📅' },
    { id: 'schedule', label: '🗓️ Schedule', icon: '🗓️' },
    { id: 'revenue', label: '💰 Revenue', icon: '💰' },
    { id: 'performance', label: '🏆 Performance', icon: '🏆' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {staff.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {staff.name?.split(' ')[0]}! 👋</h1>
              <p className="text-purple-100">{staff.specialization} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Today's Bookings", value: today.total || 0, icon: '📋', color: 'purple' },
                { label: "Today's Revenue", value: `₹${revenue.today || 0}`, icon: '💰', color: 'green' },
                { label: 'This Month', value: `₹${revenue.month || 0}`, icon: '📈', color: 'blue' },
                { label: 'Avg Rating', value: `${performance.avg_rating || 0} ⭐`, icon: '🏆', color: 'yellow' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
                >
                  <span className="text-2xl">{stat.icon}</span>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Today's Schedule Status */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Today's Schedule</h2>
                <button onClick={() => setActiveTab('bookings')} className="text-purple-600 text-sm font-medium hover:underline">
                  View All →
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Pending', value: today.pending || 0, color: 'bg-gray-100 text-gray-700' },
                  { label: 'Confirmed', value: today.confirmed || 0, color: 'bg-blue-100 text-blue-700' },
                  { label: 'In Progress', value: today.in_progress || 0, color: 'bg-yellow-100 text-yellow-700' },
                  { label: 'Completed', value: today.completed || 0, color: 'bg-green-100 text-green-700' },
                ].map((status, i) => (
                  <span key={i} className={`px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
                    {status.label}: {status.value}
                  </span>
                ))}
              </div>
            </div>

            {/* Revenue & Top Services */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">

              {/* Revenue Overview */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Overview</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Today', value: revenue.today || 0 },
                    { label: 'This Week', value: revenue.week || 0 },
                    { label: 'This Month', value: revenue.month || 0 },
                    { label: 'Last Month', value: revenue.last_month || 0 },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-bold text-gray-900">₹{item.value}</span>
                    </div>
                  ))}
                  {revenue.growth !== 0 && (
                    <div className={`text-sm font-medium ${revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {revenue.growth > 0 ? '📈' : '📉'} {revenue.growth}% vs last month
                    </div>
                  )}
                </div>
              </div>

              {/* Top Services */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Services This Month</h2>
                {topServices.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No services this month</p>
                ) : (
                  <div className="space-y-3">
                    {topServices.map((service, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>{i + 1}</span>
                          <div>
                            <p className="font-medium text-gray-900">{service.service_name}</p>
                            <p className="text-xs text-gray-500">{service.count} bookings</p>
                          </div>
                        </div>
                        <span className="font-bold text-green-600">₹{service.revenue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Reviews */}
            {recentReviews.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Reviews</h2>
                <div className="space-y-4">
                  {recentReviews.map((review, i) => (
                    <div key={i} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{review.customer_name}</span>
                          <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{review.comment || 'No comment'}</p>
                        <p className="text-xs text-gray-400 mt-1">{review.service_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TODAY'S BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Bookings</h2>

            {todayBookingsData.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <p className="text-5xl mb-3">🎉</p>
                <p className="text-xl text-gray-500">No bookings today! Enjoy your day off.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayBookingsData.map((booking, i) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    index={i}
                    onCollectCash={handleCollectCash}
                    onStartService={handleStartService}
                    onCompleteService={handleCompleteService}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SCHEDULE TAB ── */}
        {activeTab === 'schedule' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Schedule</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {scheduleData.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <p className="text-5xl mb-3">📅</p>
                <p className="text-xl text-gray-500">No bookings for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleData.map((booking, i) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    index={i}
                    onCollectCash={handleCollectCash}
                    onStartService={handleStartService}
                    onCompleteService={handleCompleteService}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── REVENUE TAB ── */}
        {activeTab === 'revenue' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Details</h2>

            {/* Revenue Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Today', value: revenue.today || 0, icon: '📅' },
                { label: 'This Week', value: revenue.week || 0, icon: '📆' },
                { label: 'This Month', value: revenue.month || 0, icon: '📊' },
                { label: 'Last Month', value: revenue.last_month || 0, icon: '📉' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-2xl font-bold text-gray-900 mt-2">₹{item.value}</p>
                  <p className="text-sm text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Monthly Chart */}
            {revenue.monthly_chart && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
                <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue (Last 6 Months)</h3>
                <div className="flex items-end justify-between gap-2 h-48">
                  {revenue.monthly_chart.map((item, i) => {
                    const maxRevenue = Math.max(...revenue.monthly_chart.map(m => m.revenue), 1);
                    const height = (item.revenue / maxRevenue) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-gray-600">₹{item.revenue}</span>
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <span className="text-xs text-gray-500">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily Chart */}
            {revenue.daily_chart && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Daily Revenue (Last 7 Days)</h3>
                <div className="flex items-end justify-between gap-2 h-40">
                  {revenue.daily_chart.map((item, i) => {
                    const maxRevenue = Math.max(...revenue.daily_chart.map(d => d.revenue), 1);
                    const height = (item.revenue / maxRevenue) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-gray-600">₹{item.revenue}</span>
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <span className="text-xs text-gray-500">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── PERFORMANCE TAB ── */}
        {activeTab === 'performance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Performance This Month</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Bookings', value: performance.total_bookings || 0, icon: '📋' },
                { label: 'Completed', value: performance.completed || 0, icon: '✅' },
                { label: 'Cancelled', value: performance.cancelled || 0, icon: '❌' },
                { label: 'No Shows', value: performance.no_show || 0, icon: '👻' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{item.value}</p>
                  <p className="text-sm text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Completion Rate */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Completion Rate</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${performance.completion_rate || 0}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900">{performance.completion_rate || 0}%</span>
              </div>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Customer Rating</h3>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold text-gray-900">{performance.avg_rating || 0}</span>
                <div>
                  <div className="text-2xl text-yellow-500">
                    {'⭐'.repeat(Math.round(performance.avg_rating || 0))}
                    {'☆'.repeat(5 - Math.round(performance.avg_rating || 0))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Based on {performance.total_reviews || 0} reviews</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ── Booking Card Component ───────────────────────

const BookingCard = ({ booking, index, onCollectCash, onStartService, onCompleteService }) => {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    checked_in: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{booking.service?.name}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
              {booking.status?.replace('_', ' ')}
            </span>
            {booking.type === 'home' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                🏠 Home Visit
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            👤 {booking.user?.name} • 📞 {booking.user?.phone || 'N/A'}
          </p>
          <p className="text-sm text-gray-400">
            🎫 {booking.booking_ref}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-purple-600 text-lg">₹{booking.total_price}</p>
          <p className="text-sm text-gray-500">
            🕐 {booking.time_slot ? new Date(`2000-01-01T${booking.time_slot}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Home Address */}
      {booking.type === 'home' && booking.address && (
        <div className="bg-purple-50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-purple-800 font-medium">📍 Address:</p>
          <p className="text-purple-600">{booking.address}</p>
        </div>
      )}

      {/* Payment Status */}
      <div className={`rounded-lg p-3 mb-4 text-sm flex items-center gap-2 ${
        booking.payment?.status === 'captured'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      }`}>
        {booking.payment?.status === 'captured' ? (
          <>✅ Payment: <strong>{booking.payment?.method === 'cash' ? 'Cash Received' : 'Online Paid'}</strong></>
        ) : (
          <>💰 Payment: <strong>Pending {booking.payment?.method === 'cash' ? '(Cash)' : ''}</strong></>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {(booking.status === 'confirmed' || booking.status === 'checked_in') && (
          <button
            onClick={() => onStartService(booking.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1"
          >
            ▶️ Start Service
          </button>
        )}

        {booking.status === 'in_progress' && (
          <button
            onClick={() => onCompleteService(booking.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1"
          >
            ✅ Complete Service
          </button>
        )}

        {booking.payment?.status !== 'captured' && (
          <button
            onClick={() => onCollectCash(booking.id)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition flex items-center gap-1"
          >
            💰 Collect Cash
          </button>
        )}

        {booking.user?.phone && (
          <a
            href={`tel:${booking.user.phone}`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-1"
          >
            📞 Call
          </a>
        )}

        {booking.type === 'home' && booking.address && (
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(booking.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-1"
          >
            🗺️ Navigate
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default StaffDashboard;
