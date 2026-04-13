// src/pages/Staff.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staffAPI } from '../Services/api';
import Loader from '../components/common/Loader';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const res = await staffAPI.getAll();
      setStaff(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Loading our team..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white"
          >
            Meet Our Expert Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-purple-100 mt-4 text-lg max-w-2xl mx-auto"
          >
            Skilled professionals dedicated to making you look and feel amazing
          </motion.p>
        </div>
      </section>

      {/* Staff Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {staff.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300 group"
              >
                {/* Staff Image */}
                <div className="w-full h-72 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden relative">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-28 h-28 bg-white/60 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <span className="text-5xl font-bold text-purple-600">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Availability Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md">
                      ● Available
                    </span>
                  </div>
                </div>

                {/* Staff Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition">
                    {member.name}
                  </h3>

                  {member.specialization && (
                    <p className="text-purple-600 font-medium mt-1 text-sm">
                      ✨ {member.specialization}
                    </p>
                  )}

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm text-gray-500 ml-1">5.0</span>
                  </div>

                  {/* Services Tags */}
                  {member.services && member.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {member.services.slice(0, 3).map((service) => (
                        <span
                          key={service.id}
                          className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium"
                        >
                          {service.name}
                        </span>
                      ))}
                      {member.services.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          +{member.services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Book Button */}
                  <Link
    to="/book"
    state={{ staffId: member.id, staffName: member.name }}
    className="mt-5 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg text-center block"
>
    Book with {member.name?.split(' ')[0]}
</Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {staff.length === 0 && (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">💇</p>
              <p className="text-xl text-gray-500">Our team info is coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Team?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏆', title: 'Experienced', desc: 'Years of professional salon experience' },
              { icon: '📚', title: 'Certified', desc: 'Trained by industry-leading experts' },
              { icon: '💝', title: 'Passionate', desc: 'Dedicated to making you look amazing' },
              { icon: '⭐', title: 'Top Rated', desc: 'Loved by hundreds of happy clients' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition"
              >
                <span className="text-4xl">{item.icon}</span>
                <h3 className="font-bold text-gray-900 mt-3">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mt-4 text-purple-100 text-lg">
            Book an appointment with any of our expert stylists today
          </p>
          <Link
            to="/book"
            className="inline-block mt-8 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl"
          >
            Book Appointment →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Staff;
