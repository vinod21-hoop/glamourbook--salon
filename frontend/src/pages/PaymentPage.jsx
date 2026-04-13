// src/pages/PaymentPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import StatusBadge from '../components/common/StatusBadge';
import { motion } from 'framer-motion';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashConfirming, setCashConfirming] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const res = await bookingAPI.getBooking(bookingId);
      setBooking(res.data.data);
    } catch (err) {
      toast.error('Booking not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ── Online Payment (Razorpay) ──────────────────

  const handleOnlinePayment = async () => {
    setPaying(true);

    try {
      const orderRes = await paymentAPI.createOrder(bookingId);
      const orderData = orderRes.data.data;

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'GlamourBook Salon',
        description: `Booking: ${orderData.booking_ref}`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || '',
        },
        theme: {
          color: '#7C3AED',
        },
        handler: async (response) => {
          try {
            await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success('Payment successful! Booking confirmed. ✅');
            navigate('/dashboard');
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.error('Payment cancelled');
          },
        },
      };

      if (typeof window.Razorpay === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.error('Could not initialize payment');
    } finally {
      setPaying(false);
    }
  };

  // ── Cash Payment ───────────────────────────────

  const handleCashPayment = async () => {
    setCashConfirming(true);

    try {
      const res = await paymentAPI.chooseCash(bookingId);
      toast.success(res.data.message || 'Booking confirmed! Pay at salon. 💰');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to confirm cash payment');
    } finally {
      setCashConfirming(false);
    }
  };

  if (loading) return <Loader text="Loading booking..." />;
  if (!booking) return null;

  // Already paid or confirmed
  const isAlreadyPaid = booking.status !== 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="card !p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">💳</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-500 mt-1">Booking: {booking.booking_ref}</p>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Service</span>
                <span className="font-medium">{booking.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Time</span>
                <span className="font-medium">{booking.date} at {booking.time_slot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">
                  {booking.type === 'salon' ? '🏪 Salon Visit' : '🏠 Home Visit'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stylist</span>
                <span className="font-medium">{booking.staff?.name || 'Any Available'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={booking.status} />
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Price</span>
                <span>₹{booking.base_price}</span>
              </div>
              {parseFloat(booking.home_charge) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Home Service Charge</span>
                  <span>₹{booking.home_charge}</span>
                </div>
              )}
              {parseFloat(booking.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{booking.discount}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t text-xl font-bold">
                <span>Total</span>
                <span className="text-purple-600">₹{booking.total_price}</span>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          {!isAlreadyPaid && (
            <>
              {/* Step 1: Choose Payment Method */}
              {!paymentMethod && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 text-center">Choose Payment Method</h3>
                  <div className="space-y-3">

                    {/* Online Payment */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('online')}
                      className="w-full p-5 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">💳</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Pay Online</p>
                        <p className="text-sm text-gray-500">UPI, Credit/Debit Card, Net Banking</p>
                        <p className="text-xs text-green-600 mt-1">✅ Instant confirmation</p>
                      </div>
                      <div className="text-purple-600 font-bold text-lg">₹{booking.total_price}</div>
                    </motion.button>

                    {/* Cash Payment */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('cash')}
                      className="w-full p-5 rounded-xl border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">💰</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Pay at {booking.type === 'home' ? 'Service' : 'Salon'}</p>
                        <p className="text-sm text-gray-500">
                          {booking.type === 'home'
                            ? 'Pay cash to the stylist at your home'
                            : 'Pay cash when you arrive at the salon'}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">💰 Cash payment</p>
                      </div>
                      <div className="text-yellow-600 font-bold text-lg">₹{booking.total_price}</div>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Step 2A: Online Payment Confirmation */}
              {paymentMethod === 'online' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💳</span>
                      <div>
                        <p className="font-semibold text-purple-800">Pay Online</p>
                        <p className="text-sm text-purple-600">Secure payment via Razorpay</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOnlinePayment}
                    disabled={paying}
                    className="btn-primary w-full !py-4 text-lg disabled:opacity-50 mb-3"
                  >
                    {paying ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Opening Payment...
                      </span>
                    ) : (
                      `Pay ₹${booking.total_price} Now`
                    )}
                  </button>

                  <button
                    onClick={() => setPaymentMethod(null)}
                    className="w-full text-center text-sm text-gray-500 hover:text-purple-600 font-medium"
                  >
                    ← Choose different method
                  </button>
                </motion.div>
              )}

              {/* Step 2B: Cash Payment Confirmation */}
              {paymentMethod === 'cash' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">💰</span>
                      <div>
                        <p className="font-semibold text-yellow-800">Pay at {booking.type === 'home' ? 'Service' : 'Salon'}</p>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                          <li>• Your booking will be <strong>confirmed immediately</strong></li>
                          {booking.type === 'home' ? (
                            <>
                              <li>• Pay <strong>₹{booking.total_price}</strong> cash to the stylist</li>
                              <li>• Stylist will collect cash at your home</li>
                            </>
                          ) : (
                            <>
                              <li>• Pay <strong>₹{booking.total_price}</strong> at the salon counter</li>
                              <li>• Please arrive on time for your appointment</li>
                            </>
                          )}
                          <li>• You'll get a confirmation once payment is received</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCashPayment}
                    disabled={cashConfirming}
                    className="w-full !py-4 text-lg font-bold rounded-xl transition-all disabled:opacity-50 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-yellow-200 mb-3"
                  >
                    {cashConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Confirming...
                      </span>
                    ) : (
                      `Confirm Booking — Pay ₹${booking.total_price} Later`
                    )}
                  </button>

                  <button
                    onClick={() => setPaymentMethod(null)}
                    className="w-full text-center text-sm text-gray-500 hover:text-purple-600 font-medium"
                  >
                    ← Choose different method
                  </button>
                </motion.div>
              )}
            </>
          )}

          {/* Already Paid/Confirmed */}
          {isAlreadyPaid && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <p className="text-green-600 font-semibold text-lg mb-2">
                {booking.payment?.method === 'cash'
                  ? 'Booking Confirmed — Cash Payment'
                  : 'Payment Completed'}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {booking.payment?.method === 'cash'
                  ? `Please pay ₹${booking.total_price} at the ${booking.type === 'home' ? 'time of service' : 'salon'}`
                  : 'Your booking is confirmed!'}
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                View My Bookings →
              </button>
            </div>
          )}

          {/* Security Note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            🔒 {paymentMethod === 'cash'
              ? 'Your booking is secured. Pay at the time of service.'
              : 'Secured by Razorpay. Your payment information is encrypted.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;