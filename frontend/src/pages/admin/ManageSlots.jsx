// src/pages/admin/ManageSlots.jsx

import { useState, useEffect } from 'react';
import { adminAPI } from '../../Services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ManageSlots = () => {
  const [workingHours, setWorkingHours] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generateForm, setGenerateForm] = useState({ from: '', to: '' });
  const [blockForm, setBlockForm] = useState({ date: '', reason: '' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [whRes, bdRes] = await Promise.all([
        adminAPI.getWorkingHours(),
        adminAPI.getBlockedDates(),
      ]);
      setWorkingHours(whRes.data.data);
      setBlockedDates(bdRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateWorkingHour = (index, field, value) => {
    const updated = [...workingHours];
    updated[index] = { ...updated[index], [field]: value };
    setWorkingHours(updated);
  };

  const saveWorkingHours = async () => {
    try {
      await adminAPI.updateWorkingHours(workingHours);
      toast.success('Working hours updated!');
    } catch (err) {
      // Handled by interceptor
    }
  };

  const handleGenerate = async () => {
    if (!generateForm.from || !generateForm.to) {
      toast.error('Select both dates');
      return;
    }
    setGenerating(true);
    try {
      const res = await adminAPI.generateSlots(generateForm.from, generateForm.to);
      toast.success(res.data.message);
    } catch (err) {
      // Handled by interceptor
    } finally {
      setGenerating(false);
    }
  };

  const handleBlockDate = async () => {
    if (!blockForm.date) {
      toast.error('Select a date');
      return;
    }
    try {
      await adminAPI.blockDate(blockForm);
      toast.success('Date blocked');
      setBlockForm({ date: '', reason: '' });
      loadData();
    } catch (err) {
      // Handled by interceptor
    }
  };

  const handleUnblock = async (date) => {
    try {
      await adminAPI.unblockDate({ date });
      toast.success('Date unblocked');
      loadData();
    } catch (err) {
      // Handled by interceptor
    }
  };

  if (loading) return <Loader text="Loading slot configuration..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Slot Management</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Working Hours */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">⏰ Working Hours</h3>
            <div className="space-y-3">
              {workingHours.map((wh, i) => (
                <div key={wh.day_of_week} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {/* Day Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer min-w-[110px]">
                    <input
                      type="checkbox"
                      checked={wh.is_open}
                      onChange={e => updateWorkingHour(i, 'is_open', e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className={`text-sm font-medium ${wh.is_open ? 'text-gray-900' : 'text-gray-400'}`}>
                      {DAYS[wh.day_of_week]}
                    </span>
                  </label>

                  {wh.is_open && (
                    <>
                      <input
                        type="time"
                        value={wh.open_time}
                        onChange={e => updateWorkingHour(i, 'open_time', e.target.value)}
                        className="input-field !py-1.5 !px-2 !w-28 text-sm"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input
                        type="time"
                        value={wh.close_time}
                        onChange={e => updateWorkingHour(i, 'close_time', e.target.value)}
                        className="input-field !py-1.5 !px-2 !w-28 text-sm"
                      />
                    </>
                  )}

                  {!wh.is_open && (
                    <span className="text-sm text-red-400 italic">Closed</span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={saveWorkingHours} className="btn-primary w-full mt-4">
              Save Working Hours
            </button>
          </div>

          {/* Generate Slots & Block Dates */}
          <div className="space-y-6">
            {/* Generate Slots */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">📅 Generate Slots</h3>
              <p className="text-sm text-gray-500 mb-4">
                Generate time slots for a range of dates based on working hours
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={generateForm.from}
                    onChange={e => setGenerateForm({ ...generateForm, from: e.target.value })}
                    className="input-field !py-2 text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={generateForm.to}
                    onChange={e => setGenerateForm({ ...generateForm, to: e.target.value })}
                    className="input-field !py-2 text-sm"
                    min={generateForm.from || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary w-full disabled:opacity-50"
              >
                {generating ? 'Generating...' : '⚡ Generate Slots'}
              </button>
            </div>

            {/* Block Date */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">🚫 Block Date</h3>
              <div className="space-y-3 mb-4">
                <input
                  type="date"
                  value={blockForm.date}
                  onChange={e => setBlockForm({ ...blockForm, date: e.target.value })}
                  className="input-field !py-2 text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
                <input
                  type="text"
                  value={blockForm.reason}
                  onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
                  className="input-field !py-2 text-sm"
                  placeholder="Reason (e.g. Holiday)"
                />
              </div>
              <button onClick={handleBlockDate} className="btn-danger w-full">
                Block This Date
              </button>
            </div>

            {/* Blocked Dates List */}
            {blockedDates.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-3">Blocked Dates</h3>
                <div className="space-y-2">
                  {blockedDates.map(bd => (
                    <div key={bd.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{bd.date}</p>
                        <p className="text-xs text-gray-500">{bd.reason || 'No reason'}</p>
                      </div>
                      <button
                        onClick={() => handleUnblock(bd.date)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSlots;
