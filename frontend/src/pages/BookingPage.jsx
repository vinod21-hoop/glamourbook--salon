// src/pages/BookingPage.jsx (COMPLETE FILE)

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { serviceAPI, bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const STEPS = [
  { num: 1, label: 'Gender' },
  { num: 2, label: 'Service' },
  { num: 3, label: 'Date' },
  { num: 4, label: 'Time' },
  { num: 5, label: 'Type' },
  { num: 6, label: 'Confirm' },
];

const BookingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [gender, setGender] = useState(user?.gender || '');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [serviceType, setServiceType] = useState('salon');
  const [address, setAddress] = useState(user?.address || '');
  const [couponCode, setCouponCode] = useState('');
  const [pricing, setPricing] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.category) {
      setGender(location.state.category);
      if (location.state.serviceId) setStep(2);
    }
  }, [location]);

  useEffect(() => {
    if (gender && step === 2) loadServices();
  }, [gender, step]);

  useEffect(() => {
    if (selectedService && step === 3) loadDates();
  }, [selectedService, step]);

  useEffect(() => {
    if (selectedDate && step === 4) loadSlots();
  }, [selectedDate, step]);

  useEffect(() => {
    if (selectedService && step === 5) calculatePrice();
  }, [serviceType, step]);

  // ─── Data Loaders ────────────────────────────────

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await serviceAPI.getAll({ category: gender });
      setServices(res.data.data);
      if (location.state?.serviceId) {
        const pre = res.data.data.find(s => s.id === location.state.serviceId);
        if (pre) setSelectedService(pre);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDates = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getAvailableDates();
      setDates(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getAvailableSlots({ date: selectedDate.date });
      setSlots(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const calculatePrice = async () => {
    if (!selectedService) return;
    try {
      const res = await bookingAPI.calculatePrice({
        service_id: selectedService.id,
        type: serviceType,
        coupon_code: couponCode || undefined,
      });
      setPricing(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
      return;
    }
    await calculatePrice();
    if (pricing?.discount > 0) {
      toast.success(`Coupon applied! You save ₹${pricing.discount}`);
    } else {
      toast.error('Invalid or expired coupon');
    }
  };

  // ─── Submit Booking ──────────────────────────────

  const handleSubmit = async () => {
    if (serviceType === 'home' && !address.trim()) {
      toast.error('Please provide your address for home service');
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        service_id: selectedService.id,
        slot_id: selectedSlot.id,
        date: selectedDate.date,
        type: serviceType,
        address: serviceType === 'home' ? address : undefined,
        coupon_code: couponCode || undefined,
        notes: notes || undefined,
      });

      const booking = res.data.data;
      toast.success('Booking created! Proceed to payment.');
      navigate(`/payment/${booking.id}`);
    } catch (err) {
      // Handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step Navigation ─────────────────────────────

  const goNext = () => setStep(prev => Math.min(6, prev + 1));
  const goBack = () => setStep(prev => Math.max(1, prev - 1));

  // ─── Render ──────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-500 mt-1">Follow the steps to complete your booking</p>
        </div>

        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step > s.num
                      ? 'bg-green-500 text-white'
                      : step === s.num
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-110'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium hidden sm:block ${
                    step >= s.num ? 'text-purple-600' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 transition-all duration-500 ${
                    step > s.num ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="card max-w-2xl mx-auto">
              {/* ─── Step 1: Gender ─── */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Select Gender</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'male', icon: '👨', label: 'Male', color: 'blue' },
                      { key: 'female', icon: '👩', label: 'Female', color: 'pink' },
                    ].map(g => (
                      <button
                        key={g.key}
                        onClick={() => { setGender(g.key); goNext(); }}
                        className={`p-8 rounded-2xl border-2 text-center transition-all duration-300 hover:scale-105 ${
                          gender === g.key
                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-6xl block mb-3">{g.icon}</span>
                        <span className="text-lg font-semibold text-gray-800">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Step 2: Service Selection ─── */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Choose Service
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({gender === 'male' ? '👨 Men' : '👩 Women'})
                    </span>
                  </h2>

                  {loading ? <Loader /> : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {services.map(service => (
                        <button
                          key={service.id}
                          onClick={() => { setSelectedService(service); goNext(); }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                            selectedService?.id === service.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{service.name}</h3>
                              <p className="text-sm text-gray-500 mt-0.5">
                                ⏱ {service.formatted_duration}
                                {service.home_available && ' • 🏠 Home available'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-purple-600">
                                {service.formatted_price}
                              </span>
                              {service.average_rating > 0 && (
                                <p className="text-xs text-yellow-500">⭐ {service.average_rating}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button onClick={goBack} className="mt-4 text-gray-500 hover:text-purple-600 text-sm font-medium">
                    ← Back to gender
                  </button>
                </div>
              )}

              {/* ─── Step 3: Date Selection ─── */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Select Date</h2>

                  {loading ? <Loader /> : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                      {dates.map(d => (
                        <button
                          key={d.date}
                          onClick={() => { setSelectedDate(d); setSelectedSlot(null); goNext(); }}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            selectedDate?.date === d.date
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-100 hover:border-purple-200'
                          }`}
                        >
                          <p className="text-xs text-gray-500">{d.day_name}</p>
                          <p className="font-bold text-gray-900 text-sm mt-0.5">{d.formatted}</p>
                          <p className="text-xs text-green-600 mt-1">
                            {d.available_slots} slots
                          </p>
                          {d.is_today && (
                            <span className="badge-info text-[10px] mt-1">Today</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {dates.length === 0 && !loading && (
                    <p className="text-center text-gray-500 py-10">
                      No available dates. Please contact the salon.
                    </p>
                  )}

                  <button onClick={goBack} className="mt-4 text-gray-500 hover:text-purple-600 text-sm font-medium">
                    ← Back to service
                  </button>
                </div>
              )}

              {/* ─── Step 4: Time Slot Selection ─── */}
              {step === 4 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Select Time Slot</h2>
                  <p className="text-gray-500 text-sm mb-6">📅 {selectedDate?.formatted}</p>

                  {loading ? <Loader /> : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                      {slots.map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => { setSelectedSlot(slot); goNext(); }}
                          disabled={!slot.available}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            selectedSlot?.id === slot.id
                              ? 'border-purple-500 bg-purple-50'
                              : slot.available
                                ? 'border-gray-100 hover:border-purple-200'
                                : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <p className="font-semibold text-sm text-gray-900">{slot.start_time}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{slot.staff_name}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {slots.length === 0 && !loading && (
                    <p className="text-center text-gray-500 py-10">
                      No slots available for this date.
                    </p>
                  )}

                  <button onClick={goBack} className="mt-4 text-gray-500 hover:text-purple-600 text-sm font-medium">
                    ← Back to date
                  </button>
                </div>
              )}

              {/* ─── Step 5: Service Type (Salon / Home) ─── */}
              {step === 5 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Where would you like the service?</h2>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setServiceType('salon')}
                      className={`p-6 rounded-2xl border-2 text-center transition-all ${
                        serviceType === 'salon'
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-4xl block mb-2">🏪</span>
                      <span className="font-semibold text-gray-800">At Salon</span>
                      <p className="text-xs text-gray-500 mt-1">Visit us at our location</p>
                    </button>

                    <button
                      onClick={() => setServiceType('home')}
                      disabled={!selectedService?.home_available}
                      className={`p-6 rounded-2xl border-2 text-center transition-all ${
                        serviceType === 'home'
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : !selectedService?.home_available
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-4xl block mb-2">🏠</span>
                      <span className="font-semibold text-gray-800">At Home</span>
                      <p className="text-xs text-gray-500 mt-1">
                        +₹500 extra charge
                      </p>
                    </button>
                  </div>

                  {/* Address for home service */}
                  {serviceType === 'home' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Your Address *
                      </label>
                      <textarea
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="input-field !h-24 resize-none"
                        placeholder="Enter your full address..."
                        required
                      />
                    </div>
                  )}

                  {/* Coupon */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Coupon Code (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        className="input-field flex-1"
                        placeholder="Enter code e.g. WELCOME20"
                      />
                      <button onClick={applyCoupon} className="btn-secondary !px-4 !py-2 text-sm">
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Price Preview */}
                  {pricing && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Price</span>
                          <span className="font-medium">₹{pricing.base_price}</span>
                        </div>
                        {pricing.home_charge > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Home Service Charge</span>
                            <span className="font-medium">₹{pricing.home_charge}</span>
                          </div>
                        )}
                        {pricing.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span className="font-medium">-₹{pricing.discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                          <span>Total</span>
                          <span className="text-purple-600">₹{pricing.total}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="input-field"
                      placeholder="Any special requests..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={goBack} className="btn-secondary flex-1">
                      ← Back
                    </button>
                    <button onClick={goNext} className="btn-primary flex-1">
                      Review Booking →
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Step 6: Confirmation ─── */}
              {step === 6 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Confirm Your Booking</h2>

                  <div className="space-y-4">
                    {/* Booking Summary */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Service</p>
                          <p className="font-semibold text-gray-900">{selectedService?.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-semibold text-gray-900">{selectedService?.formatted_duration}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-semibold text-gray-900">{selectedDate?.formatted}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Time</p>
                          <p className="font-semibold text-gray-900">{selectedSlot?.start_time}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Location</p>
                          <p className="font-semibold text-gray-900">
                            {serviceType === 'salon' ? '🏪 At Salon' : '🏠 At Home'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Stylist</p>
                          <p className="font-semibold text-gray-900">
                            {selectedSlot?.staff_name || 'Any Available'}
                          </p>
                        </div>
                      </div>

                      {serviceType === 'home' && address && (
                        <div className="mt-3 pt-3 border-t border-purple-100">
                          <p className="text-gray-500 text-sm">Address</p>
                          <p className="font-semibold text-gray-900 text-sm">{address}</p>
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service</span>
                          <span>₹{pricing?.base_price || selectedService?.price}</span>
                        </div>
                        {pricing?.home_charge > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Home Charge</span>
                            <span>₹{pricing.home_charge}</span>
                          </div>
                        )}
                        {pricing?.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Coupon Discount</span>
                            <span>-₹{pricing.discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-3 border-t text-lg font-bold">
                          <span>Total</span>
                          <span className="text-purple-600">
                            ₹{pricing?.total || selectedService?.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={goBack} className="btn-secondary flex-1">
                      ← Modify
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Processing...
                        </span>
                      ) : 'Confirm & Pay →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookingPage;