import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import {
  Calendar,
  FileText,
  Bell,
  SlidersHorizontal,
  Megaphone,
  BarChart3,
  GraduationCap,
  Clock,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import timetableService from '../../services/timetableService';
import eventService from '../../services/eventService';
import attendanceService from '../../services/attendanceService';
import assignmentService from '../../services/assignmentService';
import announcementService from '../../services/announcementService';
import noticeService from '../../services/noticeService';
import analyticsService from '../../services/analyticsService';
import {
  getPendingAssignments,
  getVisibleAnnouncements,
  getVisibleEvents,
  getVisibleNotices
} from '../../utils/visibility';
import WeeklyTimetableGrid from '../../components/WeeklyTimetableGrid';
import { generateWeeklyTimetablePDF } from '../../utils/timetablePdfGenerator';

export default function StudentDashboard({
  currentUser,
  setCurrentUser
}) {
  const location = useLocation();
  const path = location.pathname;

  // Real data states fetched dynamically from Backend APIs via useEffect
  const [notices, setNotices] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [timetableEntries, setTimetableEntries] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeNoticeTab, setActiveNoticeTab] = useState('all');

  const studentName = currentUser?.name || 'Student';
  const studentEnrollment = currentUser?.enrollment || '';
  const studentDepartment = currentUser?.department || currentUser?.course || '';
  const studentSemester = currentUser?.semester || '';
  const studentDivision = currentUser?.classSection || currentUser?.section || currentUser?.division || '';

  // Step 2: useEffect hooks to fetch real backend data (strictly no dummy arrays or mock data)
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        fetchedNotices,
        fetchedAnnouncements,
        fetchedEvents,
        fetchedAttendance,
        fetchedAssignments,
        fetchedPerformance,
        fetchedTimetable
      ] = await Promise.all([
        // 1. Notice API (Strictly active, unexpired notices)
        noticeService.getNotices().catch(err => {
          console.error('Error fetching notices:', err);
          return [];
        }),
        // 2. Announcement API (Strictly active, unexpired announcements)
        announcementService.getAnnouncements().catch(err => {
          console.error('Error fetching announcements:', err);
          return [];
        }),
        // 3. Events API (Active, unexpired events)
        eventService.getEvents(studentDepartment).catch(err => {
          console.error('Error fetching events:', err);
          return [];
        }),
        // 4. Attendance API (Subject-wise & overall attendance breakdown)
        attendanceService.getMyAttendance().catch(err => {
          console.error('Error fetching attendance:', err);
          return null;
        }),
        // 5. Assignment API (Real coursework assignments)
        assignmentService.getAssignments().catch(err => {
          console.error('Error fetching assignments:', err);
          return [];
        }),
        // 6. Analytics API (Real marks, GPA, and performance)
        analyticsService.getStudentPerformance().catch(err => {
          console.error('Error fetching performance:', err);
          return null;
        }),
        // 7. Timetable API (Real weekly timetable slots)
        studentDepartment
          ? timetableService.getMyTimetable(studentDepartment, 'student', {
              semester: studentSemester,
              division: studentDivision
            }).catch(err => {
              console.error('Error fetching timetable:', err);
              return [];
            })
          : Promise.resolve([])
      ]);

      setNotices(Array.isArray(fetchedNotices) ? fetchedNotices : []);
      setAnnouncements(Array.isArray(fetchedAnnouncements) ? fetchedAnnouncements : []);
      setEvents(Array.isArray(fetchedEvents) ? fetchedEvents : []);
      setAttendanceData(fetchedAttendance);
      setAssignments(Array.isArray(fetchedAssignments) ? fetchedAssignments : []);
      setPerformanceData(fetchedPerformance?.data || fetchedPerformance);
      setTimetableEntries(Array.isArray(fetchedTimetable) ? fetchedTimetable : []);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [studentDepartment, studentSemester, studentDivision]);

  useEffect(() => {
    fetchDashboardData();

    const handleSync = () => fetchDashboardData();
    window.addEventListener('assignment-status-changed', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('assignment-status-changed', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [fetchDashboardData]);

  // Derived filtered items based on visibility and auto-expiration rules
  const pendingAssignments = getPendingAssignments(assignments, currentUser);
  const visibleAnnouncements = getVisibleAnnouncements(announcements, currentUser);
  const visibleNotices = getVisibleNotices(notices, currentUser);
  const visibleEvents = getVisibleEvents(events, currentUser);

  const sortedNotices = [...visibleNotices].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return (b._id || b.id || '').toString().localeCompare((a._id || a.id || '').toString());
  });

  const sortedAnnouncements = [...visibleAnnouncements].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return (b._id || b.id || '').toString().localeCompare((a._id || a.id || '').toString());
  });

  const combinedNoticesAndAnnouncements = [
    ...sortedNotices.map((n) => ({ ...n, itemType: 'notice' })),
    ...sortedAnnouncements.map((a) => ({ ...a, itemType: 'announcement' }))
  ].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return (b._id || b.id || '').toString().localeCompare((a._id || a.id || '').toString());
  });

  const displayedFeedItems = activeNoticeTab === 'notices'
    ? sortedNotices.map((n) => ({ ...n, itemType: 'notice' }))
    : activeNoticeTab === 'announcements'
    ? sortedAnnouncements.map((a) => ({ ...a, itemType: 'announcement' }))
    : combinedNoticesAndAnnouncements;

  // Attendance metrics from real data
  const hasAttendanceData = !!(attendanceData?.overallStats && attendanceData.overallStats.totalConducted > 0);
  const attendancePercentage = hasAttendanceData ? attendanceData.overallStats.overallPercentage : null;
  const attendedCount = hasAttendanceData ? attendanceData.overallStats.totalAttended : 0;
  const conductedCount = hasAttendanceData ? attendanceData.overallStats.totalConducted : 0;

  // Performance metrics from real data
  const hasPerformanceData = !!(performanceData?.summary && performanceData.summary.totalSubjects > 0);
  const studentGpa = hasPerformanceData ? (performanceData.summary.gpa ?? performanceData.summary.cgpa) : null;
  const studentAvgMarks = hasPerformanceData ? performanceData.summary.overallPercentage : null;
  const studentSubjectCount = hasPerformanceData ? performanceData.summary.totalSubjects : 0;

  const generateTimetablePDF = () => {
    generateWeeklyTimetablePDF({
      entries: timetableEntries,
      department: studentDepartment,
      semester: studentSemester,
      division: studentDivision,
      collegeName: 'Campus AI Academy',
      title: 'Class Timetable'
    });
  };

  // Sub-route: /student/timetable
  if (path === '/student/timetable') {
    return (
      <Layout role="student" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">WEEKLY SCHEDULE</span>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">Class Timetable</h1>
            <p className="text-gray-500 text-sm mt-1">Interactive weekly grid schedule for your department and semester.</p>
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
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Your Class:</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {studentDepartment || 'All Departments'}
              </span>
              {studentSemester && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  Semester {studentSemester}
                </span>
              )}
              {studentDivision && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  Division {studentDivision}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 font-medium">
              Native Weekly Matrix View
            </div>
          </div>

          <WeeklyTimetableGrid
            entries={timetableEntries}
            readOnly={true}
            emptyMessage="No weekly timetable schedule published for your department and semester yet."
          />
        </div>
      </Layout>
    );
  }

  // Sub-route: /student/events
  if (path === '/student/events') {
    return (
      <Layout role="student" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Campus Events</h1>
            <p className="text-gray-500 text-sm mt-1">Official upcoming events and activities organized by the Administration.</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Refresh events"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Upcoming Events</h2>
          {visibleEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Calendar size={36} className="mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-gray-700">No Data Available</h3>
              <p className="text-xs text-gray-500 mt-1">No upcoming events scheduled at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleEvents.slice().reverse().map((ev) => (
                <div key={ev._id || ev.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-base">{ev.title}</h3>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{ev.description}</p>
                  <p className="text-[10px] text-gray-500 mb-3">Target: {ev.targetDepartment || 'All Departments'}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 font-medium pt-2 border-t border-gray-200/60">
                    <div>📅 <span className="font-semibold text-gray-700">{ev.date}</span></div>
                    <div>⏰ <span className="font-semibold text-gray-700">{ev.time}</span></div>
                    <div>📍 <span className="font-semibold text-gray-700">{ev.venue}</span></div>
                    <div>👤 <span className="font-semibold text-gray-700">{ev.organizer}</span></div>
                    {ev.expiresAt && (
                      <div className="col-span-2 mt-1 py-1 px-2 bg-amber-50 rounded-lg border border-amber-200/60 text-[10px] text-amber-800 flex items-center justify-between">
                        <span>⏳ Active until {new Date(ev.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-bold text-[9px] uppercase tracking-wider text-amber-700">Active</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Sub-route: /student/announcements
  if (path === '/student/announcements') {
    return (
      <Layout role="student" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">College Announcements & Notices</h1>
            <p className="text-gray-500 text-sm mt-1">Official circulars, academic notices, and broadcasts targeted to your department and role.</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Refresh announcements"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">Official Notice Feed</h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                {displayedFeedItems.length} Active {displayedFeedItems.length === 1 ? 'Circular' : 'Circulars'}
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200/60">
              <button
                type="button"
                onClick={() => setActiveNoticeTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeNoticeTab === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All ({combinedNoticesAndAnnouncements.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveNoticeTab('notices')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeNoticeTab === 'notices'
                    ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Notices ({sortedNotices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveNoticeTab('announcements')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeNoticeTab === 'announcements'
                    ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Broadcasts ({sortedAnnouncements.length})
              </button>
            </div>
          </div>

          {displayedFeedItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Megaphone size={36} className="mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-gray-700">No Data Available</h3>
              <p className="text-xs text-gray-500 mt-1">No active notices or announcements available at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedFeedItems.map((item) => {
                const isNotice = item.itemType === 'notice';
                const targetBadge = item.targetType === 'individual'
                  ? 'Personal Notice'
                  : (item.department || item.targetDepartment || 'All Departments');

                return (
                  <div key={`${item.itemType}-${item._id || item.id}`} className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                            isNotice
                              ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                              : 'bg-purple-50 text-purple-700 border-purple-200/60'
                          }`}
                        >
                          {isNotice ? 'Notice' : 'Announcement'}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.category && (
                          <span className="text-[10px] font-semibold text-gray-500 px-2 py-0.5 rounded-md bg-white border border-gray-200">
                            {item.category}
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                          {targetBadge}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed my-2">
                      {item.content || item.message || item.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-200/60 mt-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>📅 {item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '')}</span>
                        <span>⏰ {item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span>
                        <span>👤 {item.postedBy || item.createdBy || 'Admin'}</span>
                        {item.expiresAt && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            ⏳ Active until {new Date(item.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {item.fileData && (
                        <a
                          href={item.fileData}
                          download={item.fileName || 'attachment'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors mt-2 sm:mt-0"
                        >
                          📎 Download Attachment ({item.fileName || 'File'})
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // =========================================================================
  // Main Route: /student/dashboard
  // =========================================================================
  return (
    <Layout role="student" currentUser={currentUser} setCurrentUser={setCurrentUser}>
      {/* Welcome & Profile Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
            STUDENT DASHBOARD
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1 flex items-center gap-2">
            Welcome back, {studentName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {studentEnrollment && <span className="font-semibold text-gray-700 mr-2">ID: {studentEnrollment}</span>}
            {studentDepartment && <span>{studentDepartment}</span>}
            {studentSemester && <span> • Sem {studentSemester}</span>}
            {studentDivision && <span> • Div {studentDivision}</span>}
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all self-start sm:self-auto"
          title="Refresh dashboard metrics"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Quick Metrics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Attendance Card */}
        <Link
          to="/student/attendance"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div>
            <span className="text-xs font-medium text-gray-500 block">My Attendance</span>
            {hasAttendanceData ? (
              <>
                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                  {attendancePercentage}
                </span>
                <span className="text-xs text-indigo-600 font-semibold group-hover:underline">
                  {attendedCount}/{conductedCount} Attended • Details →
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-gray-400 mt-2 block">
                  No Data Available
                </span>
                <span className="text-xs text-gray-400 mt-1 block">
                  View Subject Breakdown →
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <SlidersHorizontal size={20} />
          </div>
        </Link>

        {/* Pending Assignments Card */}
        <Link
          to="/student/assignments"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-purple-200 hover:shadow-md transition-all group"
        >
          <div>
            <span className="text-xs font-medium text-gray-500 block">Pending Assignments</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {pendingAssignments.length}
            </span>
            <span className="text-xs text-purple-600 font-semibold group-hover:underline">
              {pendingAssignments.length > 0 ? `${pendingAssignments.length} to complete • View →` : 'All caught up • View coursework →'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <FileText size={20} />
          </div>
        </Link>

        {/* Academic Performance Card */}
        <Link
          to="/student/marks"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-emerald-200 hover:shadow-md transition-all group"
        >
          <div>
            <span className="text-xs font-medium text-gray-500 block">Academic Performance</span>
            {hasPerformanceData ? (
              <>
                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                  {studentGpa} GPA
                </span>
                <span className="text-xs text-emerald-600 font-semibold group-hover:underline">
                  {studentAvgMarks}% Avg ({studentSubjectCount} subjects) →
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-gray-400 mt-2 block">
                  No Data Available
                </span>
                <span className="text-xs text-gray-400 mt-1 block">
                  View Marksheet Analytics →
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <GraduationCap size={20} />
          </div>
        </Link>

        {/* Announcements & Notices Card */}
        <Link
          to="/student/announcements"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div>
            <span className="text-xs font-medium text-gray-500 block">Active Notices</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {sortedNotices.length}
            </span>
            <span className="text-xs text-blue-600 font-semibold group-hover:underline">
              {sortedNotices.length > 0 ? `${sortedNotices.length} active notices →` : 'No new notices'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Bell size={20} />
          </div>
        </Link>
      </div>

      {/* =================================================================== */}
      {/* Step 2: Academic Performance Section (Clean 'No Data Available' UI) */}
      {/* =================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={18} />
            <h2 className="text-base font-bold text-gray-900">Academic Performance Overview</h2>
          </div>
          <Link
            to="/student/marks"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Full Analytics</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {!hasPerformanceData ? (
          <div className="py-10 px-6 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
            <BarChart3 size={34} className="mx-auto mb-2 text-gray-400 opacity-60" />
            <h3 className="text-sm font-bold text-gray-700">No Data Available</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              No academic marks or performance records have been recorded for your profile yet. Once faculty submits your grades, real-time analytics will display here.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/60">
                <span className="text-xs text-gray-500 font-medium block">Current GPA</span>
                <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">
                  {studentGpa}
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">10.0 Scale</span>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
                <span className="text-xs text-gray-500 font-medium block">Overall Average</span>
                <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                  {studentAvgMarks}%
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Weighted score</span>
              </div>
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100/60">
                <span className="text-xs text-gray-500 font-medium block">Subjects Evaluated</span>
                <span className="text-2xl font-extrabold text-purple-700 mt-1 block">
                  {studentSubjectCount}
                </span>
                <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">Active courses</span>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/60">
                <span className="text-xs text-gray-500 font-medium block">Passed Courses</span>
                <span className="text-2xl font-extrabold text-blue-700 mt-1 block">
                  {performanceData.summary.passedSubjects ?? studentSubjectCount}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">Credits cleared</span>
              </div>
            </div>

            {Array.isArray(performanceData.subjectWiseAnalysis) && performanceData.subjectWiseAnalysis.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {performanceData.subjectWiseAnalysis.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 flex items-center justify-between">
                      <div className="pr-2 truncate">
                        <span className="text-xs font-bold text-gray-900 block truncate">{item.subject}</span>
                        <span className="text-[11px] text-gray-500">Marks: {item.totalMarksObtained} / {item.maxMarks}</span>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-white border border-gray-200 rounded-md text-indigo-700 shadow-2xs">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upcoming Events Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="text-indigo-600" size={18} />
            <h2 className="text-base font-bold text-gray-900">Upcoming Events</h2>
          </div>
          <Link
            to="/student/events"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>All Events ({visibleEvents.length})</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="py-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
            <Calendar size={32} className="mx-auto mb-2 text-gray-400 opacity-60" />
            <h4 className="text-sm font-bold text-gray-700">No Data Available</h4>
            <p className="text-xs text-gray-500 mt-0.5">No upcoming campus events scheduled at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleEvents.slice().reverse().slice(0, 4).map((ev) => (
              <div key={ev._id || ev.id} className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/60">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">{ev.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    {ev.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 mb-2 leading-relaxed">{ev.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-medium pt-2 border-t border-indigo-100/60">
                  <span>📅 {ev.date}</span>
                  <span>⏰ {ev.time}</span>
                  <span>📍 {ev.venue}</span>
                  {ev.organizer && <span>👤 {ev.organizer}</span>}
                  {ev.expiresAt && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                      ⏳ Active until {new Date(ev.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* Step 3: Latest Announcements & Notices Section (CRITICAL EXACT MATCH) */}
      {/* =================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Latest Announcements & Notices</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {sortedNotices.length} Active {sortedNotices.length === 1 ? 'Notice' : 'Notices'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Official circulars and academic notices strictly filtered from the database.
              </p>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveNoticeTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeNoticeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({combinedNoticesAndAnnouncements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveNoticeTab('notices')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeNoticeTab === 'notices'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Notices ({sortedNotices.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveNoticeTab('announcements')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeNoticeTab === 'announcements'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Broadcasts ({sortedAnnouncements.length})
            </button>
          </div>
        </div>

        {/* Display notices from updated Notice API */}
        {(activeNoticeTab === 'notices' ? sortedNotices : displayedFeedItems).length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Megaphone size={36} className="mx-auto mb-2 opacity-40 text-gray-400" />
            <p className="text-sm font-semibold text-gray-600">No new notices at this time.</p>
            <p className="text-xs text-gray-400 mt-0.5">Active, unexpired notices from administration will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {(activeNoticeTab === 'notices' ? sortedNotices : displayedFeedItems).slice(0, 6).map((item) => {
              const isNotice = item.itemType === 'notice';
              const targetBadge = item.targetType === 'individual'
                ? 'Personal Notice'
                : (item.department || item.targetDepartment || 'All Departments');

              return (
                <div
                  key={`${item.itemType || 'notice'}-${item._id || item.id}`}
                  className="p-4 bg-slate-50/70 hover:bg-slate-50 transition-all rounded-xl border border-slate-200/80 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                          isNotice
                            ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                            : 'bg-purple-50 text-purple-700 border-purple-200/60'
                        }`}
                      >
                        {isNotice ? 'Notice' : 'Announcement'}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                          {item.category}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                        {targetBadge}
                      </span>
                    </div>

                    {item.expiresAt && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
                        ⏳ Active until {new Date(item.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                    {item.content || item.message || item.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-medium pt-2.5 mt-3 border-t border-slate-200/60">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>📅 {item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '')}</span>
                      {item.time && <span>⏰ {item.time}</span>}
                      <span>👤 {item.postedBy || item.createdBy || 'Administration'}</span>
                    </div>

                    {item.fileData && (
                      <a
                        href={item.fileData}
                        download={item.fileName || 'attachment'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors mt-2 sm:mt-0"
                      >
                        📎 Attachment ({item.fileName || 'Download'})
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
