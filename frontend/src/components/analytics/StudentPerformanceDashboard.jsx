import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Award,
  Sparkles,
  AlertCircle,
  CalendarCheck,
  Search,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Users,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';

export default function StudentPerformanceDashboard({
  role = 'student',
  currentUser = null,
  embedded = false
}) {
  const isStudent = role === 'student';
  const isFaculty = role === 'faculty' || role === 'teacher';
  const isAdmin = role === 'admin';

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  // Faculty State
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [facultyStudents, setFacultyStudents] = useState([]);
  const [selectedStudentEnrollment, setSelectedStudentEnrollment] = useState('');

  // Admin Search State
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedAdminStudent, setSelectedAdminStudent] = useState(null);

  // Analytics Payload State
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table local search filter
  const [tableSearch, setTableSearch] = useState('');
  const [tableSemesterFilter, setTableSemesterFilter] = useState('ALL');

  // ---------------------------------------------------------------------------
  // Initial Data Fetching Based on Role
  // ---------------------------------------------------------------------------
  // 1. If Faculty: fetch faculty's subjects first
  useEffect(() => {
    if (isFaculty) {
      setLoading(true);
      analyticsService
        .getFacultySubjects()
        .then((subs) => {
          setFacultySubjects(subs || []);
          if (subs && subs.length > 0) {
            setSelectedSubject(subs[0].subject);
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load faculty subjects:', err);
          setError(err.message || 'Failed to load assigned subjects');
          setLoading(false);
        });
    }
  }, [isFaculty]);

  // 2. If Faculty & Subject selected: fetch students taking that subject
  useEffect(() => {
    if (isFaculty && selectedSubject) {
      analyticsService
        .getFacultySubjectStudents(selectedSubject)
        .then((studentsList) => {
          setFacultyStudents(studentsList || []);
          if (studentsList && studentsList.length > 0) {
            setSelectedStudentEnrollment(studentsList[0].enrollment);
          } else {
            setSelectedStudentEnrollment('');
            setPerformanceData(null);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load students for subject:', err);
          setFacultyStudents([]);
        });
    }
  }, [isFaculty, selectedSubject]);

  // 3. Admin Autocomplete Search
  useEffect(() => {
    if (!isAdmin) return;
    if (!adminSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      analyticsService
        .searchStudents(adminSearchQuery.trim())
        .then((data) => {
          setSearchResults(data || []);
          setIsSearching(false);
        })
        .catch(() => {
          setIsSearching(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [adminSearchQuery, isAdmin]);

  // 4. Load Student Performance Analytics
  useEffect(() => {
    let active = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const params = {};

        if (isStudent) {
          // Automatic student view (Backend forces req.user.enrollment)
        } else if (isFaculty) {
          if (!selectedSubject) return;
          params.subject = selectedSubject;
          if (selectedStudentEnrollment) {
            params.enrollment = selectedStudentEnrollment;
          }
        } else if (isAdmin) {
          if (selectedAdminStudent) {
            params.enrollment = selectedAdminStudent.enrollment;
          }
        }

        const data = await analyticsService.getStudentPerformance(params);
        if (active) {
          setPerformanceData(data);
          if (isAdmin && !selectedAdminStudent && data?.student) {
            setSelectedAdminStudent(data.student);
          }
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          console.error('Error loading analytics:', err);
          setError(err.message || 'Failed to load student performance analytics.');
          setLoading(false);
        }
      }
    };

    // Trigger conditions
    if (isStudent) {
      fetchAnalytics();
    } else if (isFaculty && selectedSubject && selectedStudentEnrollment) {
      fetchAnalytics();
    } else if (isAdmin) {
      fetchAnalytics();
    }
  }, [isStudent, isFaculty, isAdmin, selectedSubject, selectedStudentEnrollment, selectedAdminStudent]);

  // ---------------------------------------------------------------------------
  // Filtered Table Data
  // ---------------------------------------------------------------------------
  const filteredMarksTable = useMemo(() => {
    if (!performanceData?.detailedMarks) return [];
    let list = performanceData.detailedMarks;

    if (tableSemesterFilter !== 'ALL') {
      list = list.filter((m) => String(m.semester).toLowerCase() === tableSemesterFilter.toLowerCase());
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.subject || '').toLowerCase().includes(q) ||
          (m.exam || '').toLowerCase().includes(q) ||
          (m.grade || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [performanceData?.detailedMarks, tableSemesterFilter, tableSearch]);

  const distinctSemesters = useMemo(() => {
    if (!performanceData?.detailedMarks) return [];
    return [...new Set(performanceData.detailedMarks.map((m) => m.semester).filter(Boolean))];
  }, [performanceData?.detailedMarks]);

  // ---------------------------------------------------------------------------
  // Custom Recharts Tooltip
  // ---------------------------------------------------------------------------
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 shadow-xl text-xs space-y-1 z-50">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{label}</p>
          <div className="flex items-center justify-between gap-4 text-indigo-600 font-semibold">
            <span>Marks:</span>
            <span>
              {data.marksObtained} / {data.maxMarks} ({data.percentage}%)
            </span>
          </div>
          {data.classAverage !== undefined && (
            <div className="flex items-center justify-between gap-4 text-slate-500 font-medium">
              <span>Class Average:</span>
              <span>{data.classAverage}%</span>
            </div>
          )}
          {data.grade && (
            <div className="flex items-center justify-between gap-4 text-emerald-600 font-semibold">
              <span>Grade:</span>
              <span>{data.grade}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 shadow-xl text-xs space-y-1 z-50">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{data.semester || label}</p>
          <div className="flex items-center justify-between gap-4 text-indigo-600 font-semibold">
            <span>Score:</span>
            <span>{data.percentage}%</span>
          </div>
          {data.totalObtained !== undefined && data.totalMax !== undefined && (
            <div className="flex items-center justify-between gap-4 text-slate-500">
              <span>Aggregate:</span>
              <span>
                {data.totalObtained} / {data.totalMax}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-2 sm:p-4 lg:p-6'}`}>
      {/* ===================================================================== */}
      {/* Header & Role Navigation Bar */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {isStudent ? 'STUDENT PORTAL' : isFaculty ? 'FACULTY EVALUATION' : 'ADMIN CONSOLE'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">Academic Analytics</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Student Performance Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isStudent
                ? 'Your comprehensive academic performance metrics, progress trends, and evaluation history.'
                : isFaculty
                ? 'Evaluate student subject mastery and compare individual performance directly with the class average.'
                : 'Institution-wide student performance intelligence across all academic departments and semesters.'}
            </p>
          </div>

          {/* ADMIN ROLE ONLY: Global Student Search with Autocomplete */}
          {isAdmin && (
            <div className="relative w-full md:w-80">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search student by Name or Enrollment..."
                  value={adminSearchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setAdminSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {isSearching && (
                  <RefreshCw
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 animate-spin"
                  />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchFocused && searchResults.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="p-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Matching Students ({searchResults.length})</span>
                    <span className="text-[9px]">Click to Select</span>
                  </div>
                  {searchResults.map((stu) => (
                    <button
                      key={stu.id || stu.enrollment}
                      type="button"
                      onClick={() => {
                        setSelectedAdminStudent(stu);
                        setAdminSearchQuery(`${stu.name} (${stu.enrollment})`);
                        setSearchFocused(false);
                      }}
                      className="w-full text-left p-3 hover:bg-indigo-50/70 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {stu.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {stu.enrollment} • {stu.department}{stu.semester ? ` (${stu.semester})` : ''}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FACULTY ROLE ONLY: Dropdown to Select Subject & Student Roster Selector */}
        {isFaculty && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
            {/* Subject Selector Dropdown */}
            <div className="w-full md:w-72">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <BookOpen size={13} className="text-indigo-600" />
                Select Taught Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                {facultySubjects.map((sub) => (
                  <option key={sub.subject} value={sub.subject}>
                    {sub.subject} ({sub.department}{sub.semester ? ` • ${sub.semester}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Student Selector Dropdown / Chips */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Users size={13} className="text-indigo-600" />
                Enrolled Students ({facultyStudents.length})
              </label>

              {facultyStudents.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">
                  No student evaluations recorded yet for this subject.
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {facultyStudents.map((st) => {
                    const isSelected = st.enrollment === selectedStudentEnrollment;
                    return (
                      <button
                        key={st.enrollment}
                        type="button"
                        onClick={() => setSelectedStudentEnrollment(st.enrollment)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span>{st.name}</span>
                        <span
                          className={`ml-1.5 font-mono text-[10px] ${
                            isSelected ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          ({st.percentage}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Student Banner (Admin & Faculty Context) */}
        {(isAdmin || isFaculty) && performanceData?.student && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {performanceData.student.name.charAt(0)}
              </div>
              <div>
                <span className="font-bold text-slate-900">{performanceData.student.name}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-mono text-slate-500">
                  Enrollment: {performanceData.student.enrollment}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {performanceData.student.department && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  {performanceData.student.department}
                </span>
              )}
              {performanceData.student.semester && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                  {performanceData.student.semester}
                </span>
              )}
              {performanceData.student.classSection && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[11px]">
                  Section {performanceData.student.classSection}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-xs">
          <RefreshCw size={28} className="mx-auto text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-800">Calculating Performance Analytics...</p>
          <p className="text-xs text-slate-400 mt-1">Aggregating marks and historical semester metrics.</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-6 text-center text-rose-700">
          <AlertCircle size={32} className="mx-auto mb-2 text-rose-500" />
          <h3 className="text-sm font-bold">Unable to Load Analytics</h3>
          <p className="text-xs mt-1 text-rose-600">{error}</p>
        </div>
      ) : performanceData && (!performanceData.detailedMarks || performanceData.detailedMarks.length === 0) ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 sm:p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <GraduationCap size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No performance data available</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            {isStudent
              ? 'No academic evaluations or marks records have been recorded for your account yet. When faculty submits exam results, your performance analytics will appear here.'
              : isFaculty
              ? 'No evaluation marks recorded yet for the selected student in this subject. Use the Marks Entry Grid to record scores.'
              : 'No evaluation marks recorded yet for this student in the database.'}
          </p>
        </div>
      ) : performanceData ? (
        <>
          {/* ================================================================= */}
          {/* 1. TOP ROW: KEY METRIC CARDS */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Overall Percentage / CGPA */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Overall Percentage
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  <Award size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {performanceData.metrics.overallPercentage}%
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                  {performanceData.metrics.cgpa} CGPA
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="font-medium">Total Evaluations:</span>
                <span className="font-bold text-slate-800">
                  {performanceData.metrics.totalEvaluations} records
                </span>
              </div>
            </div>

            {/* Metric 2: Strongest Subject */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Strongest Subject
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg font-bold text-slate-900 truncate" title={performanceData.metrics.strongestSubject.name}>
                  {performanceData.metrics.strongestSubject.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-extrabold text-emerald-600">
                    {performanceData.metrics.strongestSubject.percentage}%
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    Grade {performanceData.metrics.strongestSubject.grade}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="font-medium">Mastery Level:</span>
                <span className="font-bold text-emerald-600">Peak Performance</span>
              </div>
            </div>

            {/* Metric 3: Weakest Subject */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Weakest Subject
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg font-bold text-slate-900 truncate" title={performanceData.metrics.weakestSubject.name}>
                  {performanceData.metrics.weakestSubject.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-extrabold text-amber-600">
                    {performanceData.metrics.weakestSubject.percentage}%
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">
                    Grade {performanceData.metrics.weakestSubject.grade}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="font-medium">Attention Area:</span>
                <span className="font-bold text-amber-600">Needs Focus</span>
              </div>
            </div>

            {/* Metric 4: Total Attendance */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Attendance
                </span>
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shadow-xs">
                  <CalendarCheck size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {performanceData.metrics.attendance.percentage}%
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    performanceData.metrics.attendance.percentage >= 75
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {performanceData.metrics.attendance.percentage >= 75 ? 'Good Standing' : 'At Risk'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="font-medium">Sessions Attended:</span>
                <span className="font-bold text-slate-800">
                  {performanceData.metrics.attendance.attended} /{' '}
                  {performanceData.metrics.attendance.totalSessions} sessions
                </span>
              </div>
            </div>
          </div>

          {/* FACULTY VIEW ONLY: Comparison with Class Average Banner */}
          {isFaculty && performanceData.facultyComparison && (
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    <span>Faculty Subject Comparison</span>
                    <span>•</span>
                    <span>{performanceData.facultyComparison.subject}</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Student Performance vs. Class Average
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Evaluation comparison for {performanceData.student?.name} in your assigned course.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold block">
                      Student Score
                    </span>
                    <span className="text-xl font-black text-white">
                      {performanceData.facultyComparison.studentPercentage}%
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold block">
                      Class Average
                    </span>
                    <span className="text-xl font-black text-indigo-200">
                      {performanceData.facultyComparison.classAveragePercentage}%
                    </span>
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-xl text-center font-bold flex items-center gap-1.5 ${
                      performanceData.facultyComparison.isAboveAverage
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {performanceData.facultyComparison.isAboveAverage ? (
                      <ArrowUpRight size={18} />
                    ) : (
                      <ArrowDownRight size={18} />
                    )}
                    <div>
                      <span className="text-[10px] block uppercase font-semibold">Variance</span>
                      <span className="text-sm font-black">
                        {performanceData.facultyComparison.difference > 0 ? '+' : ''}
                        {performanceData.facultyComparison.difference}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. MIDDLE ROW: VISUAL CHARTS (BAR CHART & LINE GRAPH) */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Bar Chart (Marks Obtained vs. Max Marks for Current Semester) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-indigo-600" />
                    Current Semester Subjects ({performanceData.currentSemester})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Marks Obtained vs. Max Marks per subject evaluation
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                  {performanceData.currentSemesterSubjects?.length || 0} Subjects
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                {performanceData.currentSemesterSubjects &&
                performanceData.currentSemesterSubjects.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceData.currentSemesterSubjects}
                      margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                      />
                      <Bar
                        name="Marks Obtained"
                        dataKey="marksObtained"
                        fill="#4f46e5"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        name="Max Marks"
                        dataKey="maxMarks"
                        fill="#e2e8f0"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Layers size={32} className="opacity-40 mb-2" />
                    <p className="text-xs font-medium">No marks recorded for current semester.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Line Graph (Performance Trend over Past Semesters) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    Academic Performance Trend
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Percentage progression across past semesters and evaluations
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  {performanceData.semesterTrends?.length || 0} Semesters
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                {performanceData.performanceTrend && performanceData.performanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={performanceData.performanceTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="performanceArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <YAxis
                        domain={[40, 100]}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip content={<CustomLineTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#performanceArea)"
                      />
                      <Line
                        type="monotone"
                        name="Performance (%)"
                        dataKey="percentage"
                        stroke="#4f46e5"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#4f46e5' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <TrendingUp size={32} className="opacity-40 mb-2" />
                    <p className="text-xs font-medium">Insufficient trend history.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. BOTTOM ROW: DETAILED MARKS TABLE */}
          {/* ================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap size={16} className="text-indigo-600" />
                  Detailed Academic Marks & Evaluation Grid
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complete breakdown of individual assessments, exams, scores, and verified grades
                </p>
              </div>

              {/* Table Quick Filters */}
              <div className="flex items-center gap-2">
                {/* Semester Filter */}
                <select
                  value={tableSemesterFilter}
                  onChange={(e) => setTableSemesterFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ALL">All Semesters</option>
                  {distinctSemesters.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>

                {/* Search in table */}
                <div className="relative w-44">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Filter subjects..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {filteredMarksTable.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BookOpen size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">No evaluation records match filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-900 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="p-3.5">Subject</th>
                      <th className="p-3.5">Exam Type</th>
                      <th className="p-3.5">Semester</th>
                      <th className="p-3.5 text-center">Attendance</th>
                      <th className="p-3.5 text-center">Marks / Max</th>
                      <th className="p-3.5 text-center">Score (%)</th>
                      <th className="p-3.5 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredMarksTable.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{m.subject}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-200/60">
                            {m.exam}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">{m.semester || '—'}</td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              m.isAbsent
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            }`}
                          >
                            {m.attendanceStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-900 font-mono">
                          {m.isAbsent ? 'AB' : `${m.numericMarks} / ${m.maxMarks}`}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-extrabold text-slate-800">
                              {m.isAbsent ? '0%' : `${m.percentage}%`}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                              m.grade === 'A+' || m.grade === 'A'
                                ? 'bg-emerald-50 text-emerald-700'
                                : m.grade === 'B+' || m.grade === 'B'
                                ? 'bg-indigo-50 text-indigo-700'
                                : m.grade === 'C'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {m.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
