import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  BookOpen,
  User,
  Clock,
  ArrowLeft,
  ChevronRight,
  Percent,
  SlidersHorizontal,
  Search,
  RefreshCw
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';

export default function StudentAttendance({ currentUser, setCurrentUser }) {
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(null);
  const [search, setSearch] = useState('');

  // Fetch student's real MongoDB subject-wise attendance summary & daily records
  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['myAttendance', currentUser?.enrollment],
    queryFn: () => attendanceService.getMyAttendance(),
    enabled: !!currentUser
  });

  const summary = attendanceData?.summary || [];
  const overallStats = attendanceData?.overallStats || {
    totalConducted: 0,
    totalAttended: 0,
    totalMissed: 0,
    overallPercentage: '0.00%'
  };

  const studentInfo = attendanceData?.student || {
    name: currentUser?.name || 'Student',
    enrollment: currentUser?.enrollment || '',
    department: currentUser?.department || currentUser?.course || '',
    semester: currentUser?.semester || ''
  };

  // Find currently selected subject details
  const activeSubjectDetail = summary.find(
    (s) => s.subject.toLowerCase() === (selectedSubjectKey || '').toLowerCase()
  );

  const filteredSummary = summary.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.subject.toLowerCase().includes(q) || (s.facultyName || '').toLowerCase().includes(q);
  });

  const getPercentageColor = (pctNum) => {
    if (pctNum >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (pctNum >= 60) return 'text-amber-800 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getProgressBarColor = (pctNum) => {
    if (pctNum >= 75) return 'bg-emerald-500';
    if (pctNum >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Layout role="student" currentUser={currentUser} setCurrentUser={setCurrentUser}>
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              ATTENDANCE PORTAL
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
              {studentInfo.department} • Semester {studentInfo.semester}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            My Course Attendance
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Subject-wise attendance tracking and lecture session log for{' '}
            <strong>{studentInfo.name}</strong> ({studentInfo.enrollment}).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedSubjectKey && (
            <button
              onClick={() => setSelectedSubjectKey(null)}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back to All Subjects
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-indigo-600 rounded-xl shadow-sm transition-all"
            title="Refresh Attendance"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium block">Overall Attendance</span>
            <span className="text-3xl font-black text-indigo-900 mt-1 block">
              {overallStats.overallPercentage}
            </span>
            <span className="text-[10px] text-gray-400">Institution standard: &gt;= 75%</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Percent size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium block">Total Lectures</span>
            <span className="text-3xl font-black text-gray-900 mt-1 block">
              {overallStats.totalConducted}
            </span>
            <span className="text-[10px] text-gray-400">Across all registered subjects</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center">
            <BookOpen size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 font-medium block">Present Sessions</span>
            <span className="text-3xl font-black text-emerald-900 mt-1 block">
              {overallStats.totalAttended}
            </span>
            <span className="text-[10px] text-emerald-600">Attended classes</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-red-700 font-medium block">Absent Sessions</span>
            <span className="text-3xl font-black text-red-900 mt-1 block">
              {overallStats.totalMissed}
            </span>
            <span className="text-[10px] text-red-600">Missed lectures</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-400 text-xs bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm">
          <div className="animate-spin w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
          Fetching your real-time attendance records from MongoDB...
        </div>
      ) : activeSubjectDetail ? (
        /* ========================================================================= */
        /* VIEW 2: DAILY ATTENDANCE DETAILS FOR SELECTED SUBJECT                     */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Subject Detail Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md uppercase">
                    {activeSubjectDetail.department}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                    Semester {activeSubjectDetail.semester}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-gray-900">{activeSubjectDetail.subject}</h2>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <User size={13} className="text-indigo-600" />
                  Faculty In-Charge: <strong>{activeSubjectDetail.facultyName || 'Faculty'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center px-4">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Total</span>
                  <span className="text-xl font-black text-gray-900">{activeSubjectDetail.totalLectures}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center px-4">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Present</span>
                  <span className="text-xl font-black text-emerald-900">{activeSubjectDetail.present}</span>
                </div>
                <div className="p-3 bg-red-50 rounded-2xl border border-red-100 text-center px-4">
                  <span className="text-[10px] text-red-700 font-bold uppercase block">Absent</span>
                  <span className="text-xl font-black text-red-900">{activeSubjectDetail.absent}</span>
                </div>
                <div
                  className={`p-3 rounded-2xl border text-center px-4 ${getPercentageColor(
                    activeSubjectDetail.percentageNumber
                  )}`}
                >
                  <span className="text-[10px] font-bold uppercase block">Percentage</span>
                  <span className="text-xl font-black">{activeSubjectDetail.percentage}</span>
                </div>
              </div>
            </div>

            {/* Daily History Table */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={15} className="text-indigo-600" />
                Daily Lecture Attendance Log ({activeSubjectDetail.dailyHistory.length} Sessions)
              </h3>

              {activeSubjectDetail.dailyHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-100">
                  <Clock size={32} className="mx-auto mb-2 opacity-40 text-indigo-500" />
                  <p className="text-sm font-bold text-gray-700">No lecture sessions recorded yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    When {activeSubjectDetail.facultyName} takes daily attendance for {activeSubjectDetail.subject}, records will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="min-w-full text-left text-xs text-gray-700">
                    <thead className="bg-gray-50/90 text-gray-900 font-bold border-b border-gray-200/80">
                      <tr>
                        <th className="p-3.5 w-12 text-center">#</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Lecture Session</th>
                        <th className="p-3.5">Marked By</th>
                        <th className="p-3.5 text-center">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {activeSubjectDetail.dailyHistory.map((item, idx) => {
                        const isPresent = item.status === 'Present';
                        return (
                          <tr
                            key={item.id || `${item.date}-${idx}`}
                            className={`hover:bg-gray-50/80 transition-colors ${
                              !isPresent ? 'bg-red-50/20' : ''
                            }`}
                          >
                            <td className="p-3.5 text-center text-gray-400 font-mono">{idx + 1}</td>
                            <td className="p-3.5 font-bold text-gray-900">{item.date}</td>
                            <td className="p-3.5 text-indigo-600 font-semibold">{item.lecture}</td>
                            <td className="p-3.5 text-gray-600">{item.markedBy || activeSubjectDetail.facultyName}</td>
                            <td className="p-3.5 text-center">
                              {isPresent ? (
                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1.5 shadow-sm">
                                  <CheckCircle2 size={12} /> Present
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 inline-flex items-center gap-1.5 shadow-sm">
                                  <XCircle size={12} /> Absent
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 1: SUBJECT-WISE SUMMARY TABLE                                        */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                Semester {studentInfo.semester} Subject-wise Attendance
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Click on any subject to view its full daily lecture history and dates.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject or faculty..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {filteredSummary.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-100">
              <SlidersHorizontal size={36} className="mx-auto mb-2 opacity-40 text-indigo-500" />
              <p className="text-sm font-bold text-gray-700">No subjects found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No subjects are currently mapped for department &quot;{studentInfo.department}&quot; and semester &quot;{studentInfo.semester}&quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="min-w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50/90 text-gray-900 font-bold border-b border-gray-200/80">
                  <tr>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Assigned Faculty</th>
                    <th className="p-3.5 text-center">Total Lectures</th>
                    <th className="p-3.5 text-center">Present</th>
                    <th className="p-3.5 text-center">Absent</th>
                    <th className="p-3.5">Attendance %</th>
                    <th className="p-3.5 text-right">Daily Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredSummary.map((item) => {
                    const pctColor = getPercentageColor(item.percentageNumber);
                    const barColor = getProgressBarColor(item.percentageNumber);
                    return (
                      <tr
                        key={item.subject}
                        onClick={() => setSelectedSubjectKey(item.subject)}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5">
                          <span className="font-extrabold text-gray-900 text-sm block group-hover:text-indigo-600 transition-colors">
                            {item.subject}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {item.department} • Sem {item.semester}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-gray-800">
                          {item.facultyName || 'Faculty'}
                        </td>
                        <td className="p-3.5 text-center font-bold text-gray-900">
                          {item.totalLectures}
                        </td>
                        <td className="p-3.5 text-center font-bold text-emerald-700">
                          {item.present}
                        </td>
                        <td className="p-3.5 text-center font-bold text-red-700">
                          {item.absent}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${pctColor}`}
                            >
                              {item.percentage}
                            </span>
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, item.percentageNumber))}%`
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                            View Daily Log <ChevronRight size={14} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
