// src/components/common/Footer.jsx

import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">✂️</span>
              </div>
              <span className="text-xl font-bold text-white">GlamourBook</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Premium salon services with smart booking and real-time queue management.
              Book your appointment hassle-free.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-400 hover:text-purple-400 transition">Home</Link>
              <Link to="/services" className="block text-gray-400 hover:text-purple-400 transition">Services</Link>
              <Link to="/book" className="block text-gray-400 hover:text-purple-400 transition">Book Now</Link>
              <Link to="/queue" className="block text-gray-400 hover:text-purple-400 transition">Live Queue</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              <p>📍 123 Beauty Lane, Mumbai</p>
              <p>📞 +91 9876543210</p>
              <p>✉️ hello@glamourbook.com</p>
              <p>⏰ Mon-Sat: 10AM - 8PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} GlamourBook. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;