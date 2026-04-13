// src/pages/BookingPage.jsx

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
const [slotStaffFilter, setSlotStaffFilter] = useState(null);
  // Staff filter from Staff page
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedStaffName, setSelectedStaffName] = useState(null);

  useEffect(() => {
    // Coming from Staff page
    if (location.state?.staffId) {
      setSelectedStaffId(location.state.staffId);
      setSelectedStaffName(location.state.staffName);
    }
    // Coming from Services page
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
// Filter slots based on staff tab selection
const filteredSlots = slotStaffFilter
    ? slots.filter(s => s.staff_id === slotStaffFilter)
    : selectedStaffId
      ? slots.filter(s => s.staff_id === selectedStaffId)
      : slots;
  // ─── Data Loaders ────────────────────────────────

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await serviceAPI.getAll({ category: gender });
      let serviceList = res.data.data;

      // If staff selected, filter to only their services
      if (selectedStaffId) {
        const staffRes = await bookingAPI.getStaffServices
          ? await bookingAPI.getStaffServices(selectedStaffId)
          : null;

        // If API doesn't exist, we'll show all services (staff can do any)
        // But filter client-side if staff services data is available
      }

      setServices(serviceList);
      if (location.state?.serviceId) {
        const pre = serviceList.find(s => s.id === location.state.serviceId);
        if (pre) setSelectedService(pre);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedStaffId) params.staff_id = selectedStaffId;
      const res = await bookingAPI.getAvailableDates(params);
      setDates(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      const params = { date: selectedDate.date };
      if (selectedStaffId) params.staff_id = selectedStaffId;
      const res = await bookingAPI.getAvailableSlots(params);
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

  const clearStaffFilter = () => {
    setSelectedStaffId(null);
    setSelectedStaffName(null);
    toast.success('Staff filter removed. Showing all available slots.');
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
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-500 mt-1">Follow the steps to complete your booking</p>
        </div>

        {/* Staff Filter Banner */}
        {selectedStaffName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 flex items-center justify-between text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                  {selectedStaffName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">Booking with {selectedStaffName}</p>
                  <p className="text-purple-100 text-xs">Showing only {selectedStaffName}'s availability</p>
                </div>
              </div>
              <button
                onClick={clearStaffFilter}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
              >
                ✕ Clear
              </button>
            </div>
          </motion.div>
        )}

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
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Select Date</h2>
                  {selectedStaffName && (
                    <p className="text-purple-600 text-sm mb-4 font-medium">
                      📅 Showing {selectedStaffName}'s available dates
                    </p>
                  )}

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
                    <div className="text-center py-10">
                      <p className="text-gray-500">
                        {selectedStaffName
                          ? `No available dates for ${selectedStaffName}.`
                          : 'No available dates. Please contact the salon.'}
                      </p>
                      {selectedStaffName && (
                        <button
                          onClick={clearStaffFilter}
                          className="mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          Show all staff availability →
                        </button>
                      )}
                    </div>
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
      <>
        {/* Staff Filter Tabs */}
        {!selectedStaffId && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Choose Stylist</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSlotStaffFilter(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !slotStaffFilter
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👥 All Stylists
              </button>
              {/* Get unique staff from slots */}
              {[...new Map(slots.map(s => [s.staff_id, { id: s.staff_id, name: s.staff_name }])).values()].map(staff => (
                <button
                  key={staff.id}
                  onClick={() => setSlotStaffFilter(staff.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    slotStaffFilter === staff.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    slotStaffFilter === staff.id
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {staff.name?.charAt(0)}
                  </span>
                  {staff.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Staff Info Card */}
        {(slotStaffFilter || selectedStaffId) && (
          <div className="mb-4 bg-purple-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {(slots.find(s => s.staff_id === (slotStaffFilter || selectedStaffId))?.staff_name || selectedStaffName || '?').charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {slots.find(s => s.staff_id === (slotStaffFilter || selectedStaffId))?.staff_name || selectedStaffName}
                </p>
                <p className="text-xs text-purple-600">
                  {filteredSlots.length} slots available
                </p>
              </div>
            </div>
            {!selectedStaffId && slotStaffFilter && (
              <button
                onClick={() => setSlotStaffFilter(null)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Show all
              </button>
            )}
          </div>
        )}

        {/* Time Slots Grid - Grouped by Time */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {Object.entries(
            filteredSlots.reduce((groups, slot) => {
              const time = slot.start_time;
              if (!groups[time]) groups[time] = [];
              groups[time].push(slot);
              return groups;
            }, {})
          ).map(([time, timeSlots]) => (
            <div key={time} className="flex items-start gap-3">
              {/* Time Label */}
              <div className="w-20 flex-shrink-0 pt-3">
                <p className="text-sm font-bold text-gray-900">{time}</p>
              </div>

              {/* Staff Buttons for this time */}
              <div className="flex flex-wrap gap-2 flex-1">
                {timeSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => { setSelectedSlot(slot); goNext(); }}
                    disabled={!slot.available}
                    className={`px-4 py-2.5 rounded-xl border-2 transition-all duration-200 flex items-center gap-2 ${
                      selectedSlot?.id === slot.id
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : slot.available
                          ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white'
                          : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedSlot?.id === slot.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {slot.staff_name?.charAt(0)}
                    </span>
                    <span className={`text-sm font-medium ${
                      selectedSlot?.id === slot.id ? 'text-purple-700' : 'text-gray-700'
                    }`}>
                      {slot.staff_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {filteredSlots.length === 0 && !loading && (
      <div className="text-center py-10">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-gray-500">
          {selectedStaffName
            ? `No slots available for ${selectedStaffName} on this date.`
            : slotStaffFilter
              ? 'No slots available for this stylist.'
              : 'No slots available for this date.'}
        </p>
        {(selectedStaffName || slotStaffFilter) && (
          <button
            onClick={() => { clearStaffFilter(); setSlotStaffFilter(null); }}
            className="mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            Show all staff availability →
          </button>
        )}
      </div>
    )}

    <button onClick={goBack} className="mt-4 text-gray-500 hover:text-purple-600 text-sm font-medium">
      ← Back to date
    </button>
  </div>
)}

              {/* ─── Step 5: Service Type ─── */}
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
                      <p className="text-xs text-gray-500 mt-1">+₹500 extra charge</p>
                    </button>
                  </div>

                  {serviceType === 'home' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Address *</label>
                      <textarea
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="input-field !h-24 resize-none"
                        placeholder="Enter your full address..."
                        required
                      />
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Coupon Code (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        className="input-field flex-1"
                        placeholder="Enter code e.g. WELCOME20"
                      />
                      <button onClick={applyCoupon} className="btn-secondary !px-4 !py-2 text-sm">Apply</button>
                    </div>
                  </div>

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

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="input-field"
                      placeholder="Any special requests..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={goBack} className="btn-secondary flex-1">← Back</button>
                    <button onClick={goNext} className="btn-primary flex-1">Review Booking →</button>
                  </div>
                </div>
              )}

              {/* ─── Step 6: Confirmation ─── */}
              {step === 6 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Confirm Your Booking</h2>

                  <div className="space-y-4">
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
                          <span className="text-purple-600">₹{pricing?.total || selectedService?.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={goBack} className="btn-secondary flex-1">← Modify</button>
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