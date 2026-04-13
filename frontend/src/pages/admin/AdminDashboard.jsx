// src/pages/admin/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Loader from '../../components/common/Loader';
import StatusBadge from '../../components/common/StatusBadge';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.dashboard();
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Loading dashboard..." />;
  if (!data) return null;

  const statCards = [
    { label: "Today's Bookings", value: data.today.bookings, icon: '📅', color: 'from-blue-500 to-blue-600' },
    { label: "Today's Revenue", value: `₹${data.today.revenue.toLocaleString()}`, icon: '💰', color: 'from-green-500 to-green-600' },
    { label: 'Total Users', value: data.overall.users, icon: '👥', color: 'from-purple-500 to-purple-600' },
    { label: 'Total Revenue', value: `₹${data.overall.revenue.toLocaleString()}`, icon: '📊', color: 'from-pink-500 to-pink-600' },
  ];

  const adminLinks = [
    { to: '/admin/bookings', label: 'Manage Bookings', icon: '📋', desc: 'View & manage all bookings' },
    { to: '/admin/queue', label: 'Queue Control', icon: '📢', desc: 'Manage live queue' },
    { to: '/admin/services', label: 'Services', icon: '💇', desc: 'Add, edit services' },
    { to: '/admin/slots', label: 'Slot Management', icon: '⏰', desc: 'Working hours & slots' },
    { to: '/admin/staff', label: 'Staff', icon: '👨‍💼', desc: 'Manage staff members' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️', desc: 'Site configuration' },
    { to: '/admin/coupons', label: 'Coupons', icon: '🎟️', desc: 'Manage coupons' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your salon</p>
        </div>

        {/* Stat Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-r ${stat.color} rounded-2xl p-6 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <span className="text-4xl opacity-80">{stat.icon}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 card">
            <h3 className="font-bold text-gray-900 mb-4">Weekly Revenue</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.weekly_revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Today's Stats */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Today's Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Completed', value: data.today.completed, color: 'text-green-600' },
                { label: 'No Shows', value: data.today.no_shows, color: 'text-red-600' },
                { label: 'Active Services', value: data.overall.services, color: 'text-blue-600' },
                { label: 'Total Bookings', value: data.overall.bookings, color: 'text-purple-600' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 text-sm">{item.label}</span>
                  <span className={`font-bold text-lg ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminLinks.map((link, i) => (
              <Link
                key={i}
                to={link.to}
                className="card hover:border-purple-200 group !p-5"
              >
                <span className="text-3xl">{link.icon}</span>
                <h4 className="font-semibold text-gray-900 mt-2 group-hover:text-purple-600 transition">
                  {link.label}
                </h4>
                <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-purple-600 text-sm font-medium hover:underline">
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Ref</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Service</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_bookings.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{b.booking_ref}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{b.customer}</td>
                    <td className="py-3 px-4 text-gray-600">{b.service}</td>
                    <td className="py-3 px-4 text-gray-600">{b.date}</td>
                    <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                    <td className="py-3 px-4 font-semibold">{b.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Statistics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Staff Performance</h3>
            <Link to="/admin/staff" className="text-purple-600 text-sm font-medium hover:underline">
              Manage Staff →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.staff_stats?.map(staff => (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:border-purple-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{staff.name}</h4>
                      <p className="text-xs text-gray-500">{staff.specialization || 'General'}</p>
                    </div>
                  </div>
                </div>

                {staff.experience && (
                  <p className="text-xs text-gray-600 mb-2">📚 Experience: {staff.experience}</p>
                )}

                <div className="space-y-1 mb-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bookings:</span>
                    <span className="font-semibold text-gray-900">{staff.total_bookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-semibold text-green-600">{staff.completed_bookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Today:</span>
                    <span className="font-semibold text-blue-600">{staff.today_bookings}</span>
                  </div>
                </div>

                {staff.services && (
                  <div className="mb-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Services:</p>
                    <div className="flex flex-wrap gap-1">
                      {staff.services.split(', ').map(s => (
                        <span key={s} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {staff.current_service && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-900">Currently Working:</p>
                    <p className="text-xs text-blue-700 mt-1">📋 {staff.current_service.service}</p>
                    <p className="text-xs text-blue-600">👤 {staff.current_service.customer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Staff Analysis */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-4">Staff Analysis</h3>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Performing Staff */}
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-4">Top Performers (This Month)</h4>
              <div className="space-y-3">
                {data.top_staff?.map((staff, i) => (
                  <motion.div
                    key={staff.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{staff.name}</p>
                        <p className="text-xs text-gray-500">{staff.completed_bookings} completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{staff.month_revenue.toLocaleString()}</p>
                      <p className={`text-xs font-medium ${staff.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {staff.revenue_growth >= 0 ? '📈' : '📉'} {staff.revenue_growth}%
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Staff Performance Metrics */}
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
              <div className="space-y-3">
                {data.staff_stats?.slice(0, 5).map(staff => (
                  <motion.div
                    key={staff.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{staff.name}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          ⭐ {staff.avg_rating}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>📋 {staff.total_bookings} bookings</span>
                        <span>✅ {staff.completed_bookings} completed</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="card lg:col-span-2">
              <h4 className="font-semibold text-gray-900 mb-4">Revenue Breakdown by Staff (This Month)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Staff Name</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">This Month</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Last Month</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Growth</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Bookings</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staff_stats?.map(staff => (
                      <tr key={staff.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium text-gray-900">{staff.name}</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold">₹{staff.month_revenue.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">₹{staff.last_month_revenue.toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <span className={`font-medium ${staff.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {staff.revenue_growth >= 0 ? '📈' : '📉'} {staff.revenue_growth}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{staff.completed_bookings}/{staff.total_bookings}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                            ⭐ {staff.avg_rating || '0'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;