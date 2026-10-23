import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

import authService from './services/authService';
import noticeService from './services/noticeService';
import eventService from './services/eventService';
import materialService from './services/materialService';
import attendanceService from './services/attendanceService';
import markService from './services/markService';
import assignmentService from './services/assignmentService';
import messageService from './services/messageService';
import academicService from './services/academicService';
import announcementService from './services/announcementService';

// Public & Auth Pages (Lazy-Loaded)
const Login = lazy(() => import('./pages/Login'));

// Student Pages (Lazy-Loaded)
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentAttendance = lazy(() => import('./pages/student/Attendance'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments'));
const StudentMarks = lazy(() => import('./pages/student/Marks'));
const StudentNotes = lazy(() => import('./pages/student/Notes'));
const StudentMessages = lazy(() => import('./pages/student/Messages'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));
const StudentSettings = lazy(() => import('./pages/student/Settings'));

// Teacher Pages (Lazy-Loaded)
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherClasses = lazy(() => import('./pages/teacher/MyClasses'));
const TeacherAssignments = lazy(() => import('./pages/teacher/Assignments'));
const TeacherCreateAssignment = lazy(() => import('./pages/teacher/CreateAssignment'));
const TeacherGradebook = lazy(() => import('./pages/teacher/Gradebook'));
const TeacherAttendance = lazy(() => import('./pages/teacher/Attendance'));
const TeacherMaterials = lazy(() => import('./pages/teacher/ManageMaterials'));
const TeacherSettings = lazy(() => import('./pages/teacher/Settings'));

// Admin Pages (Lazy-Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminMessages = lazy(() => import('./pages/admin/Messages'));

const getInitialData = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

function AppContent() {
  const { currentUser, setCurrentUser } = useAuth();

  const [students, setStudents] = useState(() => getInitialData('students', []));
  const [faculty, setFaculty] = useState(() => getInitialData('faculty', []));
  const [courses, setCourses] = useState(() => getInitialData('courses', []));
  const [subjects, setSubjects] = useState(() => getInitialData('subjects', []));
  const [classes, setClasses] = useState(() => getInitialData('classes', []));
  const [attendance, setAttendance] = useState(() => getInitialData('attendance', []));
  const [marks, setMarks] = useState(() => getInitialData('marks', []));
  const [notices, setNotices] = useState(() => getInitialData('notices', []));
  const [materials, setMaterials] = useState(() => getInitialData('materials', []));
  const [assignments, setAssignments] = useState(() => getInitialData('assignments', []));
  const [messages, setMessages] = useState(() => getInitialData('messages', []));
  const [events, setEvents] = useState(() => getInitialData('events', []));
  const [timetables, setTimetables] = useState(() => getInitialData('timetables', []));
  const [sentTimetables, setSentTimetables] = useState(() => getInitialData('sentTimetables', []));
  const [announcements, setAnnouncements] = useState(() => getInitialData('announcements', []));

  // Sync data with MongoDB backend only when authenticated
  useEffect(() => {
    if (!currentUser) {
      setStudents([]);
      setFaculty([]);
      setAttendance([]);
      setMarks([]);
      return;
    }

    const userRole = (currentUser.role || '').toLowerCase();

    // Institution-wide collections are synced ONLY for Admin
    if (userRole === 'admin') {
      authService.getStudents()
        .then((data) => {
          if (Array.isArray(data)) setStudents(data);
        })
        .catch(() => {});

      authService.getFaculty()
        .then((data) => {
          if (Array.isArray(data)) setFaculty(data);
        })
        .catch(() => {});

      attendanceService.getAttendance()
        .then((data) => {
          if (Array.isArray(data)) setAttendance(data);
        })
        .catch(() => {});

      markService.getMarks()
        .then((data) => {
          if (Array.isArray(data)) setMarks(data);
        })
        .catch(() => {});

      academicService.getCourses()
        .then((data) => {
          if (Array.isArray(data)) setCourses(data);
        })
        .catch(() => {});

      academicService.getSubjects()
        .then((data) => {
          if (Array.isArray(data)) setSubjects(data);
        })
        .catch(() => {});

      academicService.getClasses()
        .then((data) => {
          if (Array.isArray(data)) setClasses(data);
        })
        .catch(() => {});
    }

    // Role-safe communication and general notices
    noticeService.getNotices()
      .then((data) => {
        if (Array.isArray(data)) setNotices(data);
      })
      .catch(() => {});

    announcementService.getAnnouncements()
      .then((data) => {
        if (Array.isArray(data)) setAnnouncements(data);
      })
      .catch(() => {});

    eventService.getEvents()
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch(() => {});

    materialService.getMaterials()
      .then((data) => {
        if (Array.isArray(data)) setMaterials(data);
      })
      .catch(() => {});

    assignmentService.getAssignments()
      .then((data) => {
        if (Array.isArray(data)) setAssignments(data);
      })
      .catch(() => {});

    messageService.getMessages()
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => { try { localStorage.setItem('students', JSON.stringify(students)); } catch (e) {} }, [students]);
  useEffect(() => { try { localStorage.setItem('faculty', JSON.stringify(faculty)); } catch (e) {} }, [faculty]);
  useEffect(() => { try { localStorage.setItem('courses', JSON.stringify(courses)); } catch (e) {} }, [courses]);
  useEffect(() => { try { localStorage.setItem('subjects', JSON.stringify(subjects)); } catch (e) {} }, [subjects]);
  useEffect(() => { try { localStorage.setItem('classes', JSON.stringify(classes)); } catch (e) {} }, [classes]);
  useEffect(() => { try { localStorage.setItem('attendance', JSON.stringify(attendance)); } catch (e) {} }, [attendance]);
  useEffect(() => { try { localStorage.setItem('marks', JSON.stringify(marks)); } catch (e) {} }, [marks]);
  useEffect(() => { try { localStorage.setItem('notices', JSON.stringify(notices)); } catch (e) {} }, [notices]);
  useEffect(() => { try { localStorage.setItem('announcements', JSON.stringify(announcements)); } catch (e) {} }, [announcements]);
  useEffect(() => { try { localStorage.setItem('materials', JSON.stringify(materials)); } catch (e) {} }, [materials]);
  useEffect(() => { try { localStorage.setItem('assignments', JSON.stringify(assignments)); } catch (e) {} }, [assignments]);
  useEffect(() => { try { localStorage.setItem('messages', JSON.stringify(messages)); } catch (e) {} }, [messages]);
  useEffect(() => { try { localStorage.setItem('events', JSON.stringify(events)); } catch (e) {} }, [events]);
  useEffect(() => { try { localStorage.setItem('timetables', JSON.stringify(timetables)); } catch (e) {} }, [timetables]);
  useEffect(() => { try { localStorage.setItem('sentTimetables', JSON.stringify(sentTimetables)); } catch (e) {} }, [sentTimetables]);

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
        {/* Public Auth Routes (Redirects to dashboard if already logged in) */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                students={students}
                setStudents={setStudents}
                faculty={faculty}
                setFaculty={setFaculty}
              />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                students={students}
                setStudents={setStudents}
                faculty={faculty}
                setFaculty={setFaculty}
              />
            </PublicRoute>
          }
        />

        {/* Protected Student Routes (Accessible ONLY to student) */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} attendance={attendance} notices={notices} assignments={assignments} marks={marks} materials={materials} events={events} timetables={timetables} sentTimetables={sentTimetables} announcements={announcements} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/announcements"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} attendance={attendance} notices={notices} assignments={assignments} marks={marks} materials={materials} events={events} timetables={timetables} sentTimetables={sentTimetables} announcements={announcements} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/events"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} attendance={attendance} notices={notices} assignments={assignments} marks={marks} materials={materials} events={events} timetables={timetables} sentTimetables={sentTimetables} announcements={announcements} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/assignments"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAssignments currentUser={currentUser} setCurrentUser={setCurrentUser} assignments={assignments} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} attendance={attendance} notices={notices} assignments={assignments} marks={marks} materials={materials} events={events} timetables={timetables} sentTimetables={sentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAttendance currentUser={currentUser} setCurrentUser={setCurrentUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/marks"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMarks currentUser={currentUser} setCurrentUser={setCurrentUser} marks={marks} timetables={timetables} sentTimetables={sentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notes"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentNotes currentUser={currentUser} setCurrentUser={setCurrentUser} materials={materials} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/messages"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMessages currentUser={currentUser} setCurrentUser={setCurrentUser} messages={messages} setMessages={setMessages} students={students} faculty={faculty} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProfile currentUser={currentUser} setCurrentUser={setCurrentUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/settings"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentSettings currentUser={currentUser} setCurrentUser={setCurrentUser} />
            </ProtectedRoute>
          }
        />

        {/* Protected Faculty Routes (Accessible ONLY to faculty/teacher) */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} notices={notices} setNotices={setNotices} assignments={assignments} attendance={attendance} classes={classes} students={students} materials={materials} marks={marks} timetables={timetables} sentTimetables={sentTimetables} announcements={announcements} setAnnouncements={setAnnouncements} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/timetable"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} notices={notices} setNotices={setNotices} assignments={assignments} attendance={attendance} classes={classes} students={students} materials={materials} marks={marks} timetables={timetables} sentTimetables={sentTimetables} announcements={announcements} setAnnouncements={setAnnouncements} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/announcements"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} notices={notices} setNotices={setNotices} assignments={assignments} attendance={attendance} classes={classes} students={students} materials={materials} marks={marks} timetables={timetables} sentTimetables={sentTimetables} announcements={announcements} setAnnouncements={setAnnouncements} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherClasses currentUser={currentUser} setCurrentUser={setCurrentUser} classes={classes} setClasses={setClasses} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherAssignments currentUser={currentUser} setCurrentUser={setCurrentUser} assignments={assignments} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments/create"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherCreateAssignment currentUser={currentUser} setCurrentUser={setCurrentUser} assignments={assignments} setAssignments={setAssignments} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/gradebook"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherGradebook currentUser={currentUser} setCurrentUser={setCurrentUser} marks={marks} setMarks={setMarks} students={students} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/performance"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherGradebook currentUser={currentUser} setCurrentUser={setCurrentUser} marks={marks} setMarks={setMarks} students={students} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherAttendance currentUser={currentUser} setCurrentUser={setCurrentUser} attendance={attendance} setAttendance={setAttendance} students={students} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/materials"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherMaterials currentUser={currentUser} setCurrentUser={setCurrentUser} materials={materials} setMaterials={setMaterials} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/messages"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <StudentMessages currentUser={currentUser} setCurrentUser={setCurrentUser} messages={messages} setMessages={setMessages} students={students} faculty={faculty} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <StudentProfile currentUser={currentUser} setCurrentUser={setCurrentUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/settings"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
              <TeacherSettings currentUser={currentUser} setCurrentUser={setCurrentUser} />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes (Accessible ONLY to admin) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} messages={messages} setMessages={setMessages} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} messages={messages} setMessages={setMessages} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/faculty"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} messages={messages} setMessages={setMessages} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} messages={messages} setMessages={setMessages} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/marks"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} announcements={announcements} setAnnouncements={setAnnouncements} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/materials"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timetable"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminMessages currentUser={currentUser} setCurrentUser={setCurrentUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard currentUser={currentUser} students={students} setStudents={setStudents} faculty={faculty} setFaculty={setFaculty} courses={courses} setCourses={setCourses} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} attendance={attendance} setAttendance={setAttendance} marks={marks} setMarks={setMarks} notices={notices} setNotices={setNotices} materials={materials} setMaterials={setMaterials} assignments={assignments} setAssignments={setAssignments} events={events} setEvents={setEvents} timetables={timetables} setTimetables={setTimetables} sentTimetables={sentTimetables} setSentTimetables={setSentTimetables} />
            </ProtectedRoute>
          }
        />

        {/* Global Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
