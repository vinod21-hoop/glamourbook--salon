// src/pages/PaymentPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import StatusBadge from '../components/common/StatusBadge';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

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

  const handlePayment = async () => {
    setPaying(true);

    try {
      // Step 1: Create Razorpay order
      const orderRes = await paymentAPI.createOrder(bookingId);
      const orderData = orderRes.data.data;

      // Step 2: Open Razorpay checkout
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
            // Step 3: Verify payment
            const verifyRes = await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success('Payment successful! Booking confirmed.');
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

      // Check if Razorpay SDK is loaded
      if (typeof window.Razorpay === 'undefined') {
        // Load Razorpay script dynamically
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

  if (loading) return <Loader text="Loading booking..." />;
  if (!booking) return null;

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

          {/* Pay Button */}
          {booking.status === 'pending' && (
            <button
              onClick={handlePayment}
              disabled={paying}
              className="btn-primary w-full !py-4 text-lg disabled:opacity-50"
            >
              {paying ? 'Processing...' : `Pay ₹${booking.total_price}`}
            </button>
          )}

          {booking.status !== 'pending' && (
            <div className="text-center">
              <p className="text-green-600 font-semibold text-lg mb-4">
                ✅ Payment already completed
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            🔒 Secured by Razorpay. Your payment information is encrypted.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;