// src/pages/Dashboard.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bookingAPI, queueAPI, reviewAPI } from '../Services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await bookingAPI.myBookings(params);
      setBookings(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingAPI.cancel(bookingId, 'Customer cancelled');
      toast.success('Booking cancelled');
      loadBookings();
    } catch (err) {
      // Handled by interceptor
    }
  };

  const handleReview = async () => {
    try {
      await reviewAPI.submit({
        booking_id: reviewModal,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success('Review submitted!');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
      loadBookings();
    } catch (err) {
      // Handled by interceptor
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'confirmed', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name}!</p>
          </div>
          <Link to="/book" className="btn-primary">
            + New Booking
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                filter === f.key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? <Loader /> : (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-6xl mb-4">📋</p>
                <p className="text-xl text-gray-500 mb-4">No bookings found</p>
                <Link to="/book" className="btn-primary">
                  Book Your First Appointment
                </Link>
              </div>
            ) : (
              bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{booking.service_name}</h3>
                        <StatusBadge status={booking.status} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-500">
                        <span>📅 {booking.date}</span>
                        <span>⏰ {booking.time_slot}</span>
                        <span>{booking.type === 'salon' ? '🏪 Salon' : '🏠 Home'}</span>
                        <span>💰 {booking.total_price}</span>
                      </div>
                      {booking.staff_name && (
                        <p className="text-sm text-gray-500 mt-1">✂️ Stylist: {booking.staff_name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Ref: {booking.booking_ref}</p>
                    </div>

                    {/* Right: Queue Info & Actions */}
                    <div className="flex flex-col items-end gap-2">
                      {/* Queue Position */}
                      {booking.queue_position && (
                        <div className="bg-purple-50 rounded-xl px-4 py-2 text-center">
                          <p className="text-xs text-purple-500">Queue</p>
                          <p className="text-2xl font-bold text-purple-600">
                            #{booking.queue_position.queue_number}
                          </p>
                          {booking.queue_position.estimated_wait_mins !== null && (
                            <p className="text-xs text-purple-500">
                              ~{booking.queue_position.estimated_wait_mins} mins wait
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {booking.can_cancel && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                          >
                            Cancel
                          </button>
                        )}

                        {booking.status === 'pending' && (
                          <Link
                            to={`/payment/${booking.id}`}
                            className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium"
                          >
                            Pay Now
                          </Link>
                        )}

                        {booking.status === 'completed' && !booking.has_review && (
                          <button
                            onClick={() => setReviewModal(booking.id)}
                            className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition font-medium"
                          >
                            ⭐ Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Review Modal */}
        {reviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Leave a Review</h3>

              {/* Star Rating */}
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    className={`text-3xl transition ${
                      star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                className="input-field !h-28 resize-none mb-4"
                placeholder="Share your experience..."
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { setReviewModal(null); setReviewForm({ rating: 5, comment: '' }); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleReview} className="btn-primary flex-1">
                  Submit Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
