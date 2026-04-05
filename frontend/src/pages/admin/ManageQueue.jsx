// src/pages/admin/ManageQueue.jsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ManageQueue = () => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const res = await adminAPI.getQueue();
      setQueueData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, bookingId = null, label = '') => {
    setActionLoading(action + (bookingId || ''));
    try {
      let res;
      switch (action) {
        case 'callNext':
          res = await adminAPI.callNext();
          toast.success(res.data.message);
          break;
        case 'checkIn':
          res = await adminAPI.checkIn(bookingId);
          toast.success('Customer checked in!');
          break;
        case 'complete':
          res = await adminAPI.completeService(bookingId);
          toast.success('Service completed! Next person called.');
          break;
        case 'noShow':
          if (!confirm(`Mark as no-show? This will promote the next person.`)) {
            setActionLoading('');
            return;
          }
          res = await adminAPI.markNoShow(bookingId);
          toast.success('Marked as no-show. Queue updated.');
          break;
        case 'lateArrival':
          res = await adminAPI.lateArrival(bookingId);
          toast.success(res.data.message);
          break;
        default:
          break;
      }
      await loadQueue();
    } catch (err) {
      // Handled by interceptor
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <Loader text="Loading queue..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
            <p className="text-gray-500 mt-1">Today's live queue control panel</p>
          </div>
          <button
            onClick={() => handleAction('callNext')}
            disabled={actionLoading === 'callNext'}
            className="btn-primary !px-8 disabled:opacity-50"
          >
            {actionLoading === 'callNext' ? 'Calling...' : '📢 Call Next'}
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Serving', value: queueData?.serving_count || 0, icon: '🟢', bg: 'bg-green-50 border-green-200' },
            { label: 'Waiting', value: queueData?.waiting_count || 0, icon: '🟡', bg: 'bg-yellow-50 border-yellow-200' },
            { label: 'Active', value: queueData?.total_active || 0, icon: '🔵', bg: 'bg-blue-50 border-blue-200' },
            { label: 'Completed', value: queueData?.completed_today || 0, icon: '✅', bg: 'bg-gray-50 border-gray-200' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} border rounded-xl p-4 text-center`}>
              <span className="text-xl">{stat.icon}</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Queue List */}
        <div className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900">Today's Queue</h3>
          </div>

          {queueData?.queue?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {queueData.queue.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-5 transition-colors ${
                    item.status === 'serving' ? 'bg-green-50' :
                    item.status === 'grace_period' ? 'bg-orange-50' :
                    'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Side: Queue Info */}
                    <div className="flex items-center gap-4">
                      {/* Queue Number */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                        item.status === 'serving' ? 'bg-green-500 text-white' :
                        item.status === 'grace_period' ? 'bg-orange-500 text-white' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        #{item.queue_number}
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{item.customer_name}</h4>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {item.service_name} • {item.duration} mins
                          {item.staff_name && ` • ✂️ ${item.staff_name}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Ref: {item.booking_ref}
                          {item.booking_type === 'home' && ' • 🏠 Home visit'}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Time Info */}
                    <div className="text-sm text-gray-600">
                      {item.estimated_start && (
                        <p>⏰ Est. Start: <span className="font-medium">{item.estimated_start}</span></p>
                      )}
                      {item.estimated_end && (
                        <p>🏁 Est. End: <span className="font-medium">{item.estimated_end}</span></p>
                      )}
                      {item.grace_expires && (
                        <p className="text-orange-600 font-medium">
                          ⏳ Grace until: {item.grace_expires}
                        </p>
                      )}
                    </div>

                    {/* Right Side: Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Waiting → Check In */}
                      {(item.status === 'waiting' || item.status === 'grace_period') && (
                        <button
                          onClick={() => handleAction('checkIn', item.booking_ref.replace('BK-', ''))}
                          disabled={actionLoading === `checkIn${item.booking_ref}`}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
                        >
                          ✅ Check In
                        </button>
                      )}

                      {/* Serving → Complete */}
                      {item.status === 'serving' && (
                        <button
                          onClick={() => handleAction('complete', item.booking_ref.replace('BK-', ''))}
                          disabled={actionLoading === `complete${item.booking_ref}`}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
                        >
                          🏁 Complete
                        </button>
                      )}

                      {/* Mark No Show */}
                      {(item.status === 'waiting' || item.status === 'grace_period') && (
                        <button
                          onClick={() => handleAction('noShow', item.booking_ref.replace('BK-', ''))}
                          disabled={actionLoading === `noShow${item.booking_ref}`}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition disabled:opacity-50"
                        >
                          ❌ No Show
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🎉</p>
              <p className="text-xl text-gray-500">Queue is empty!</p>
              <p className="text-gray-400 mt-2">No one is waiting right now</p>
            </div>
          )}
        </div>

        {/* Auto-refresh notice */}
        <p className="text-center text-gray-400 text-sm mt-6">
          🔄 Auto-refreshes every 5 seconds
        </p>
      </div>
    </div>
  );
};

export default ManageQueue;