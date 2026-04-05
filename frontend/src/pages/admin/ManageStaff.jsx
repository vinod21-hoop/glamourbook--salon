// src/pages/admin/ManageStaff.jsx

import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', specialization: '',
    max_daily_bookings: 16, is_active: true,
  });

  useEffect(() => { loadStaff(); }, []);

  const loadStaff = async () => {
    try {
      const res = await adminAPI.getStaff();
      setStaff(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', specialization: '', max_daily_bookings: 16, is_active: true });
    setEditing(null);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, phone: s.phone || '', email: s.email || '',
      specialization: s.specialization || '', max_daily_bookings: s.max_daily,
      is_active: s.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminAPI.updateStaff(editing.id, form);
        toast.success('Staff updated');
      } else {
        await adminAPI.createStaff(form);
        toast.success('Staff added');
      }
      setShowModal(false);
      resetForm();
      loadStaff();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this staff member?')) return;
    try {
      await adminAPI.deleteStaff(id);
      toast.success('Staff removed');
      loadStaff();
    } catch (err) {}
  };

  if (loading) return <Loader text="Loading staff..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
            + Add Staff
          </button>
        </div>

        {/* Staff Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {s.name.charAt(0)}
                </div>
                <span className={`badge ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900">{s.name}</h3>
              <p className="text-sm text-gray-500">{s.specialization || 'General'}</p>
              {s.phone && <p className="text-xs text-gray-400 mt-1">📞 {s.phone}</p>}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <p>Today: {s.today_bookings}/{s.max_daily}</p>
                  <p className={s.available_today ? 'text-green-600' : 'text-red-600'}>
                    {s.available_today ? '✅ Available' : '❌ Full'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">
                    Delete
                  </button>
                </div>
              </div>

              {s.services?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.services.map((svc, i) => (
                    <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                      {svc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">
                {editing ? 'Edit Staff' : 'Add Staff'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-field" required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text" value={form.specialization}
                    onChange={e => setForm({ ...form, specialization: e.target.value })}
                    className="input-field" placeholder="e.g. Hair Specialist"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Daily Bookings</label>
                  <input
                    type="number" value={form.max_daily_bookings}
                    onChange={e => setForm({ ...form, max_daily_bookings: parseInt(e.target.value) })}
                    className="input-field" min="1" max="50"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox" checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">
                    {editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStaff;