import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  Calendar,
  Layers,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { DEPARTMENT_OPTIONS } from '../../constants/departments';

export default function AdminAttendance({ currentUser, facultyList = [], subjectsList = [] }) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('mappings'); // 'mappings' | 'records'
  const [selectedAssignmentForRoster, setSelectedAssignmentForRoster] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter states for attendance records
  const [deptFilter, setDeptFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Form state for creating new Faculty-Subject Mapping
  const [newFacId, setNewFacId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDept, setNewDept] = useState('AIML');
  const [newSemester, setNewSemester] = useState('7');
  const [newSection, setNewSection] = useState('Section A');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // 1. Fetch All Academic Faculty-Subject Mappings
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments
  } = useQuery({
    queryKey: ['adminAcademicAssignments'],
    queryFn: () => attendanceService.getAllAssignments()
  });

  // 2. Fetch All Institution-Wide Attendance Records
  const {
    data: attendanceRecords = [],
    isLoading: isLoadingRecords,
    refetch: refetchRecords
  } = useQuery({
    queryKey: ['adminAttendanceRecords', deptFilter, subjectFilter, dateFilter],
    queryFn: () =>
      attendanceService.getAttendance({
        department: deptFilter || undefined,
        subject: subjectFilter || undefined,
        date: dateFilter || undefined
      })
  });

  // 3. Fetch Roster when an assignment is selected for inspection
  const {
    data: rosterData,
    isLoading: isLoadingRoster
  } = useQuery({
    queryKey: ['adminSubjectRoster', selectedAssignmentForRoster?._id],
    queryFn: () => attendanceService.getSubjectRoster(selectedAssignmentForRoster._id),
    enabled: !!selectedAssignmentForRoster?._id
  });

  // Mutation: Create Faculty Assignment
  const createAssignmentMutation = useMutation({
    mutationFn: (data) => attendanceService.createFacultyAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAcademicAssignments'] });
      setFormSuccess('Faculty subject mapping assigned successfully!');
      setTimeout(() => {
        setFormSuccess('');
        setIsCreateModalOpen(false);
      }, 1500);
      setNewFacId('');
      setNewSubject('');
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || err.message || 'Failed to create assignment.');
    }
  });

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!newFacId) {
      setFormError('Please select a faculty member.');
      return;
    }
    if (!newSubject.trim()) {
      setFormError('Please provide a subject name.');
      return;
    }
    if (!newDept) {
      setFormError('Please select a department.');
      return;
    }
    if (!newSemester) {
      setFormError('Please select a semester.');
      return;
    }

    const selectedFacultyObj = facultyList.find((f) => (f._id || f.id) === newFacId);

    createAssignmentMutation.mutate({
      facultyId: newFacId,
      facultyName: selectedFacultyObj ? selectedFacultyObj.name : '',
      subject: newSubject.trim(),
      department: newDept,
      semester: Number(newSemester),
      classSection: newSection.trim() || `${newDept} - Sem ${newSemester}`
    });
  };

  // Filter attendance records
  const filteredRecords = attendanceRecords.filter((rec) => {
    if (statusFilter && rec.status !== statusFilter) return false;
    if (searchStudent) {
      const q = searchStudent.toLowerCase();
      const matchName = (rec.student || '').toLowerCase().includes(q);
      const matchEnroll = (rec.enrollment || '').toLowerCase().includes(q);
      if (!matchName && !matchEnroll) return false;
    }
    return true;
  });

  const totalPresent = filteredRecords.filter((r) => r.status === 'Present').length;
  const totalAbsent = filteredRecords.filter((r) => r.status === 'Absent').length;
  const attendanceRate =
    filteredRecords.length > 0
      ? ((totalPresent / filteredRecords.length) * 100).toFixed(1) + '%'
      : '0.0%';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              ADMINISTRATION PORTAL
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
              ACADEMIC STRUCTURE & ATTENDANCE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Academic Mapping & Attendance
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Supervise Faculty → Subject → Semester → Department relationships and institution-wide attendance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Assign Faculty to Subject
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('mappings')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'mappings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers size={16} /> Academic Subject Mappings ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'records'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar size={16} /> Institution Attendance Records ({attendanceRecords.length})
        </button>
      </div>

      {/* TAB 1: ACADEMIC MAPPINGS */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Faculty → Subject Mappings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Every faculty member is authorized ONLY for their assigned subjects and matching student rosters.
                </p>
              </div>
              <button
                onClick={() => refetchAssignments()}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors self-start sm:self-auto"
                title="Refresh mappings"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            {isLoadingAssignments ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Loading academic assignments from MongoDB...
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <BookOpen size={36} className="mx-auto mb-2 opacity-50 text-indigo-600" />
                <p className="text-sm font-semibold text-gray-700">No academic mappings found.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click "Assign Faculty to Subject" above to configure your first faculty-subject mapping.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">Faculty Member</th>
                      <th className="p-3.5">Subject</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Semester</th>
                      <th className="p-3.5">Class/Section</th>
                      <th className="p-3.5 text-right">Student Roster</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {assignments.map((asg) => (
                      <tr key={asg._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {asg.facultyName ? asg.facultyName.charAt(0) : 'F'}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block">{asg.facultyName}</span>
                              <span className="text-[10px] text-gray-400 block font-mono">
                                @{asg.facultyUsername || 'faculty'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-gray-900">{asg.subject}</span>
                          {asg.subjectCode && (
                            <span className="text-[10px] text-gray-400 block font-mono">
                              {asg.subjectCode}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px]">
                            {asg.department}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-gray-800">Semester {asg.semester}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-gray-600">{asg.classSection || 'Regular'}</span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedAssignmentForRoster(asg)}
                            className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                          >
                            <Eye size={13} /> View Enrolled Students
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-500 font-medium block">Total Recorded Logs</span>
              <span className="text-2xl font-black text-gray-900 mt-1 block">{filteredRecords.length}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-emerald-600 font-medium block">Present Marks</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{totalPresent}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-red-600 font-medium block">Absent Marks</span>
              <span className="text-2xl font-black text-red-700 mt-1 block">{totalAbsent}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-indigo-600 font-medium block">Overall Attendance Rate</span>
              <span className="text-2xl font-black text-indigo-700 mt-1 block">{attendanceRate}</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search student / enrollment..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">All Subjects</option>
                  {subjectsList.map((s) => {
                    const name = s.name || s.title || s;
                    return (
                      <option key={s._id || s.id || name} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
                <button
                  onClick={() => refetchRecords()}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl transition-colors shrink-0"
                  title="Refresh records"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {/* Table */}
            {isLoadingRecords ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Loading attendance records from MongoDB...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Calendar size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-gray-700">No attendance logs matching criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Enrollment</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Dept & Sem</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredRecords.map((r) => (
                      <tr key={r._id || r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-bold text-gray-900">{r.student}</td>
                        <td className="p-3 font-mono text-gray-600 font-bold">{r.enrollment}</td>
                        <td className="p-3 font-semibold text-gray-800">{r.subject}</td>
                        <td className="p-3">
                          <span className="text-gray-600">
                            {r.department || 'AIML'} • Sem {r.semester || '7'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 font-mono">{r.date}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                              r.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.status === 'Present' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 font-medium">
                          {r.markedBy || 'Faculty'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIEW STUDENT ROSTER FOR ACADEMIC MAPPING */}
      {selectedAssignmentForRoster && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-md">
                    OFFICIAL STUDENT ROSTER
                  </span>
                  <span className="text-xs font-bold text-indigo-700">
                    {selectedAssignmentForRoster.department} • Semester {selectedAssignmentForRoster.semester}
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  {selectedAssignmentForRoster.subject} Roster
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Authorized Faculty: <strong>{selectedAssignmentForRoster.facultyName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentForRoster(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {isLoadingRoster ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  Retrieving students enrolled in {selectedAssignmentForRoster.department} Semester {selectedAssignmentForRoster.semester}...
                </div>
              ) : !rosterData?.students || rosterData.students.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-gray-700">
                    No students currently enrolled in {selectedAssignmentForRoster.department} Semester {selectedAssignmentForRoster.semester}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-bold px-1">
                    <span>Enrolled Students ({rosterData.students.length})</span>
                    <span>Target Cohort: {selectedAssignmentForRoster.department} Sem {selectedAssignmentForRoster.semester}</span>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-gray-700">
                      <thead className="bg-gray-50 font-bold text-gray-900 border-b border-gray-100 text-[11px]">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Enrollment No.</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Semester</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {rosterData.students.map((st, idx) => (
                          <tr key={st._id} className="hover:bg-gray-50">
                            <td className="p-3 text-gray-400 font-mono">{idx + 1}</td>
                            <td className="p-3 font-bold text-gray-900">{st.name}</td>
                            <td className="p-3 font-mono font-bold text-indigo-600">{st.enrollment}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                                {st.department}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-gray-700">Sem {st.semester}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedAssignmentForRoster(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN FACULTY TO SUBJECT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" /> Assign Faculty to Subject
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Faculty Member *
                </label>
                <select
                  value={newFacId}
                  onChange={(e) => setNewFacId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Choose Faculty --</option>
                  {facultyList.map((f) => (
                    <option key={f._id || f.id} value={f._id || f.id}>
                      {f.name} ({f.username || f.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MERN, Machine Learning, Cloud Computing"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Semester (1-8) *
                  </label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Class / Section Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Section A or AIML - Sem 7"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAssignmentMutation.isLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {createAssignmentMutation.isLoading ? 'Assigning...' : 'Save Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
