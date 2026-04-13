// src/pages/staff/StaffDashboard.jsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { staffPortalAPI } from '../../Services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, bookingsRes] = await Promise.all([
        staffPortalAPI.dashboard(),
        staffPortalAPI.todayBookings(),
      ]);
      setData(dashRes.data.data);
      setBookings(bookingsRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectCash = async (bookingId) => {
    if (!confirm('Confirm cash payment collected?')) return;
    try {
      const res = await staffPortalAPI.collectCash(bookingId);
      toast.success(res.data.message);
      loadDashboard();
    } catch (err) { console.error(err); }
  };

  const handleStartService = async (bookingId) => {
    try {
      await staffPortalAPI.startService(bookingId);
      toast.success('Service started! 💇');
      loadDashboard();
    } catch (err) { console.error(err); }
  };

  const handleCompleteService = async (bookingId) => {
    if (!confirm('Mark this service as completed?')) return;
    try {
      await staffPortalAPI.completeService(bookingId);
      toast.success('Service completed! 🎉');
      loadDashboard();
    } catch (err) { console.error(err); }
  };

  if (loading) return <Loader text="Loading dashboard..." />;
  if (!data) return <div className="text-center py-20 text-gray-500">Unable to load dashboard</div>;

  const { staff, today, revenue, performance, top_services, recent_reviews } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
              {staff.name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {staff.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-purple-100">
                {staff.specialization || 'Stylist'} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'overview', label: '📊 Overview', },
            { key: 'bookings', label: '📋 Today\'s Bookings' },
            { key: 'revenue', label: '💰 Revenue' },
            { key: 'performance', label: '🏆 Performance' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-purple-700 shadow-lg'
                  : 'bg-white/60 text-gray-600 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Today\'s Bookings', value: today.total, icon: '📋', color: 'purple' },
                { label: 'Today\'s Revenue', value: `₹${revenue.today.toLocaleString()}`, icon: '💰', color: 'green' },
                { label: 'This Month', value: `₹${revenue.month.toLocaleString()}`, icon: '📈', color: 'blue' },
                { label: 'Avg Rating', value: `${performance.avg_rating} ⭐`, icon: '🏆', color: 'yellow' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Today's Schedule Quick View */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Today's Schedule</h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-purple-600 text-sm font-medium hover:text-purple-700"
                >
                  View All →
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {[
                  { label: 'Pending', count: today.pending, color: 'bg-gray-100 text-gray-700' },
                  { label: 'Confirmed', count: today.confirmed, color: 'bg-blue-100 text-blue-700' },
                  { label: 'In Progress', count: today.in_progress, color: 'bg-yellow-100 text-yellow-700' },
                  { label: 'Completed', count: today.completed, color: 'bg-green-100 text-green-700' },
                ].map((item, i) => (
                  <div key={i} className={`px-4 py-2 rounded-xl text-sm font-medium ${item.color} whitespace-nowrap`}>
                    {item.label}: {item.count}
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Growth */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Comparison */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Revenue Overview</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Today', value: revenue.today },
                    { label: 'This Week', value: revenue.week },
                    { label: 'This Month', value: revenue.month },
                    { label: 'Last Month', value: revenue.last_month },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">{item.label}</span>
                      <span className="font-bold text-gray-900">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Month Growth</span>
                    <span className={`font-bold ${revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {revenue.growth >= 0 ? '📈' : '📉'} {revenue.growth}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Services */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Top Services This Month</h3>
                {top_services && top_services.length > 0 ? (
                  <div className="space-y-3">
                    {top_services.map((service, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-700' :
                            'bg-orange-50 text-orange-600'
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{service.service_name}</p>
                            <p className="text-xs text-gray-500">{service.count} bookings</p>
                          </div>
                        </div>
                        <span className="font-bold text-purple-600 text-sm">₹{service.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No completed services this month yet</p>
                )}
              </div>
            </div>

            {/* Recent Reviews */}
            {recent_reviews && recent_reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {recent_reviews.map((review, i) => (
                    <div key={i} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                        {review.customer_name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{review.customer_name}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, s) => (
                              <span key={s} className={`text-xs ${s < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{review.comment || 'No comment'}</p>
                        <p className="text-xs text-gray-400 mt-1">{review.service_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── BOOKINGS TAB ─── */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Today's Appointments</h2>

            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-5xl mb-3">🎉</p>
                <p className="text-xl text-gray-500">No bookings today!</p>
              </div>
            ) : (
              bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{booking.service?.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.status?.replace('_', ' ')}
                        </span>
                        {booking.type === 'home' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            🏠 Home Visit
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        👤 {booking.user?.name} • 📞 {booking.user?.phone || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600 text-lg">₹{booking.total_price}</p>
                      <p className="text-sm text-gray-500">
                        🕐 {new Date(`2000-01-01T${booking.time_slot}`).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Home Address */}
                  {booking.type === 'home' && booking.address && (
                    <div className="bg-purple-50 rounded-xl p-3 mb-3 text-sm">
                      <p className="text-purple-800 font-medium">📍 Address:</p>
                      <p className="text-purple-600">{booking.address}</p>
                    </div>
                  )}

                  {/* Payment Status */}
                  <div className={`rounded-xl p-3 mb-3 text-sm flex items-center gap-2 ${
                    booking.payment?.status === 'captured'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {booking.payment?.status === 'captured' ? (
                      <>✅ <strong>{booking.payment?.method === 'cash' ? 'Cash Received' : 'Paid Online'}</strong></>
                    ) : (
                      <>💰 <strong>Cash Payment Pending</strong></>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {booking.status === 'confirmed' && (
                      <button onClick={() => handleStartService(booking.id)}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1">
                        ▶️ Start Service
                      </button>
                    )}
                    {booking.status === 'in_progress' && (
                      <button onClick={() => handleCompleteService(booking.id)}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition flex items-center gap-1">
                        ✅ Complete
                      </button>
                    )}
                    {(!booking.payment || booking.payment?.status !== 'captured') && (
                      <button onClick={() => handleCollectCash(booking.id)}
                        className="px-4 py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-medium hover:bg-yellow-600 transition flex items-center gap-1">
                        💰 Collect Cash
                      </button>
                    )}
                    {booking.user?.phone && (
                      <a href={`tel:${booking.user.phone}`}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition flex items-center gap-1">
                        📞 Call
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ─── REVENUE TAB ─── */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Revenue Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Today', value: revenue.today, icon: '📅' },
                { label: 'This Week', value: revenue.week, icon: '📆' },
                { label: 'This Month', value: revenue.month, icon: '📊' },
                { label: 'Last Month', value: revenue.last_month, icon: '📋' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-2xl font-bold text-gray-900 mt-2">₹{item.value.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{item.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Growth Indicator */}
            <div className={`rounded-2xl p-6 flex items-center gap-4 ${
              revenue.growth >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <span className="text-4xl">{revenue.growth >= 0 ? '📈' : '📉'}</span>
              <div>
                <p className={`text-2xl font-bold ${revenue.growth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {revenue.growth >= 0 ? '+' : ''}{revenue.growth}%
                </p>
                <p className={`text-sm ${revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenue.growth >= 0 ? 'Growth' : 'Decline'} compared to last month
                </p>
              </div>
            </div>

            {/* Daily Revenue Chart (Simple Bar Chart) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Last 7 Days Revenue</h3>
              <div className="flex items-end justify-between gap-2 h-48">
                {revenue.daily_chart.map((day, i) => {
                  const maxRevenue = Math.max(...revenue.daily_chart.map(d => d.revenue), 1);
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">
                        ₹{day.revenue > 0 ? day.revenue.toLocaleString() : '0'}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={`w-full rounded-t-lg ${
                          day.revenue > 0
                            ? 'bg-gradient-to-t from-purple-600 to-pink-500'
                            : 'bg-gray-200'
                        }`}
                      />
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-700">{day.day}</p>
                        <p className="text-[10px] text-gray-400">{day.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Monthly Revenue (Last 6 Months)</h3>
              <div className="flex items-end justify-between gap-3 h-48">
                {revenue.monthly_chart.map((month, i) => {
                  const maxRevenue = Math.max(...revenue.monthly_chart.map(m => m.revenue), 1);
                  const height = (month.revenue / maxRevenue) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">
                        ₹{month.revenue > 0 ? (month.revenue / 1000).toFixed(1) + 'K' : '0'}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ delay: i * 0.15, duration: 0.5 }}
                        className={`w-full rounded-t-xl ${
                          month.revenue > 0
                            ? 'bg-gradient-to-t from-blue-600 to-purple-500'
                            : 'bg-gray-200'
                        }`}
                      />
                      <p className="text-sm font-bold text-gray-700">{month.month}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── PERFORMANCE TAB ─── */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Score */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Performance Score</h3>
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" 
                    stroke={performance.completion_rate >= 80 ? '#10b981' : performance.completion_rate >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${performance.completion_rate * 3.14} ${314 - performance.completion_rate * 3.14}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{performance.completion_rate}%</p>
                    <p className="text-xs text-gray-500">Completion</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-500">
                {performance.completion_rate >= 80 ? '🌟 Excellent work! Keep it up!' :
                 performance.completion_rate >= 50 ? '👍 Good job! Room for improvement.' :
                 '💪 Let\'s work on improving!'}
              </p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Bookings', value: performance.total_bookings, icon: '📋', color: 'bg-purple-50 text-purple-700' },
                { label: 'Completed', value: performance.completed, icon: '✅', color: 'bg-green-50 text-green-700' },
                { label: 'Cancelled', value: performance.cancelled, icon: '❌', color: 'bg-red-50 text-red-700' },
                { label: 'No Shows', value: performance.no_show, icon: '👻', color: 'bg-gray-50 text-gray-700' },
              ].map((metric, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-2xl p-5 ${metric.color}`}>
                  <span className="text-2xl">{metric.icon}</span>
                  <p className="text-2xl font-bold mt-2">{metric.value}</p>
                  <p className="text-sm opacity-70">{metric.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Rating */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Customer Rating</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900">{performance.avg_rating}</p>
                  <div className="flex items-center gap-1 mt-2 justify-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`text-xl ${star <= Math.round(performance.avg_rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{performance.total_reviews} reviews</p>
                </div>

                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-3">{rating}</span>
                      <span className="text-yellow-400 text-sm">★</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${rating === Math.round(performance.avg_rating) ? '60%' : '20%'}` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            {recent_reviews && recent_reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {recent_reviews.map((review, i) => (
                    <div key={i} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                        {review.customer_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{review.customer_name}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, s) => (
                              <span key={s} className={`text-xs ${s < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{review.comment || 'No comment'}</p>
                        <p className="text-xs text-gray-400 mt-1">For: {review.service_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
