import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { Users, BookOpen, Clock, ArrowRight, Plus, Megaphone, FileText, ClipboardList } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { TARGET_DEPARTMENT_OPTIONS } from '../../constants/departments';
import timetableService from '../../services/timetableService';
import noticeService from '../../services/noticeService';
import announcementService from '../../services/announcementService';
import assignmentService from '../../services/assignmentService';
import attendanceService from '../../services/attendanceService';
import authService from '../../services/authService';
import { getVisibleNotices, getVisibleAnnouncements } from '../../utils/visibility';
import WeeklyTimetableGrid from '../../components/WeeklyTimetableGrid';
import { generateWeeklyTimetablePDF } from '../../utils/timetablePdfGenerator';
import ExpirationPicker from '../../components/ExpirationPicker';

export default function TeacherDashboard({
  currentUser,
  setCurrentUser,
  notices = [],
  setNotices = () => {},
  announcements = [],
  setAnnouncements = () => {},
  classes = [],
  students = [],
  materials = [],
  assignments = [],
  attendance = [],
  marks = [],
  timetables = [],
  sentTimetables = []
}) {
  const location = useLocation();
  const path = location.pathname;
  const facultyName = currentUser?.name || 'Faculty Member';
  const facultyDepartment = currentUser?.department || '';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [audience, setAudience] = useState('Students & Faculty');
  const [targetType, setTargetType] = useState('department'); // 'all' | 'department' | 'individual'
  const [targetDepartment, setTargetDepartment] = useState(facultyDepartment || 'AIML');
  const [targetStudentEnrollment, setTargetStudentEnrollment] = useState('');
  const [content, setContent] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  // React Query: Fetch notices from MongoDB
  const { data: dbNotices = [] } = useQuery({
    queryKey: ['notices', facultyDepartment],
    queryFn: () => noticeService.getNotices({ department: facultyDepartment }),
    initialData: notices
  });
  const activeNotices = dbNotices.length > 0 ? dbNotices : notices;

  // React Query: Fetch announcements from MongoDB
  const { data: dbAnnouncements = [] } = useQuery({
    queryKey: ['announcements', facultyDepartment],
    queryFn: () => announcementService.getAnnouncements(),
    initialData: announcements
  });
  const activeAnnouncements = Array.isArray(dbAnnouncements) && dbAnnouncements.length > 0 ? dbAnnouncements : announcements;
  const visibleAnnouncements = getVisibleAnnouncements(activeAnnouncements, currentUser);

  // React Query: Fetch assignments from MongoDB
  const { data: dbAssignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentService.getAssignments()
  });
  const activeAssignments = dbAssignments.length > 0 ? dbAssignments : assignments;

  // React Query: Fetch assigned subjects for this faculty
  const { data: mySubjects = [] } = useQuery({
    queryKey: ['mySubjects'],
    queryFn: () => attendanceService.getMySubjects()
  });

  // React Query: Fetch mapped students for this faculty
  const { data: myStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => authService.getStudents()
  });
  const activeStudents = Array.isArray(myStudents) ? myStudents : [];

  const createNoticeMutation = useMutation({
    mutationFn: (data) => noticeService.createNotice(data),
    onSuccess: (newNotice) => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      if (setNotices) setNotices(prev => [newNotice, ...prev]);
      setTitle('');
      setCategory('');
      setTargetStudentEnrollment('');
      setContent('');
      setExpiresAt('');
      setErrors({});
      setSuccess('Announcement published successfully!');
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to publish announcement.');
    }
  });

  const handleAddNotice = (e) => {
    e.preventDefault();
    const errs = {};
    if (!title.trim()) errs.title = 'Notice title is required.';
    if (!category) errs.category = 'Please select category.';
    if (targetType === 'individual' && !targetStudentEnrollment.trim()) {
      errs.targetStudentEnrollment = 'Student enrollment is required for individual target.';
    }
    if (targetType === 'department' && !targetDepartment) {
      errs.targetDepartment = 'Please select a target department.';
    }
    if (!content.trim()) errs.content = 'Notice content is required.';
    if (!expiresAt) {
      errs.expiresAt = 'Expiration date & time is mandatory.';
    } else {
      const exp = new Date(expiresAt);
      if (isNaN(exp.getTime()) || exp <= new Date()) {
        errs.expiresAt = 'Expiration time must be set in the future.';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setSuccess('');
      return;
    }

    const resolvedEnrollment = targetType === 'individual' ? targetStudentEnrollment.trim() : '';

    createNoticeMutation.mutate({
      title: title.trim(),
      category,
      audience: audience || 'Everyone',
      targetType,
      targetDepartment: targetType === 'all' ? 'All Departments' : targetDepartment,
      targetStudentEnrollment: resolvedEnrollment,
      student: resolvedEnrollment,
      content: content.trim(),
      postedBy: facultyName,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
    });
  };

  const facultyUsername = currentUser?.username || '';

  // React Query: Fetch latest sent timetable or dynamic slots from MongoDB
  const { data: dbMyTimetable } = useQuery({
    queryKey: ['myTimetable', facultyDepartment, 'teacher', facultyName, facultyUsername],
    queryFn: () => timetableService.getMyTimetable(facultyDepartment, 'teacher', {
      facultyName: facultyName,
      username: facultyUsername
    }),
    enabled: !!facultyDepartment
  });

  // Fallback to local state if backend returned null/empty
  const mySentTimetables = sentTimetables.filter(st => {
    const matchesDept = st.department === 'All Departments' || st.department === facultyDepartment;
    const matchesAudience = st.audience === 'Faculty' || st.audience === 'Students & Faculty';
    return matchesDept && matchesAudience;
  });

  const latestLocalTimetable = mySentTimetables.length > 0 ? mySentTimetables[mySentTimetables.length - 1] : null;
  const myTimetables = Array.isArray(dbMyTimetable) && dbMyTimetable.length > 0
    ? dbMyTimetable
    : (latestLocalTimetable ? latestLocalTimetable.entries : []);

  const generateTimetablePDF = () => {
    generateWeeklyTimetablePDF({
      entries: myTimetables,
      department: facultyDepartment,
      collegeName: 'Campus AI Academy',
      title: `Faculty Timetable (${facultyName})`
    });
  };

  if (path === '/teacher/timetable') {
    return (
      <Layout role="teacher" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">TEACHING SCHEDULE</span>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">Faculty Timetable</h1>
            <p className="text-gray-500 text-sm mt-1">Your weekly teaching and lecture matrix view.</p>
          </div>
          <button
            onClick={generateTimetablePDF}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 self-start sm:self-auto transition-all"
          >
            <FileText size={15} /> Download Grid PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Faculty:</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {facultyName}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                {facultyDepartment || 'All Departments'}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-medium">
              Native Weekly Matrix View
            </div>
          </div>

          <WeeklyTimetableGrid
            entries={myTimetables}
            readOnly={true}
            highlightFacultyName={facultyName}
            emptyMessage="No weekly teaching schedule entries found for your department."
          />
        </div>
      </Layout>
    );
  }

  if (path === '/teacher/announcements') {
    return (
      <Layout role="teacher" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Announcements</h1>
            <p className="text-gray-500 text-sm mt-1">Publish announcements to your students.</p>
          </div>
          <Link to="/teacher/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Publish New Announcement
          </h2>
          {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{success}</div>}

          <form onSubmit={handleAddNotice} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({...errors, title: ''}); }}
                  placeholder="Announcement Title"
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.title && <p className="text-xs text-red-500 font-medium mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); if (errors.category) setErrors({...errors, category: ''}); }}
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${errors.category ? 'border-red-500' : 'border-gray-200'}`}
                >
                  <option value="">Select Category</option>
                  <option value="Academic">Academic</option>
                  <option value="Assignment">Assignment</option>
                  <option value="General">General</option>
                </select>
                {errors.category && <p className="text-xs text-red-500 font-medium mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Scope *</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value);
                    if (errors.targetStudentEnrollment) setErrors({ ...errors, targetStudentEnrollment: '' });
                  }}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                >
                  <option value="department">Specific Department</option>
                  <option value="individual">Individual Student</option>
                  <option value="all">All Departments (Public)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {targetType === 'individual' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Student Enrollment *</label>
                  <input
                    type="text"
                    value={targetStudentEnrollment}
                    onChange={(e) => {
                      setTargetStudentEnrollment(e.target.value);
                      if (errors.targetStudentEnrollment) setErrors({ ...errors, targetStudentEnrollment: '' });
                    }}
                    placeholder="e.g. ABC001"
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${
                      errors.targetStudentEnrollment ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.targetStudentEnrollment && (
                    <p className="text-xs text-red-500 font-medium mt-1">{errors.targetStudentEnrollment}</p>
                  )}
                </div>
              ) : targetType === 'department' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Department *</label>
                  <select
                    value={targetDepartment}
                    onChange={(e) => {
                      setTargetDepartment(e.target.value);
                      if (errors.targetDepartment) setErrors({ ...errors, targetDepartment: '' });
                    }}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${
                      errors.targetDepartment ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Department</option>
                    {TARGET_DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.targetDepartment && (
                    <p className="text-xs text-red-500 font-medium mt-1">{errors.targetDepartment}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                  >
                    <option value="Students & Faculty">Students & Faculty</option>
                    <option value="Students">Students Only</option>
                    <option value="Faculty">Faculty Only</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Announcement Body *</label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => { setContent(e.target.value); if (errors.content) setErrors({...errors, content: ''}); }}
                placeholder="Write your announcement content here..."
                className={`w-full p-3 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${errors.content ? 'border-red-500' : 'border-gray-200'}`}
              />
              {errors.content && <p className="text-xs text-red-500 font-medium mt-1">{errors.content}</p>}
            </div>

            <ExpirationPicker
              value={expiresAt}
              onChange={(val) => {
                setExpiresAt(val);
                if (errors.expiresAt) setErrors({ ...errors, expiresAt: '' });
              }}
              error={errors.expiresAt}
              label="Notice Auto-Expiration (Auto-Delete)"
              helperText="Notice will automatically disappear from all noticeboards once this timestamp passes."
            />

            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5">
              <Megaphone size={16} /> Publish Announcement
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Published Announcements</h2>
          {visibleAnnouncements.length === 0 && getVisibleNotices(activeNotices, currentUser).length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Megaphone size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-600">No announcements available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleAnnouncements.map((a) => (
                <div key={a._id || a.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      {a.department} → {a.targetRole}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-line my-1">{a.message || a.description || a.content}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mt-2">
                    <span>📅 {a.date || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '')}</span>
                    <span>👤 {a.createdBy || 'Admin'}</span>
                    {a.expiresAt && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        ⏳ Active until {new Date(a.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {getVisibleNotices(activeNotices, currentUser).map((n) => (
                <div key={n._id || n.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{n.title}</h3>
                    <div className="flex items-center gap-2">
                      {n.expiresAt && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          ⏳ Active until {new Date(n.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{n.category}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Target: {n.targetDepartment || 'All Departments'}</p>
                  <p className="text-xs text-gray-600">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher" currentUser={currentUser} setCurrentUser={setCurrentUser}>
      {/* Top Greeting */}
      <div className="mb-6">
        <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
          FACULTY DASHBOARD
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
          Welcome, {facultyName} 👨‍🏫
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 block">Active Classes</span>
            <span className="text-3xl font-extrabold text-gray-900 mt-1 block">{mySubjects.length > 0 ? mySubjects.length : classes.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 block">Total Students</span>
            <span className="text-3xl font-extrabold text-gray-900 mt-1 block">{activeStudents.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 block">Announcements</span>
            <span className="text-3xl font-extrabold text-gray-900 mt-1 block">{visibleAnnouncements.length + getVisibleNotices(activeNotices, currentUser).length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <Link to="/teacher/assignments" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
          <div>
            <span className="text-xs font-medium text-gray-500 block">Class Assignments</span>
            <span className="text-3xl font-extrabold text-gray-900 mt-1 block">{activeAssignments.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
        </Link>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/teacher/assignments" className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all group">
          <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors flex items-center justify-between">
            Manage Assignments <ArrowRight size={16} />
          </h3>
          <p className="text-xs text-gray-500 mt-2">Publish coursework and review student submissions.</p>
        </Link>

        <Link to="/teacher/classes" className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all group">
          <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors flex items-center justify-between">
            Manage Classes <ArrowRight size={16} />
          </h3>
          <p className="text-xs text-gray-500 mt-2">View assigned class sections and student groups.</p>
        </Link>

        <Link to="/teacher/attendance" className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all group">
          <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors flex items-center justify-between">
            Mark Attendance <ArrowRight size={16} />
          </h3>
          <p className="text-xs text-gray-500 mt-2">Record student presence for today's lectures.</p>
        </Link>

        <Link to="/teacher/gradebook" className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all group">
          <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors flex items-center justify-between">
            Open Gradebook <ArrowRight size={16} />
          </h3>
          <p className="text-xs text-gray-500 mt-2">Evaluate assignments and enter student marks.</p>
        </Link>
      </div>
    </Layout>
  );
}
