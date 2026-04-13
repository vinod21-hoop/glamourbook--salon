// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';

// Layout
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import StaffDashboard from './pages/StaffDashboard';
// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import Dashboard from './pages/Dashboard';
import QueueDisplay from './pages/QueueDisplay';
import Staff from './pages/Staff';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageServices from './pages/admin/ManageServices';
import ManageBookings from './pages/admin/ManageBookings';
import ManageQueue from './pages/admin/ManageQueue';
import ManageSlots from './pages/admin/ManageSlots';
import ManageStaff from './pages/admin/ManageStaff';
import ManageSettings from './pages/admin/ManageSettings';
import ManageCoupons from './pages/admin/ManageCoupons';

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/services" element={<Services />} />
		<Route path="/staff" element={<Staff />} /> 
                <Route path="/queue" element={<QueueDisplay />} />

                {/* Protected Routes */}
                <Route path="/book" element={
                  <ProtectedRoute><BookingPage /></ProtectedRoute>
                } />
                <Route path="/payment/:bookingId" element={
                  <ProtectedRoute><PaymentPage /></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
		{/* Staff Routes */}
<Route path="/staff/dashboard" element={
  <ProtectedRoute><StaffDashboard /></ProtectedRoute>
} />
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute><AdminDashboard /></AdminRoute>
                } />
                <Route path="/admin/services" element={
                  <AdminRoute><ManageServices /></AdminRoute>
                } />
                <Route path="/admin/bookings" element={
                  <AdminRoute><ManageBookings /></AdminRoute>
                } />
                <Route path="/admin/queue" element={
                  <AdminRoute><ManageQueue /></AdminRoute>
                } />
                <Route path="/admin/slots" element={
                  <AdminRoute><ManageSlots /></AdminRoute>
                } />
                <Route path="/admin/staff" element={
                  <AdminRoute><ManageStaff /></AdminRoute>
                } />
                <Route path="/admin/settings" element={
                  <AdminRoute><ManageSettings /></AdminRoute>
                } />
                <Route path="/admin/coupons" element={
                  <AdminRoute><ManageCoupons /></AdminRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </Router>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
