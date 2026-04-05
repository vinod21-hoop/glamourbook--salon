// src/pages/Services.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { serviceAPI } from '../services/api';
import Loader from '../components/common/Loader';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const res = await serviceAPI.getAll();
      setServices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(s => {
    const matchCategory = activeCategory === 'all' ||
      s.category === activeCategory ||
      s.category === 'unisex';
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) return <Loader text="Loading services..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Our Services</h1>
          <p className="text-gray-500 mt-2">Choose from our premium salon services</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all',    label: '🏠 All', },
              { key: 'male',   label: '👨 Men' },
              { key: 'female', label: '👩 Women' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeCategory === tab.key
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field !pl-10"
              placeholder="Search services..."
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card group hover:border-purple-200"
            >
              {/* Service Image Placeholder */}
              {service.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-5xl">
                    {service.category === 'male' ? '💈' : service.category === 'female' ? '💅' : '✂️'}
                  </span>
                </div>
              )}

              {/* Category Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${
                  service.category === 'male' ? 'bg-blue-100 text-blue-700' :
                  service.category === 'female' ? 'bg-pink-100 text-pink-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {service.category}
                </span>
                {service.home_available && (
                  <span className="badge bg-green-100 text-green-700">🏠 Home</span>
                )}
              </div>

              {/* Service Info */}
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition">
                {service.name}
              </h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                {service.description}
              </p>

              {/* Price & Duration */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <div>
                  <span className="text-2xl font-bold text-purple-600">
                    {service.formatted_price}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>⏱ {service.formatted_duration}</p>
                  {service.average_rating > 0 && (
                    <p className="text-yellow-500 font-medium">⭐ {service.average_rating}</p>
                  )}
                </div>
              </div>

              {/* Book Button */}
              <Link
                to="/book"
                state={{ serviceId: service.id, category: service.category }}
                className="btn-primary w-full text-center mt-4 block"
              >
                Book Now
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-xl text-gray-500">No services found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;