import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, GraduationCap, ArrowLeft, Plus, ChevronRight } from 'lucide-react';

export default function DirectoryTabs({
  studentCount = 0,
  facultyCount = 0,
  isFormOpen = false,
  onToggleForm,
  formButtonText
}) {
  const location = useLocation();
  const isStudents = location.pathname === '/admin/students';
  const isFaculty = location.pathname === '/admin/faculty';

  return (
    <div className="mb-6 space-y-4">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors font-semibold"
          >
            <ArrowLeft size={14} />
            <span>Overview</span>
          </Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-400">People Management</span>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-bold">
            {isStudents ? 'Student Directory & Insights' : 'Faculty Directory'}
          </span>
        </div>

        {onToggleForm && (
          <button
            type="button"
            onClick={onToggleForm}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 shadow-xs ${
              isFormOpen
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 shadow-md'
            }`}
          >
            <Plus size={15} className={`transition-transform duration-200 ${isFormOpen ? 'rotate-45' : ''}`} />
            <span>{isFormOpen ? 'Close Form' : formButtonText || (isStudents ? 'Add Student' : 'Add Faculty')}</span>
          </button>
        )}
      </div>

      {/* Primary Section Title & Distinct Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
              Directory Hub
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Academic Year 2025–2026
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {isStudents ? 'Student Directory & Insights' : 'Faculty Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isStudents
              ? 'Real-time aggregation insights by department, semester, and division with dynamic student filtering.'
              : 'Complete directory of verified professors, lecturers, and departmental role assignments.'}
          </p>
        </div>

        {/* Clear Primary Tabs Navigation */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 self-start md:self-auto">
          {/* Students Tab */}
          <Link
            to="/admin/students"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
              isStudents
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users size={16} className={isStudents ? 'text-white' : 'text-slate-500'} />
            <span>Student Directory</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                isStudents
                  ? 'bg-indigo-500/80 text-white ring-1 ring-white/20'
                  : 'bg-slate-200/90 text-slate-700'
              }`}
            >
              {studentCount}
            </span>
          </Link>

          {/* Faculty Tab */}
          <Link
            to="/admin/faculty"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
              isFaculty
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <GraduationCap size={16} className={isFaculty ? 'text-white' : 'text-slate-500'} />
            <span>Faculty Directory</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                isFaculty
                  ? 'bg-indigo-500/80 text-white ring-1 ring-white/20'
                  : 'bg-slate-200/90 text-slate-700'
              }`}
            >
              {facultyCount}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
