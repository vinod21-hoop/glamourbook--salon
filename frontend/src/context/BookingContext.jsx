// src/context/BookingContext.jsx

import { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be within BookingProvider');
  return context;
};

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState({
    step: 1, // 1=Gender, 2=Service, 3=Date, 4=Slot, 5=Type, 6=Confirm
    gender: null,
    service: null,
    date: null,
    slot: null,
    type: 'salon', // salon or home
    address: '',
    couponCode: '',
    pricing: null,
    notes: '',
  });

  const updateBooking = (updates) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setBookingData(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    setBookingData(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const goToStep = (step) => {
    setBookingData(prev => ({ ...prev, step }));
  };

  const resetBooking = () => {
    setBookingData({
      step: 1,
      gender: null,
      service: null,
      date: null,
      slot: null,
      type: 'salon',
      address: '',
      couponCode: '',
      pricing: null,
      notes: '',
    });
  };

  return (
    <BookingContext.Provider value={{
      bookingData,
      updateBooking,
      nextStep,
      prevStep,
      goToStep,
      resetBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
};
