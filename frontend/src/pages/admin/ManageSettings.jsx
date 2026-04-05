// src/pages/admin/ManageSettings.jsx

import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ManageSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await adminAPI.getSettings();
      setSettings(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateSetting = (group, index, value) => {
    const updated = { ...settings };
    updated[group][index].value = value;
    setSettings(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allSettings = Object.values(settings).flat().map(s => ({
        key: s.key,
        value: s.value,
        type: s.type,
      }));
      await adminAPI.bulkUpdateSettings(allSettings);
      toast.success('Settings saved!');
    } catch (err) {
      // Handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading settings..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
            <p className="text-gray-500 mt-1">Change website content without code changes</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save All'}
          </button>
        </div>

        {Object.entries(settings).map(([group, items]) => (
          <div key={group} className="card mb-6">
            <h3 className="font-bold text-gray-900 mb-4 capitalize">
              {group === 'ui' ? '🎨 UI Content' :
               group === 'general' ? '⚙️ General' :
               group === 'pricing' ? '💰 Pricing' :
               group === 'queue' ? '📢 Queue' : `📌 ${group}`}
            </h3>
            <div className="space-y-4">
              {items.map((setting, i) => (
                <div key={setting.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {setting.label || setting.key}
                    {setting.description && (
                      <span className="text-xs text-gray-400 ml-2">— {setting.description}</span>
                    )}
                  </label>

                  {setting.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.value === true || setting.value === 'true'}
                        onChange={e => updateSetting(group, i, e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-gray-600">
                        {setting.value ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  ) : setting.type === 'integer' ? (
                    <input
                      type="number"
                      value={setting.value}
                      onChange={e => updateSetting(group, i, e.target.value)}
                      className="input-field max-w-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      value={setting.value || ''}
                      onChange={e => updateSetting(group, i, e.target.value)}
                      className="input-field"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageSettings;