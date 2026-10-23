import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, X, SlidersHorizontal, Users, GraduationCap,
  ChevronDown, ChevronUp, RotateCcw, SearchX,
  Sparkles, Eye
} from 'lucide-react';
import { searchDirectory } from '../services/searchService';
import { DEPARTMENT_OPTIONS } from '../constants/departments';

const SEMESTER_OPTIONS = [
  { value: '', label: 'All Semesters' },
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

const DIVISION_OPTIONS = [
  { value: '', label: 'All Divisions' },
  { value: 'A', label: 'Section / Division A' },
  { value: 'B', label: 'Section / Division B' },
  { value: 'C', label: 'Section / Division C' },
  { value: 'General', label: 'General' },
];

export default function AdminAdvancedSearch({ onSelectPerson }) {
  // Scope: 'student' or 'faculty'
  const [scope, setScope] = useState('student');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Primary search bar
  const [globalQuery, setGlobalQuery] = useState('');

  // Student specific filters
  const [stName, setStName] = useState('');
  const [stEnrollment, setStEnrollment] = useState('');
  const [stSemester, setStSemester] = useState('');
  const [stDivision, setStDivision] = useState('');

  // Faculty specific filters
  const [faName, setFaName] = useState('');
  const [faSemester, setFaSemester] = useState('');
  const [faSubject, setFaSubject] = useState('');
  const [faDepartment, setFaDepartment] = useState('');

  // Results & Loading State
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPersonModal, setSelectedPersonModal] = useState(null);

  // Active filter count for badge indicator
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (scope === 'student') {
      if (stName.trim()) count++;
      if (stEnrollment.trim()) count++;
      if (stSemester) count++;
      if (stDivision) count++;
    } else {
      if (faName.trim()) count++;
      if (faSemester) count++;
      if (faSubject.trim()) count++;
      if (faDepartment && faDepartment !== 'All Departments') count++;
    }
    return count;
  }, [scope, stName, stEnrollment, stSemester, stDivision, faName, faSemester, faSubject, faDepartment]);

  // Check if any search or filter is entered
  const isSearchActive = useMemo(() => {
    if (globalQuery.trim()) return true;
    return activeFiltersCount > 0;
  }, [globalQuery, activeFiltersCount]);

  // Reset all filters
  const handleResetFilters = () => {
    setGlobalQuery('');
    setStName('');
    setStEnrollment('');
    setStSemester('');
    setStDivision('');
    setFaName('');
    setFaSemester('');
    setFaSubject('');
    setFaDepartment('');
  };

  // Switch Scope
  const handleScopeChange = (newScope) => {
    if (newScope !== scope) {
      setScope(newScope);
      setResults([]);
      setHasSearched(false);
    }
  };

  // Debounced API search effect (300ms delay)
  useEffect(() => {
    // If nothing is entered at all, clear results and set idle
    if (!isSearchActive) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);

    const debounceTimer = setTimeout(async () => {
      try {
        const params = {
          role: scope,
          q: globalQuery.trim()
        };

        if (scope === 'student') {
          if (stName.trim()) params.name = stName.trim();
          if (stEnrollment.trim()) params.enrollment = stEnrollment.trim();
          if (stSemester) params.sem = stSemester;
          if (stDivision) params.div = stDivision;
        } else {
          if (faName.trim()) params.name = faName.trim();
          if (faSemester) params.sem = faSemester;
          if (faSubject.trim()) params.subject = faSubject.trim();
          if (faDepartment && faDepartment !== 'All Departments') params.dept = faDepartment;
        }

        const response = await searchDirectory(params);
        if (response && response.success) {
          setResults(response.data || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Search query error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [
    scope,
    globalQuery,
    stName,
    stEnrollment,
    stSemester,
    stDivision,
    faName,
    faSemester,
    faSubject,
    faDepartment,
    isSearchActive
  ]);

  const handleRowClick = (person) => {
    if (onSelectPerson) {
      onSelectPerson({ ...person, type: scope });
    } else {
      setSelectedPersonModal({ ...person, type: scope });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 mb-8 transition-all">
      {/* Header: Title & Scope Selector Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <Sparkles size={14} />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-indigo-600 uppercase">
              Command Directory Search
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Universal Directory Search
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly locate students or faculty with real-time multi-attribute filtering.
          </p>
        </div>

        {/* Scope Pill Toggle */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleScopeChange('student')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scope === 'student'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={15} />
            <span>Students</span>
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('faculty')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scope === 'faculty'
                ? 'bg-white text-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap size={15} />
            <span>Faculty</span>
          </button>
        </div>
      </div>

      {/* Primary Search Bar & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              isLoading ? 'text-indigo-600 animate-spin' : 'text-slate-400'
            }`}
            size={18}
          />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder={
              scope === 'student'
                ? 'Search students by name, enrollment no, or email...'
                : 'Search faculty by name, username, subject, or department...'
            }
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-xs"
          />
          {globalQuery && (
            <button
              type="button"
              onClick={() => setGlobalQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all shrink-0 w-full sm:w-auto justify-center ${
            showAdvanced || activeFiltersCount > 0
              ? 'bg-indigo-50/80 border-indigo-200 text-indigo-700 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Reset Button (only shown when any filter is active) */}
        {isSearchActive && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all shrink-0 w-full sm:w-auto justify-center"
            title="Reset all filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Expandable Advanced Filters Tray */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-150">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            {scope === 'student' ? 'Student Filter Attributes' : 'Faculty Filter Attributes'}
          </div>

          {scope === 'student' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filter: Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={stName}
                  onChange={(e) => setStName(e.target.value)}
                  placeholder="e.g. Aman or Hitarth"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Filter: Enrollment No */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Enrollment Number
                </label>
                <input
                  type="text"
                  value={stEnrollment}
                  onChange={(e) => setStEnrollment(e.target.value)}
                  placeholder="e.g. 230185012..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Filter: Semester */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Semester
                </label>
                <select
                  value={stSemester}
                  onChange={(e) => setStSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                >
                  {SEMESTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter: Division */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Division / Section
                </label>
                <select
                  value={stDivision}
                  onChange={(e) => setStDivision(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                >
                  {DIVISION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Filter: Faculty Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Faculty Name / Username
                </label>
                <input
                  type="text"
                  value={faName}
                  onChange={(e) => setFaName(e.target.value)}
                  placeholder="e.g. Harsh or mg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Filter: Subject / Subjects Taught */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Subject / Semester Taught
                </label>
                <input
                  type="text"
                  value={faSubject}
                  onChange={(e) => setFaSubject(e.target.value)}
                  placeholder="e.g. MERN, AI, Cyber, 7"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Filter: Department */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Department
                </label>
                <select
                  value={faDepartment}
                  onChange={(e) => setFaDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENT_OPTIONS.filter((d) => d !== 'All Departments').map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filter Chips Row */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active Filters:
          </span>
          {scope === 'student' ? (
            <>
              {stName && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-md border border-indigo-100">
                  Name: {stName}
                  <button type="button" onClick={() => setStName('')}><X size={11} /></button>
                </span>
              )}
              {stEnrollment && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-md border border-indigo-100">
                  Enrollment: {stEnrollment}
                  <button type="button" onClick={() => setStEnrollment('')}><X size={11} /></button>
                </span>
              )}
              {stSemester && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-md border border-indigo-100">
                  Sem: {stSemester}
                  <button type="button" onClick={() => setStSemester('')}><X size={11} /></button>
                </span>
              )}
              {stDivision && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-md border border-indigo-100">
                  Div: {stDivision}
                  <button type="button" onClick={() => setStDivision('')}><X size={11} /></button>
                </span>
              )}
            </>
          ) : (
            <>
              {faName && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-semibold rounded-md border border-purple-100">
                  Name: {faName}
                  <button type="button" onClick={() => setFaName('')}><X size={11} /></button>
                </span>
              )}
              {faSubject && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-semibold rounded-md border border-purple-100">
                  Subject: {faSubject}
                  <button type="button" onClick={() => setFaSubject('')}><X size={11} /></button>
                </span>
              )}
              {faDepartment && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-semibold rounded-md border border-purple-100">
                  Dept: {faDepartment}
                  <button type="button" onClick={() => setFaDepartment('')}><X size={11} /></button>
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Results / Feedback Section */}
      {isSearchActive && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate-700">
              {isLoading ? (
                <span className="flex items-center gap-2 text-indigo-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  Querying database...
                </span>
              ) : (
                <span>
                  Search Results: <strong className="text-slate-900">{results.length}</strong> {scope} records found
                </span>
              )}
            </div>
          </div>

          {/* 1. Loading Skeleton */}
          {isLoading && (
            <div className="space-y-2.5">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="w-36 h-3.5 bg-slate-200 rounded" />
                      <div className="w-24 h-2.5 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-5 bg-slate-200 rounded-md" />
                    <div className="w-16 h-5 bg-slate-200 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. No Results Found State */}
          {!isLoading && hasSearched && results.length === 0 && (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto text-slate-400 mb-2.5">
                <SearchX size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                No matching {scope}s found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                We couldn't find any records matching your search criteria. Try modifying your spelling or relaxing filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <RotateCcw size={13} />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}

          {/* 3. Results List / Data Presentation */}
          {!isLoading && results.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/70">
                  <tr>
                    <th className="px-3.5 py-3 whitespace-nowrap">Name</th>
                    {scope === 'student' ? (
                      <>
                        <th className="px-3.5 py-3 whitespace-nowrap">Enrollment</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Department</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Semester</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Division</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3.5 py-3 whitespace-nowrap">Username</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Department</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Subjects Taught</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Semester</th>
                      </>
                    )}
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium bg-white">
                  {results.map((item, idx) => (
                    <tr
                      key={item.id || item._id || `${item.name}-${idx}`}
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      {/* Name with Avatar */}
                      <td className="px-3.5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                            scope === 'student' ? 'bg-indigo-600' : 'bg-purple-600'
                          }`}>
                            {(item.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-semibold text-slate-900">{item.name}</span>
                            <span className="block text-[10px] text-slate-400">{item.email}</span>
                          </div>
                        </div>
                      </td>

                      {scope === 'student' ? (
                        <>
                          {/* Enrollment */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] rounded-md">
                              {item.enrollment || '-'}
                            </span>
                          </td>
                          {/* Department */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md">
                              {item.department || item.course || '-'}
                            </span>
                          </td>
                          {/* Semester */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-slate-600">
                            {item.semester || '-'}
                          </td>
                          {/* Division */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                              {item.classSection || item.section || 'General'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Username */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-mono font-bold text-[11px] rounded-md">
                              {item.username || '-'}
                            </span>
                          </td>
                          {/* Department */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md">
                              {item.department || '-'}
                            </span>
                          </td>
                          {/* Subjects Taught */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(item.subjectsTaught && item.subjectsTaught.length > 0
                                ? item.subjectsTaught
                                : [item.assignedSubject].filter(Boolean)
                              ).map((subj, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded"
                                >
                                  {subj}
                                </span>
                              ))}
                              {!item.assignedSubject && (!item.subjectsTaught || item.subjectsTaught.length === 0) && (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </div>
                          </td>
                          {/* Semester */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-slate-600">
                            {item.semester || '-'}
                          </td>
                        </>
                      )}

                      {/* View Action */}
                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(item);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye size={12} />
                          <span>Details</span>
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

      {/* Person Detail Modal (when clicked directly from search) */}
      {selectedPersonModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedPersonModal.type === 'student' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  {selectedPersonModal.type === 'student' ? <Users size={18} /> : <GraduationCap size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedPersonModal.type === 'student' ? 'Student Profile' : 'Faculty Profile'}
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400 capitalize">
                    {selectedPersonModal.type} directory entry
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPersonModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-lg leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Full Name</span>
                  <span className="font-semibold text-slate-900 text-sm">{selectedPersonModal.name || '-'}</span>
                </div>
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</span>
                  <span className="font-medium text-slate-800 break-all">{selectedPersonModal.email || '-'}</span>
                </div>

                {selectedPersonModal.type === 'student' ? (
                  <>
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Enrollment Number</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block font-mono">
                        {selectedPersonModal.enrollment || '-'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</span>
                      <span className="font-semibold text-slate-900">{selectedPersonModal.department || selectedPersonModal.course || '-'}</span>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Semester</span>
                      <span className="font-semibold text-slate-900">{selectedPersonModal.semester || '-'}</span>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Division / Section</span>
                      <span className="font-semibold text-slate-900">{selectedPersonModal.classSection || selectedPersonModal.section || 'General'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Username</span>
                      <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md inline-block font-mono">
                        {selectedPersonModal.username || '-'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</span>
                      <span className="font-semibold text-slate-900">{selectedPersonModal.department || '-'}</span>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 col-span-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subjects Assigned</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(selectedPersonModal.subjectsTaught && selectedPersonModal.subjectsTaught.length > 0
                          ? selectedPersonModal.subjectsTaught
                          : [selectedPersonModal.assignedSubject].filter(Boolean)
                        ).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-100"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPersonModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
