import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { ClipboardList, BarChart3, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import markService from '../../services/markService';
import attendanceService from '../../services/attendanceService';
import BulkMarksEntryGrid from '../../components/BulkMarksEntryGrid';
import StudentPerformanceDashboard from '../../components/analytics/StudentPerformanceDashboard';

export default function TeacherGradebook({ currentUser, marks = [], setMarks, students = [] }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'bulk' | 'history'

  // Fetch assigned subjects for this faculty
  const { data: mySubjects = [] } = useQuery({
    queryKey: ['mySubjects'],
    queryFn: () => attendanceService.getMySubjects()
  });

  // Fetch marks for history tab
  const { data: dbMarks = [] } = useQuery({
    queryKey: ['marks'],
    queryFn: () => markService.getMarks()
  });
  const rawMarks = Array.isArray(dbMarks) ? dbMarks : [];

  // Filter marks for this faculty's subjects or enteredBy
  const mySubjectNames = mySubjects.map((s) => (s.subject || '').toLowerCase());
  const activeMarks = rawMarks.filter((m) => {
    if (mySubjectNames.length === 0) return true;
    return (
      mySubjectNames.includes((m.subject || '').toLowerCase()) ||
      m.enteredBy === currentUser?.name
    );
  });

  // Marks List Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalFilteredMarks = activeMarks.length;
  const totalPages = Math.ceil(totalFilteredMarks / pageSize) || 1;

  const paginatedMarks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeMarks.slice(start, start + pageSize);
  }, [activeMarks, currentPage, pageSize]);

  return (
    <Layout role="teacher" currentUser={currentUser}>
      {/* Clean Tab Switcher */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 border border-slate-200 hover:bg-gray-100'
            }`}
          >
            <BarChart3 size={14} />
            Performance Analytics
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 border border-slate-200 hover:bg-gray-100'
            }`}
          >
            <Edit3 size={14} />
            Marks Entry Grid
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 border border-slate-200 hover:bg-gray-100'
            }`}
          >
            <ClipboardList size={14} />
            Saved Records ({activeMarks.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'analytics' ? (
        <StudentPerformanceDashboard
          role="faculty"
          currentUser={currentUser}
          embedded={true}
        />
      ) : activeTab === 'bulk' ? (
        <BulkMarksEntryGrid
          currentUser={currentUser}
          role="faculty"
          onMarksSaved={() => {}}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList size={18} className="text-indigo-600" />
              Historical Evaluation Records
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              Showing marks recorded across your assigned classes
            </span>
          </div>

          {activeMarks.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-2 opacity-40 text-gray-400" />
              <p className="text-sm font-bold text-gray-700">No marks recorded yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Switch to the Marks Entry Grid to enter and submit marks.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Enrollment No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Exam Type</th>
                    <th className="p-3 text-center">Score / Max</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Entered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {paginatedMarks.map((m) => (
                    <tr key={m._id || m.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-gray-900">
                        {m.enrollment || '—'}
                      </td>
                      <td className="p-3 font-semibold text-gray-900">{m.student}</td>
                      <td className="p-3 text-gray-600">{m.department || '—'}</td>
                      <td className="p-3">{m.subject}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
                          {m.exam}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-indigo-600">
                        {m.score}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 font-bold text-gray-800 text-[11px]">
                          {m.grade || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{m.enteredBy || 'Faculty'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalFilteredMarks > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs mt-2">
                  <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <span>
                      Showing <strong className="text-gray-800 font-bold">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                      <strong className="text-gray-800 font-bold">{Math.min(currentPage * pageSize, totalFilteredMarks)}</strong> of{' '}
                      <strong className="text-gray-800 font-bold">{totalFilteredMarks}</strong> records
                    </span>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none"
                      >
                        {[5, 10, 20, 50].map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-center sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className={`px-3 py-1 rounded-xl border flex items-center gap-1 font-semibold transition-all ${
                        currentPage <= 1
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                          : 'border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>

                    <span className="text-xs font-bold text-gray-700 px-2">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className={`px-3 py-1 rounded-xl border flex items-center gap-1 font-semibold transition-all ${
                        currentPage >= totalPages
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                          : 'border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
