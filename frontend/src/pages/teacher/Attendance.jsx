import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import {
  Save,
  CheckCircle2,
  XCircle,
  Calendar,
  BookOpen,
  Users,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
  GraduationCap
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';

export default function TeacherAttendance({ currentUser }) {
  const queryClient = useQueryClient();

  const getTodayIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
  };

  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [date, setDate] = useState(getTodayIST());
  const [lectureTopic, setLectureTopic] = useState('');
  const [roster, setRoster] = useState([]);
  const [isExisting, setIsExisting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // 1. Fetch assigned subjects for this faculty member
  const { data: mySubjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['mySubjects'],
    queryFn: () => attendanceService.getMySubjects()
  });

  // Automatically select first assigned subject when loaded
  useEffect(() => {
    if (mySubjects.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(mySubjects[0]._id);
    }
  }, [mySubjects, selectedAssignmentId]);

  const selectedAssignment = mySubjects.find((s) => s._id === selectedAssignmentId) || null;

  // 2. Fetch Roster when assignmentId or date changes
  const {
    data: rosterData,
    isLoading: isLoadingRoster,
    refetch: refetchRoster
  } = useQuery({
    queryKey: ['subjectRoster', selectedAssignmentId, date],
    queryFn: () => attendanceService.getSubjectRoster(selectedAssignmentId, date),
    enabled: !!selectedAssignmentId && !!date
  });

  // Sync loaded roster to local state for fast interactive editing
  useEffect(() => {
    if (rosterData && Array.isArray(rosterData.roster)) {
      setRoster(rosterData.roster);
      setIsExisting(Boolean(rosterData.isExisting));
      setLectureTopic(rosterData.session?.lectureTopic || '');
      setSaveSuccess('');
      setSaveError('');
    }
  }, [rosterData]);

  // 3. Mutation to Save Attendance Session
  const saveMutation = useMutation({
    mutationFn: (payload) => attendanceService.saveAttendanceSession(payload),
    onSuccess: (res) => {
      setSaveSuccess(
        isExisting
          ? 'Attendance record updated successfully!'
          : 'Attendance session recorded successfully!'
      );
      setSaveError('');
      setIsExisting(true);
      queryClient.invalidateQueries({ queryKey: ['subjectRoster', selectedAssignmentId, date] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setTimeout(() => setSaveSuccess(''), 5000);
    },
    onError: (err) => {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save attendance.');
      setSaveSuccess('');
    }
  });

  // Toggle individual student status
  const handleToggleStatus = (enrollment, newStatus) => {
    setRoster((prev) =>
      prev.map((s) =>
        s.enrollment === enrollment ? { ...s, status: newStatus } : s
      )
    );
  };

  // Bulk actions
  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'Present' })));
  };

  const handleMarkAllAbsent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'Absent' })));
  };

  // Handle Save
  const handleSaveAttendance = (e) => {
    e.preventDefault();
    if (!selectedAssignmentId) {
      setSaveError('Please select a subject first.');
      return;
    }
    if (!date) {
      setSaveError('Please select a valid date.');
      return;
    }
    if (roster.length === 0) {
      setSaveError('No students found in the roster to mark attendance for.');
      return;
    }

    saveMutation.mutate({
      assignmentId: selectedAssignmentId,
      date,
      lectureTopic: lectureTopic.trim(),
      records: roster.map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName,
        enrollment: s.enrollment,
        status: s.status
      }))
    });
  };

  // Computed stats
  const totalStudents = roster.length;
  const presentCount = roster.filter((s) => s.status === 'Present').length;
  const absentCount = roster.filter((s) => s.status === 'Absent').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
    <Layout role="teacher" currentUser={currentUser}>
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Daily Attendance Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Mark and record daily class attendance for your assigned subjects and semester groups.
          </p>
        </div>

        {selectedAssignment && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
              <BookOpen size={14} /> {selectedAssignment.subject}
            </span>
            <span className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
              <GraduationCap size={14} /> Sem {selectedAssignment.semester} ({selectedAssignment.department})
            </span>
          </div>
        )}
      </div>

      {/* Control Card: Step 1 (Subject), Step 2 (Auto-Dept/Sem), Step 3 (Date) */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-sm mb-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* STEP 1: Select Subject */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-600" />
              1. Select Assigned Subject *
            </label>
            {isLoadingSubjects ? (
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-400">
                Loading assigned subjects...
              </div>
            ) : mySubjects.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                No subjects assigned to your faculty profile.
              </div>
            ) : (
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {mySubjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.subject} ({s.department} - Sem {s.semester})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* STEP 2: Automatic Structure Information */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-purple-600" />
              2. Target Structure (Auto-Resolved)
            </label>
            <div className="px-4 py-2.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs font-semibold text-purple-900 flex items-center justify-between">
              <div>
                <span>Dept: <strong>{selectedAssignment?.department || '—'}</strong></span>
                <span className="mx-2">•</span>
                <span>Sem: <strong>{selectedAssignment?.semester ? `Semester ${selectedAssignment.semester}` : '—'}</strong></span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-purple-200/60 text-purple-800 rounded-md">
                {selectedAssignment?.classSection || 'General Section'}
              </span>
            </div>
          </div>

          {/* STEP 3: Select Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-600" />
              3. Lecture Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Optional Topic & Status indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="w-full sm:w-1/2">
            <input
              type="text"
              value={lectureTopic}
              onChange={(e) => setLectureTopic(e.target.value)}
              placeholder="Lecture Topic / Module (Optional e.g. React Hooks & Context API)"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-3">
            {isExisting ? (
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Clock size={13} /> Recorded Session (Editing)
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Clock size={13} /> New Daily Attendance
              </span>
            )}

            <button
              type="button"
              onClick={() => refetchRoster()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Refresh Roster"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Statistics & Quick Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-medium block">Total Enrolled</span>
            <span className="text-2xl font-black text-gray-900 mt-0.5 block">{totalStudents}</span>
            <span className="text-[10px] text-gray-400">{selectedAssignment?.department} Sem {selectedAssignment?.semester}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 font-medium block">Present Count</span>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block">{presentCount}</span>
            <span className="text-[10px] text-emerald-600">{attendanceRate}% of class</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-red-700 font-medium block">Absent Count</span>
            <span className="text-2xl font-black text-red-900 mt-0.5 block">{absentCount}</span>
            <span className="text-[10px] text-red-600">{totalStudents - presentCount} students absent</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={13} /> Mark All Present
          </button>
          <button
            type="button"
            onClick={handleMarkAllAbsent}
            className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle size={13} /> Mark All Absent
          </button>
        </div>
      </div>

      {/* Success & Error Banners */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" /> {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm animate-in fade-in">
          <AlertCircle size={16} className="text-red-600" /> {saveError}
        </div>
      )}

      {/* Student Roster Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              Enrolled Student Roster ({roster.length} Students)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Only students enrolled in <strong>{selectedAssignment?.department}</strong>, <strong>Semester {selectedAssignment?.semester}</strong> are listed.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={saveMutation.isPending || roster.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Save size={15} />
            {saveMutation.isPending
              ? 'Saving...'
              : isExisting
              ? 'Update Attendance'
              : 'Save Attendance'}
          </button>
        </div>

        {isLoadingRoster ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading authorized student roster from MongoDB...
          </div>
        ) : roster.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-100">
            <Users size={36} className="mx-auto mb-2 opacity-40 text-indigo-500" />
            <p className="text-sm font-bold text-gray-700">No students found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              There are no students enrolled in department &quot;{selectedAssignment?.department}&quot; and semester &quot;{selectedAssignment?.semester}&quot; in MongoDB.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="min-w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50/90 text-gray-900 font-bold border-b border-gray-200/80">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Enrollment No.</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Semester</th>
                  <th className="p-3.5 text-center">Today&apos;s Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {roster.map((student, idx) => {
                  const isPresent = student.status === 'Present';
                  return (
                    <tr
                      key={student.enrollment || student.studentId}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        !isPresent ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center text-gray-400 font-mono">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-gray-900">{student.studentName}</td>
                      <td className="p-3.5 font-mono text-gray-600">{student.enrollment}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded-md text-[11px]">
                          {student.department}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold rounded-md text-[11px]">
                          Sem {student.semester}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex rounded-xl bg-gray-100 p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student.enrollment, 'Present')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            <CheckCircle2 size={12} /> Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student.enrollment, 'Absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              !isPresent
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            <XCircle size={12} /> Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Action */}
        {roster.length > 0 && (
          <div className="flex justify-end pt-5 border-t border-gray-100 mt-5">
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Save size={15} />
              {saveMutation.isPending
                ? 'Saving...'
                : isExisting
                ? 'Update Attendance Record'
                : 'Save Attendance Record'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
