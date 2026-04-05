// src/pages/QueueDisplay.jsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { queueAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

const QueueDisplay = () => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const res = await queueAPI.todayQueue();
      setQueueData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Live Queue Status</h1>
          <p className="text-purple-300">Today's real-time queue updates</p>
          <div className="flex justify-center gap-6 mt-6">
            <div className="glass-card !bg-white/10 !border-white/10 !p-4 text-center min-w-[120px]">
              <p className="text-3xl font-bold text-green-400">{queueData?.serving_count || 0}</p>
              <p className="text-xs text-gray-300 mt-1">Serving</p>
            </div>
            <div className="glass-card !bg-white/10 !border-white/10 !p-4 text-center min-w-[120px]">
              <p className="text-3xl font-bold text-yellow-400">{queueData?.waiting_count || 0}</p>
              <p className="text-xs text-gray-300 mt-1">Waiting</p>
            </div>
            <div className="glass-card !bg-white/10 !border-white/10 !p-4 text-center min-w-[120px]">
              <p className="text-3xl font-bold text-blue-400">{queueData?.completed_today || 0}</p>
              <p className="text-xs text-gray-300 mt-1">Completed</p>
            </div>
          </div>
        </div>

        {/* Queue Table */}
        <div className="glass-card !bg-white/5 !border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-purple-300 font-semibold text-sm">Q#</th>
                  <th className="text-left py-4 px-6 text-purple-300 font-semibold text-sm">Customer</th>
                  <th className="text-left py-4 px-6 text-purple-300 font-semibold text-sm">Service</th>
                  <th className="text-left py-4 px-6 text-purple-300 font-semibold text-sm">Est. Time</th>
                  <th className="text-left py-4 px-6 text-purple-300 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {queueData?.queue?.length > 0 ? (
                  queueData.queue.map((item, i) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`border-b border-white/5 ${
                        item.status === 'serving' ? 'bg-green-500/10' :
                        item.status === 'grace_period' ? 'bg-orange-500/10' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <span className="text-2xl font-bold text-white">#{item.queue_number}</span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-white font-medium">{item.customer_name}</p>
                        {item.staff_name && (
                          <p className="text-xs text-gray-400">Stylist: {item.staff_name}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-300">{item.service_name}</p>
                        <p className="text-xs text-gray-500">{item.duration} mins</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-white">{item.estimated_start || '—'}</p>
                        {item.grace_expires && (
                          <p className="text-xs text-orange-400">
                            Grace until: {item.grace_expires}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={item.status} />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-gray-500">
                      <p className="text-4xl mb-3">🎉</p>
                      <p className="text-lg">No one in queue right now!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <p className="text-center text-gray-500 text-sm mt-4">
          Auto-refreshes every 10 seconds • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default QueueDisplay;