import React, { useState, useMemo } from 'react';
import {
  Calendar, Plus, Coffee, Trash2,
  FileDown, Send, LayoutGrid, List, Filter, Check
} from 'lucide-react';
import WeeklyTimetableGrid from './WeeklyTimetableGrid';
import { generateWeeklyTimetablePDF } from '../utils/timetablePdfGenerator';
import { DEPARTMENT_OPTIONS } from '../constants/departments';

const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminTimetableSection({
  activeTimetables = [],
  subjects = [],
  faculty = [],
  // Form handler and mutation props
  handleAddTimetable,
  handleDeleteTimetable,
  handleSendTimetable,
  ttDate, setTtDate,
  ttDay, setTtDay,
  ttStartTime, setTtStartTime,
  ttEndTime, setTtEndTime,
  ttSubject, setTtSubject,
  ttDepartment, setTtDepartment,
  ttSemester, setTtSemester,
  ttDivision, setTtDivision,
  ttFaculty, setTtFaculty,
  ttRoomNumber, setTtRoomNumber,
  ttSessionType, setTtSessionType,
  ttIsBreak, setTtIsBreak,
  ttErrors = {},
  ttSuccess = '',
  // Modal props for sending timetable
  sendTtModalOpen, setSendTtModalOpen,
  sendTtDept, setSendTtDept,
  sendTtAudience, setSendTtAudience,
  sendTtSemester, setSendTtSemester,
  sendTtDivision, setSendTtDivision
}) {
  // Mandatory Global Filters (Above the timetable view)
  const [filterDept, setFilterDept] = useState('AIML');
  const [filterSem, setFilterSem] = useState('Semester 7');
  const [filterDiv, setFilterDiv] = useState('A');

  // View toggle: 'grid' (Weekly Grid Matrix) vs 'list' (Linear List)
  const [viewMode, setViewMode] = useState('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Filter timetable slots strictly by selected Department, Semester, and Division
  const filteredTimetables = useMemo(() => {
    return activeTimetables.filter((t) => {
      // 1. Department match
      if (filterDept && filterDept !== 'All' && filterDept !== 'All Departments') {
        const matchesDept =
          t.department === filterDept || t.department === 'All Departments';
        if (!matchesDept) return false;
      }

      // 2. Semester match
      if (filterSem && filterSem !== 'All') {
        const tSem = t.semester || 'Semester 1';
        if (tSem !== filterSem) return false;
      }

      // 3. Division match
      if (filterDiv && filterDiv !== 'All') {
        const tDiv = (t.division || 'A').toLowerCase();
        if (tDiv !== filterDiv.toLowerCase()) return false;
      }

      return true;
    });
  }, [activeTimetables, filterDept, filterSem, filterDiv]);

  // Handle PDF Generation
  const onGeneratePDF = () => {
    try {
      setPdfGenerating(true);
      generateWeeklyTimetablePDF({
        entries: filteredTimetables,
        department: filterDept,
        semester: filterSem,
        division: filterDiv,
        institutionName: 'Campus AI - College of Engineering & Technology'
      });
    } catch (err) {
      alert('Failed to generate timetable PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          MANDATORY GLOBAL FILTER BAR & TOOLBAR
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Section Header & Active Scope */}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                Weekly Class Matrix
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Academic Session 2025–2026
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Class Schedule & Timetable Slots
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select Department, Semester, and Division to view the exact scheduled periods.
            </p>
          </div>

          {/* Right: Actions (Toggle, PDF, Add, Send) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle Switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Weekly Grid View (Matrix)"
              >
                <LayoutGrid size={14} />
                <span>Weekly Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Linear List View"
              >
                <List size={14} />
                <span>Linear List</span>
              </button>
            </div>

            {/* Generate PDF Button */}
            <button
              type="button"
              onClick={onGeneratePDF}
              disabled={pdfGenerating}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shadow-purple-600/20"
              title="Download beautifully styled Weekly Matrix PDF"
            >
              <FileDown size={15} />
              <span>{pdfGenerating ? 'Generating...' : 'Generate PDF'}</span>
            </button>

            {/* Send Timetable Button */}
            <button
              type="button"
              onClick={() => {
                setSendTtDept(filterDept);
                if (setSendTtSemester) setSendTtSemester(filterSem);
                if (setSendTtDivision) setSendTtDivision(filterDiv);
                setSendTtModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shadow-blue-600/20"
            >
              <Send size={14} />
              <span>Publish / Send</span>
            </button>

            {/* Toggle Add Slot Button */}
            <button
              type="button"
              onClick={() => setIsFormOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isFormOpen
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20'
              }`}
            >
              <Plus size={15} className={`transition-transform duration-200 ${isFormOpen ? 'rotate-45' : ''}`} />
              <span>{isFormOpen ? 'Close Form' : 'Add Slot'}</span>
            </button>
          </div>
        </div>

        {/* Mandatory Filter Bar (Department, Semester, Division) */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter size={15} className="text-indigo-600 shrink-0" />
            <span>Target Class Filters:</span>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Dept:
            </span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
            >
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sem:
            </span>
            <select
              value={filterSem}
              onChange={(e) => setFilterSem(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={`Semester ${s}`}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Div / Section:
            </span>
            <select
              value={filterDiv}
              onChange={(e) => setFilterDiv(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Counter pill */}
          <div className="ml-auto text-xs text-slate-500 font-medium">
            Displaying <strong className="text-slate-900 font-bold">{filteredTimetables.length}</strong> scheduled periods for{' '}
            <span className="text-indigo-600 font-bold">{filterDept}</span> ({filterSem} - Div {filterDiv})
          </div>
        </div>
      </div>

      {/* =========================================================================
          ENHANCED "ADD TIMETABLE ENTRY" FORM
          ========================================================================= */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Plus size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Timetable Slot</h3>
                <p className="text-xs text-slate-500">
                  Schedule lectures, lab sessions, or recurring break intervals
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>

          {ttSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{ttSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddTimetable} className="space-y-4">
            {/* Row 1: Target Academic Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department *
                </label>
                <select
                  value={ttDepartment}
                  onChange={(e) => setTtDepartment(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    ttErrors.department ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {ttErrors.department && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{ttErrors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Semester *
                </label>
                <select
                  value={ttSemester}
                  onChange={(e) => setTtSemester(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={`Semester ${s}`}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Division / Section *
                </label>
                <input
                  type="text"
                  value={ttDivision}
                  onChange={(e) => setTtDivision(e.target.value)}
                  placeholder="e.g. A or Section A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Row 2: Day and Time Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Day of Week *
                </label>
                <select
                  value={ttDay}
                  onChange={(e) => setTtDay(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    ttErrors.day ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Day</option>
                  {DAYS_LIST.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {ttErrors.day && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{ttErrors.day}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={ttStartTime}
                  onChange={(e) => setTtStartTime(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    ttErrors.startTime ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {ttErrors.startTime && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{ttErrors.startTime}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  End Time *
                </label>
                <input
                  type="time"
                  value={ttEndTime}
                  onChange={(e) => setTtEndTime(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    ttErrors.endTime ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {ttErrors.endTime && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{ttErrors.endTime}</p>
                )}
              </div>
            </div>

            {/* "Mark as Break" Checkbox Switch */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Coffee size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Mark as Break / Lunch Recess
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    If enabled, subject, faculty, and room fields will be exempted.
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ttIsBreak}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTtIsBreak(checked);
                    if (checked) {
                      setTtSubject('Lunch Break');
                      setTtFaculty('');
                      setTtRoomNumber('');
                      setTtSessionType('Break');
                    } else {
                      setTtSubject('');
                      setTtSessionType('Theory');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Fields Active only if NOT a Break */}
            {ttIsBreak ? (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <div>
                  <strong>Break Slot Mode Active:</strong> This period will be rendered as a highlighted
                  recess/lunch break across the matrix.
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-amber-900 uppercase">Label:</label>
                  <input
                    type="text"
                    value={ttSubject}
                    onChange={(e) => setTtSubject(e.target.value)}
                    placeholder="e.g. Lunch Break"
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Subject Dropdown to prevent typos */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject (Dropdown) *
                    </label>
                    <select
                      value={ttSubject}
                      onChange={(e) => setTtSubject(e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                        ttErrors.subject ? 'border-red-500' : 'border-slate-200'
                      }`}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub._id || sub.id || sub.name} value={sub.name}>
                          {sub.name} {sub.code ? `(${sub.code})` : ''}
                        </option>
                      ))}
                      {/* Standard fallbacks */}
                      {subjects.length === 0 && (
                        <>
                          <option value="Machine Learning">Machine Learning</option>
                          <option value="Deep Learning">Deep Learning</option>
                          <option value="Network Security">Network Security</option>
                          <option value="Cryptography">Cryptography</option>
                          <option value="Cloud Computing">Cloud Computing</option>
                          <option value="MERN Stack Development">MERN Stack Development</option>
                        </>
                      )}
                    </select>
                    {ttErrors.subject && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">{ttErrors.subject}</p>
                    )}
                  </div>

                  {/* Faculty Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Faculty Member
                    </label>
                    <select
                      value={ttFaculty}
                      onChange={(e) => setTtFaculty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="">Assign Faculty (Optional)</option>
                      {faculty.map((f) => (
                        <option key={f._id || f.id || f.username} value={f.name}>
                          {f.name} (@{f.username}) - {f.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room / Lab Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Room / Lab Number
                    </label>
                    <input
                      type="text"
                      value={ttRoomNumber}
                      onChange={(e) => setTtRoomNumber(e.target.value)}
                      placeholder="e.g. Lab 201 or Room 304"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Session Type Radio / Pills */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Session Type
                  </label>
                  <div className="flex items-center gap-3">
                    <label
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                        ttSessionType === 'Theory'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sessionType"
                        value="Theory"
                        checked={ttSessionType === 'Theory'}
                        onChange={() => setTtSessionType('Theory')}
                        className="sr-only"
                      />
                      <span>📖 Theory Lecture</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                        ttSessionType === 'Practical'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sessionType"
                        value="Practical"
                        checked={ttSessionType === 'Practical'}
                        onChange={() => setTtSessionType('Practical')}
                        className="sr-only"
                      />
                      <span>🔬 Practical / Lab</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20 transition-all"
              >
                Save Timetable Slot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW DISPLAY: WEEKLY GRID MATRIX OR LINEAR LIST
          ========================================================================= */}
      {viewMode === 'grid' ? (
        /* WEEKLY GRID MATRIX */
        <WeeklyTimetableGrid
          entries={filteredTimetables}
          readOnly={false}
          onDeleteSlot={handleDeleteTimetable}
        />
      ) : (
        /* LINEAR LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">
              Linear Slot List ({filteredTimetables.length} slots)
            </h3>
            <span className="text-xs text-slate-500">
              Sorted by Day & Start Time
            </span>
          </div>

          {filteredTimetables.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Calendar size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-600">
                No slots found for {filterDept} ({filterSem} - Div {filterDiv}).
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
              >
                + Add your first timetable slot
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/70">
                  <tr>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Time Interval</th>
                    <th className="px-4 py-3">Subject / Activity</th>
                    <th className="px-4 py-3">Faculty</th>
                    <th className="px-4 py-3">Room / Lab</th>
                    <th className="px-4 py-3">Session Type</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTimetables.map((t) => (
                    <tr
                      key={t._id || t.id}
                      className={t.isBreak ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/80'}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px]">
                          {t.day || t.dayOfWeek}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {t.startTime && t.endTime ? `${t.startTime} - ${t.endTime}` : t.time || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {t.isBreak ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-amber-700">
                            <Coffee size={13} /> {t.subject || 'Break'}
                          </span>
                        ) : (
                          <strong className="text-slate-900">{t.subject}</strong>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {t.isBreak ? '—' : t.faculty || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3">
                        {t.roomNumber ? (
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                            {t.roomNumber}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            t.isBreak
                              ? 'bg-amber-100 text-amber-800'
                              : t.sessionType === 'Practical'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {t.isBreak ? 'Break' : t.sessionType || 'Theory'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTimetable(t._id || t.id)}
                          className="text-red-500 hover:text-red-700 font-bold text-xs p-1"
                          title="Delete slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Send Timetable Modal */}
      {sendTtModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Send size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Publish Timetable</h3>
                <p className="text-xs text-slate-500">
                  Broadcast this class timetable to students and faculty members
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Department
                </label>
                <select
                  value={sendTtDept}
                  onChange={(e) => setSendTtDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select Department...</option>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Semester
                  </label>
                  <select
                    value={sendTtSemester}
                    onChange={(e) => setSendTtSemester && setSendTtSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={`Semester ${s}`}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Division
                  </label>
                  <input
                    type="text"
                    value={sendTtDivision}
                    onChange={(e) => setSendTtDivision && setSendTtDivision(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Publish To (Audience)
                </label>
                <select
                  value={sendTtAudience}
                  onChange={(e) => setSendTtAudience(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="">Select Audience...</option>
                  <option value="Students">Students Only</option>
                  <option value="Faculty">Faculty Only</option>
                  <option value="Students & Faculty">Students & Faculty (Everyone)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSendTtModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendTimetable}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20"
                >
                  Confirm & Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
