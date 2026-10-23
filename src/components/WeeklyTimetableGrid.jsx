import React, { useMemo } from 'react';
import { Coffee, Trash2, MapPin, User } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Helper to parse time strings into minutes for chronological sorting
 */
const parseTimeToMinutes = (timeStr = '') => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = (match[3] || '').toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export default function WeeklyTimetableGrid({
  entries = [],
  readOnly = false,
  onDeleteSlot,
  highlightFacultyName = '',
  emptyMessage = 'No classes scheduled for this period'
}) {
  // 1. Extract distinct time intervals sorted chronologically (X-Axis)
  const sortedTimeSlots = useMemo(() => {
    const map = new Map();

    entries.forEach((e) => {
      const start = (e.startTime || '').trim();
      const end = (e.endTime || '').trim();
      if (start && end) {
        const label = `${start} - ${end}`;
        if (!map.has(label)) {
          map.set(label, {
            label,
            startTime: start,
            endTime: end,
            startMinutes: parseTimeToMinutes(start),
            isBreak: Boolean(e.isBreak)
          });
        }
      }
    });

    const list = Array.from(map.values()).sort(
      (a, b) => a.startMinutes - b.startMinutes
    );

    // If no slots exist yet, provide standard default college intervals
    if (list.length === 0) {
      return [
        { label: '09:00 - 10:00', startTime: '09:00', endTime: '10:00', startMinutes: 540, isBreak: false },
        { label: '10:00 - 11:00', startTime: '10:00', endTime: '11:00', startMinutes: 600, isBreak: false },
        { label: '11:00 - 11:30', startTime: '11:00', endTime: '11:30', startMinutes: 660, isBreak: true },
        { label: '11:30 - 12:30', startTime: '11:30', endTime: '12:30', startMinutes: 690, isBreak: false },
        { label: '12:30 - 01:30', startTime: '12:30', endTime: '01:30', startMinutes: 750, isBreak: false },
        { label: '01:30 - 02:30', startTime: '01:30', endTime: '02:30', startMinutes: 810, isBreak: false }
      ];
    }

    return list;
  }, [entries]);

  // Quick lookup map: key = `${day.toLowerCase()}_${slot.label}`
  const slotsLookup = useMemo(() => {
    const lookup = {};
    entries.forEach((e) => {
      const day = (e.day || e.dayOfWeek || '').toLowerCase();
      const timeLabel = `${e.startTime || ''} - ${e.endTime || ''}`.trim();
      const key = `${day}_${timeLabel}`;
      lookup[key] = e;
    });
    return lookup;
  }, [entries]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          {/* Header Row: Time Slots on X-Axis */}
          <thead>
            <tr className="bg-slate-900 text-white text-[11px] font-bold">
              <th className="p-3.5 sm:p-4 text-center border-r border-slate-800 w-28 uppercase tracking-wider shrink-0 bg-slate-950/80">
                Day / Time
              </th>
              {sortedTimeSlots.map((slot) => (
                <th
                  key={slot.label}
                  className={`p-3 sm:p-3.5 text-center border-r border-slate-800 min-w-[150px] sm:min-w-[170px] ${
                    slot.isBreak ? 'bg-amber-950/60 text-amber-300' : 'bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {slot.isBreak && <Coffee size={13} className="text-amber-400" />}
                    <span className="font-mono text-xs">{slot.label}</span>
                  </div>
                  {slot.isBreak && (
                    <span className="text-[9px] uppercase tracking-wider text-amber-400/90 font-semibold block mt-0.5">
                      Recess / Break
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Rows: Days of Week on Y-Axis */}
          <tbody className="divide-y divide-slate-100 text-xs">
            {DAYS_OF_WEEK.map((dayName, dayIndex) => (
              <tr
                key={dayName}
                className={dayIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
              >
                {/* Y-Axis Day Column */}
                <td className="p-3.5 sm:p-4 border-r border-slate-200/70 text-center font-bold text-slate-900 bg-slate-50/80 uppercase tracking-wider text-[11px] whitespace-nowrap">
                  <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 block">
                    {dayName}
                  </span>
                </td>

                {/* Slot Cells */}
                {sortedTimeSlots.map((slot) => {
                  const key = `${dayName.toLowerCase()}_${slot.label}`;
                  const entry = slotsLookup[key];

                  // 1. Break Slot
                  if (entry?.isBreak || slot.isBreak) {
                    return (
                      <td
                        key={`${dayName}_${slot.label}`}
                        className="p-2.5 sm:p-3 border-r border-slate-100 bg-amber-50/60 text-center align-middle"
                      >
                        <div className="p-3 rounded-xl border border-dashed border-amber-200/80 bg-amber-50/90 flex flex-col items-center justify-center gap-1 text-amber-800">
                          <Coffee size={16} className="text-amber-600" />
                          <span className="font-extrabold text-[11px] tracking-wide uppercase">
                            {entry?.subject || 'Break / Recess'}
                          </span>
                          <span className="text-[10px] text-amber-600/90 font-medium font-mono">
                            {slot.label}
                          </span>
                          {!readOnly && entry && onDeleteSlot && (
                            <button
                              type="button"
                              onClick={() => onDeleteSlot(entry._id || entry.id)}
                              className="mt-1 text-[10px] text-amber-700 hover:text-red-600 transition-colors inline-flex items-center gap-1 font-semibold"
                              title="Delete Break Slot"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // 2. Regular Teaching Slot Scheduled
                  if (entry) {
                    const isPractical = entry.sessionType === 'Practical';
                    const isHighlightedFaculty =
                      highlightFacultyName &&
                      entry.faculty &&
                      entry.faculty.toLowerCase().includes(highlightFacultyName.toLowerCase());

                    return (
                      <td
                        key={`${dayName}_${slot.label}`}
                        className={`p-2 sm:p-2.5 border-r border-slate-100 align-top transition-colors ${
                          isHighlightedFaculty ? 'bg-purple-50/80 ring-2 ring-purple-400 inset-0' : ''
                        }`}
                      >
                        <div
                          className={`h-full rounded-xl p-3 border flex flex-col justify-between transition-all group ${
                            isPractical
                              ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                              : 'bg-indigo-50/40 border-indigo-200/80 hover:border-indigo-300'
                          }`}
                        >
                          <div>
                            {/* Subject & Session Pill */}
                            <div className="flex items-start justify-between gap-1 mb-1.5">
                              <span className="font-extrabold text-slate-900 text-xs tracking-tight line-clamp-2">
                                {entry.subject}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 uppercase tracking-wider ${
                                  isPractical
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                }`}
                              >
                                {entry.sessionType || 'Theory'}
                              </span>
                            </div>

                            {/* Faculty Name */}
                            {entry.faculty && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium mb-1">
                                <User size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate">{entry.faculty}</span>
                              </div>
                            )}

                            {/* Room / Lab */}
                            {entry.roomNumber && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                <MapPin size={11} className="text-slate-400 shrink-0" />
                                <span className="font-mono bg-white/80 px-1.5 py-0.2 rounded border border-slate-200">
                                  {entry.roomNumber}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Admin Action footer */}
                          {!readOnly && onDeleteSlot && (
                            <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                              <span className="text-[10px] font-mono text-slate-400">
                                {entry.division ? `Div ${entry.division}` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => onDeleteSlot(entry._id || entry.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                title="Delete Slot"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // 3. Empty / Free Slot
                  return (
                    <td
                      key={`${dayName}_${slot.label}`}
                      className="p-3 border-r border-slate-100 text-center align-middle bg-slate-50/20"
                    >
                      <div className="py-4 text-center">
                        <span className="text-slate-300 font-bold select-none text-xs">
                          —
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Legend & Status Footer */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-indigo-100 border border-indigo-300" />
            <span className="text-slate-600 font-medium text-[11px]">Theory Lecture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
            <span className="text-slate-600 font-medium text-[11px]">Practical / Lab Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
            <span className="text-slate-600 font-medium text-[11px]">Break / Lunch Period</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Total Scheduled Periods: <strong className="text-slate-700">{entries.length}</strong>
        </div>
      </div>
    </div>
  );
}
