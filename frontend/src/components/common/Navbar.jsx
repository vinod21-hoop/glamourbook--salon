// src/components/common/Navbar.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const isStaff = user?.role === 'staff';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">✂️</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              GlamourBook
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-purple-600 transition font-medium">
              Home
            </Link>
            <Link to="/services" className="text-gray-600 hover:text-purple-600 transition font-medium">
              Services
            </Link>
            <Link to="/staff" className="text-gray-600 hover:text-purple-600 transition font-medium">
              Our Team
            </Link>
            <Link to="/queue" className="text-gray-600 hover:text-purple-600 transition font-medium">
              Live Queue
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-gray-100 rounded-full pl-3 pr-4 py-2 hover:bg-gray-200 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
                  {/* Role badge */}
                  {isAdmin && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Admin</span>}
                  {isStaff && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Staff</span>}
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          isAdmin ? 'bg-orange-100 text-orange-600' :
                          isStaff ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {isAdmin ? '👑 Admin' : isStaff ? '💼 Staff' : '👤 Customer'}
                        </span>
                      </div>

                      {/* Customer Links */}
                      {!isStaff && !isAdmin && (
                        <>
                          <Link
                            to="/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition"
                          >
                            📋 My Bookings
                          </Link>
                          <Link
                            to="/book"
                            onClick={() => setProfileOpen(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition"
                          >
                            📅 Book Now
                          </Link>
                        </>
                      )}

                      {/* Staff Links */}
{isStaff && (
  <>
    <Link
      to="/staff/dashboard"
      onClick={() => setProfileOpen(false)}
      className="block px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition"
    >
      💼 Staff Dashboard
    </Link>
  </>
)}
                      {/* Admin Links */}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition"
                        >
                          ⚙️ Admin Panel
                        </Link>
                      )}

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-purple-600 font-medium transition">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm !px-5 !py-2.5">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-gray-100"
            >
              <div className="py-4 space-y-2">
                <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">Home</Link>
                <Link to="/services" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">Services</Link>
                <Link to="/staff" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">Our Team</Link>
                <Link to="/queue" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">Live Queue</Link>

                {isAuthenticated ? (
                  <>
                    {/* Customer Mobile Links */}
                    {!isStaff && !isAdmin && (
                      <>
                        <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">📋 My Bookings</Link>
                        <Link to="/book" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-purple-600 font-semibold hover:bg-purple-50 rounded-lg">📅 Book Now</Link>
                      </>
                    )}

                  {/* Staff Mobile Links */}
{isStaff && (
  <>
    <div className="px-4 py-1">
      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Staff Portal</span>
    </div>
    <Link to="/staff/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg">💼 Staff Dashboard</Link>
  </>
)}
     {/* Admin Mobile Links */}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg">⚙️ Admin Panel</Link>
                    )}

                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">🚪 Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">Login</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-purple-600 font-semibold">Sign Up</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;