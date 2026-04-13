// src/pages/Home.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { serviceAPI, settingsAPI } from '../Services/api';
import Loader from '../components/common/Loader';

const Home = () => {
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesRes, settingsRes] = await Promise.all([
        serviceAPI.getAll(),
        settingsAPI.getPublic(),
      ]);
      setServices(servicesRes.data.data.slice(0, 6));
      setSettings(settingsRes.data.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen">
      {/* Announcement Banner */}
      {settings.show_banner && settings.banner_text && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2.5 text-sm font-medium">
          {settings.banner_text}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {settings.hero_title || 'Look Your Best, Feel Your Best'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-lg">
                {settings.hero_subtitle || 'Premium salon services at your doorstep or at our luxury salon'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/book" className="btn-primary text-lg !px-8 !py-4">
                  Book Appointment →
                </Link>
                <Link to="/services" className="btn-secondary text-lg !px-8 !py-4">
                  View Services
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                {[
                  { number: '500+', label: 'Happy Clients' },
                  { number: '15+', label: 'Services' },
                  { number: '4.8★', label: 'Rating' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stat.number}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="w-full h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl opacity-20 absolute -rotate-6"></div>
                <div className="w-full h-96 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center relative">
                  <div className="text-center text-white">
                    <p className="text-8xl">✂️</p>
                    <p className="text-2xl font-bold mt-4">GlamourBook</p>
                    <p className="text-lg opacity-80">Premium Salon</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-gray-500 text-lg">Book your appointment in 4 easy steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '👤', title: 'Choose Gender', desc: 'Select services for men or women' },
              { icon: '💇', title: 'Pick Service', desc: 'Browse our premium services' },
              { icon: '📅', title: 'Select Slot', desc: 'Choose your preferred date & time' },
              { icon: '✅', title: 'Confirm & Pay', desc: 'Quick payment and you\'re booked!' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
                  {step.icon}
                </div>
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg text-gray-900">{step.title}</h3>
                <p className="text-gray-500 mt-1">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Services</h2>
            <p className="mt-3 text-gray-500 text-lg">Premium services for men & women</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card hover:border-purple-200 group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${
                        service.category === 'male' ? 'bg-blue-100 text-blue-700' :
                        service.category === 'female' ? 'bg-pink-100 text-pink-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {service.category === 'male' ? '👨' : service.category === 'female' ? '👩' : '👥'} {service.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition">
                      {service.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{service.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-2xl font-bold text-purple-600">{service.formatted_price}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">⏱ {service.formatted_duration}</span>
                    {service.average_rating > 0 && (
                      <p className="text-sm text-yellow-500">⭐ {service.average_rating}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/services" className="btn-secondary">
              View All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Look Amazing?</h2>
          <p className="mt-4 text-lg text-purple-100">
            Book your appointment now and skip the wait with our smart queue system
          </p>
          <Link to="/book" className="inline-block mt-8 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl">
            Book Now — It's Easy! →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
