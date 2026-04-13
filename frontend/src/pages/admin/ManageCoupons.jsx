// src/pages/admin/ManageCoupons.jsx (COMPLETE)

import { useState, useEffect } from 'react';
import { adminAPI } from '../../Services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: '', description: '', type: 'percentage', value: '',
    min_order: 0, max_discount: '', usage_limit: '',
    per_user_limit: 1, valid_from: '', valid_until: '', is_active: true,
  });

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    try {
      const res = await adminAPI.getCoupons();
      setCoupons(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({
      code: '', description: '', type: 'percentage', value: '',
      min_order: 0, max_discount: '', usage_limit: '',
      per_user_limit: 1, valid_from: '', valid_until: '', is_active: true,
    });
    setEditing(null);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code, description: c.description || '', type: c.type,
      value: c.value, min_order: c.min_order, max_discount: c.max_discount || '',
      usage_limit: c.usage_limit || '', per_user_limit: c.per_user_limit,
      valid_from: c.valid_from, valid_until: c.valid_until, is_active: c.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.max_discount) delete data.max_discount;
      if (!data.usage_limit) delete data.usage_limit;

      if (editing) {
        await adminAPI.updateCoupon(editing.id, data);
        toast.success('Coupon updated');
      } else {
        await adminAPI.createCoupon(data);
        toast.success('Coupon created');
      }
      setShowModal(false);
      resetForm();
      loadCoupons();
    } catch (err) {
      // Handled by interceptor
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await adminAPI.deleteCoupon(id);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (err) {}
  };

  const handleToggle = async (id) => {
    try {
      const res = await adminAPI.toggleCoupon(id);
      toast.success(res.data.message);
      loadCoupons();
    } catch (err) {}
  };

  if (loading) return <Loader text="Loading coupons..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Coupons</h1>
            <p className="text-gray-500 mt-1">{coupons.length} coupons total</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
            + Create Coupon
          </button>
        </div>

        {/* Coupons List */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => {
            const isExpired = new Date(coupon.valid_until) < new Date();
            const isExhausted = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;

            return (
              <div key={coupon.id} className={`card relative ${(!coupon.is_active || isExpired) ? 'opacity-60' : ''}`}>
                {/* Status indicator */}
                <div className="absolute top-4 right-4">
                  {isExpired ? (
                    <span className="badge bg-red-100 text-red-700">Expired</span>
                  ) : isExhausted ? (
                    <span className="badge bg-gray-100 text-gray-700">Used Up</span>
                  ) : coupon.is_active ? (
                    <span className="badge bg-green-100 text-green-700">Active</span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-500">Inactive</span>
                  )}
                </div>

                {/* Coupon Code */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-200 rounded-xl p-4 text-center mb-4">
                  <p className="text-xs text-gray-500 mb-1">CODE</p>
                  <p className="text-2xl font-bold text-purple-600 tracking-wider">
                    {coupon.code}
                  </p>
                </div>

                {/* Details */}
                <p className="text-sm text-gray-600 mb-3">{coupon.description || 'No description'}</p>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-semibold text-purple-600">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                    </span>
                  </div>
                  {coupon.min_order > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Min Order</span>
                      <span className="text-gray-700">₹{coupon.min_order}</span>
                    </div>
                  )}
                  {coupon.max_discount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Discount</span>
                      <span className="text-gray-700">₹{coupon.max_discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Usage</span>
                    <span className="text-gray-700">
                      {coupon.used_count} / {coupon.usage_limit || '∞'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valid</span>
                    <span className="text-gray-700 text-xs">
                      {coupon.valid_from} → {coupon.valid_until}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggle(coupon.id)}
                    className={`flex-1 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      coupon.is_active
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {coupon.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEdit(coupon)}
                    className="flex-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🎟️</p>
            <p className="text-xl text-gray-500">No coupons yet</p>
            <p className="text-gray-400 mt-2">Create your first coupon to attract customers</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editing ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="input-field font-mono tracking-wider"
                    placeholder="WELCOME20"
                    required
                    disabled={!!editing}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field"
                    placeholder="20% off on first booking"
                  />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value {form.type === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      value={form.value}
                      onChange={e => setForm({ ...form, value: e.target.value })}
                      className="input-field"
                      placeholder={form.type === 'percentage' ? '20' : '100'}
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Min Order & Max Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                    <input
                      type="number"
                      value={form.min_order}
                      onChange={e => setForm({ ...form, min_order: e.target.value })}
                      className="input-field"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                    <input
                      type="number"
                      value={form.max_discount}
                      onChange={e => setForm({ ...form, max_discount: e.target.value })}
                      className="input-field"
                      placeholder="500 (optional)"
                      min="0"
                    />
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                    <input
                      type="number"
                      value={form.usage_limit}
                      onChange={e => setForm({ ...form, usage_limit: e.target.value })}
                      className="input-field"
                      placeholder="∞ (leave empty)"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
                    <input
                      type="number"
                      value={form.per_user_limit}
                      onChange={e => setForm({ ...form, per_user_limit: e.target.value })}
                      className="input-field"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>

                {/* Validity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                    <input
                      type="date"
                      value={form.valid_from}
                      onChange={e => setForm({ ...form, valid_from: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={form.valid_until}
                      onChange={e => setForm({ ...form, valid_until: e.target.value })}
                      className="input-field"
                      required
                      min={form.valid_from}
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editing ? 'Update Coupon' : 'Create Coupon'}
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

export default ManageCoupons;
