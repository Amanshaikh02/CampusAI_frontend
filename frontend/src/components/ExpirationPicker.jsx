import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Check, AlertCircle, Sparkles } from 'lucide-react';

/**
 * Format a Date object into "YYYY-MM-DDTHH:mm" for datetime-local input
 */
export const toDateTimeLocalValue = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Calculate future date preset
 */
export const getPresetDate = (preset) => {
  const now = new Date();
  switch (preset) {
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '3d':
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case '1w':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1m':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
};

/**
 * Formats a friendly localized string for display
 */
export const formatFriendlyDateTime = (dateValue) => {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Modern Expiration Date & Time Picker with Quick-Select presets and live preview
 */
export default function ExpirationPicker({
  value,
  onChange,
  error,
  label = 'Auto-Expiration Date & Time',
  required = true,
  helperText = 'Item will be permanently and automatically deleted once this timestamp passes.'
}) {
  const [selectedPreset, setSelectedPreset] = useState('1w');

  // Set default initial value if none provided
  useEffect(() => {
    if (!value) {
      const defaultDate = getPresetDate('1w');
      onChange(toDateTimeLocalValue(defaultDate));
    }
  }, [value, onChange]);

  const handlePresetSelect = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey !== 'custom') {
      const presetDate = getPresetDate(presetKey);
      onChange(toDateTimeLocalValue(presetDate));
    }
  };

  const handleCustomChange = (e) => {
    setSelectedPreset('custom');
    onChange(e.target.value);
  };

  // Minimum allowed date is right now
  const minDateTime = toDateTimeLocalValue(new Date());

  const presets = [
    { key: '24h', label: '24 Hours', badge: '1 Day' },
    { key: '3d', label: '3 Days', badge: 'Short' },
    { key: '1w', label: '1 Week', badge: 'Recommended' },
    { key: '1m', label: '1 Month', badge: '30 Days' },
    { key: 'custom', label: 'Custom Date', badge: 'Manual' }
  ];

  return (
    <div className="bg-purple-50/40 border border-purple-100/80 rounded-2xl p-4 sm:p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
            <Clock size={15} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-900">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <p className="text-[11px] text-gray-500">
              Auto-disappears from Admin, Faculty & Student dashboards.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 self-start sm:self-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60">
          <Sparkles size={11} /> Auto-Delete Enabled
        </span>
      </div>

      {/* Quick-Select Preset Buttons */}
      <div className="mb-3">
        <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
          Quick Expiration Presets:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {presets.map((p) => {
            const isSelected = selectedPreset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetSelect(p.key)}
                className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                <span className="flex items-center gap-1">
                  {p.label}
                  {isSelected && <Check size={12} />}
                </span>
                <span
                  className={`text-[9px] mt-0.5 font-normal ${
                    isSelected ? 'text-indigo-100' : 'text-gray-400'
                  }`}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DateTime Local Input */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
          Exact Expiration Timestamp (Local Time):
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            min={minDateTime}
            value={value || ''}
            onChange={handleCustomChange}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
              error ? 'border-red-500' : 'border-gray-200'
            }`}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}
      </div>

      {/* Live Preview Card */}
      {value && (
        <div className="mt-3 p-3 bg-white/90 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-indigo-600 flex-shrink-0" />
            <span className="text-gray-600">
              Will auto-delete on:{' '}
              <strong className="text-gray-900 font-bold">
                {formatFriendlyDateTime(value)}
              </strong>
            </span>
          </div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md whitespace-nowrap">
            TTL Live
          </span>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-gray-500 mt-2 italic flex items-center gap-1">
          ℹ️ {helperText}
        </p>
      )}
    </div>
  );
}
