import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Megaphone, ClipboardList, FolderKanban,
  SlidersHorizontal, BookOpen, MessageSquare,
  User, Settings, HelpCircle, LogOut, Plus, GraduationCap,
  BookMarked, Calendar, CalendarDays, X, BarChart3
} from 'lucide-react';

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/marks', label: 'Performance Analytics', icon: BarChart3 },
  { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/student/events', label: 'Events', icon: Calendar },
  { to: '/student/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/student/attendance', label: 'Attendance', icon: SlidersHorizontal },
  { to: '/student/notes', label: 'Notes & Materials', icon: BookOpen },
  { to: '/student/messages', label: 'Messages', icon: MessageSquare },
  { to: '/student/profile', label: 'Profile', icon: User },
  { to: '/student/settings', label: 'Settings', icon: Settings },
];

const teacherLinks = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/gradebook', label: 'Performance Analytics', icon: BarChart3 },
  { to: '/teacher/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/teacher/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/teacher/classes', label: 'My Classes', icon: GraduationCap },
  { to: '/teacher/attendance', label: 'Attendance', icon: SlidersHorizontal },
  { to: '/teacher/materials', label: 'Notes & Materials', icon: BookMarked },
  { to: '/teacher/messages', label: 'Messages', icon: MessageSquare },
  { to: '/teacher/profile', label: 'Profile', icon: User },
  { to: '/teacher/settings', label: 'Settings', icon: Settings },
];

const adminSections = [
  {
    title: 'CORE MANAGEMENT',
    links: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/students', label: 'Students', icon: User },
      { to: '/admin/faculty', label: 'Faculty Directory', icon: GraduationCap },
      { to: '/admin/events', label: 'Events & Calendar', icon: Calendar },
      { to: '/admin/timetable', label: 'Timetable Schedule', icon: CalendarDays },
    ]
  },
  {
    title: 'ACADEMIC STRUCTURE',
    links: [
      { to: '/admin/courses', label: 'Courses & Programs', icon: BookOpen },
      { to: '/admin/subjects', label: 'Subjects & Syllabus', icon: BookMarked },
      { to: '/admin/classes', label: 'Classes & Sections', icon: SlidersHorizontal },
    ]
  },
  {
    title: 'MONITORING & COMMS',
    links: [
      { to: '/admin/marks', label: 'Performance Analytics', icon: BarChart3 },
      { to: '/admin/attendance', label: 'Attendance Overview', icon: SlidersHorizontal },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/notices', label: 'Notices & Circulars', icon: Megaphone },
      { to: '/admin/messages', label: 'Messages & Live Chat', icon: MessageSquare },
      { to: '/admin/materials', label: 'Materials Library', icon: FolderKanban },
      { to: '/admin/assignments', label: 'Assignments Overview', icon: ClipboardList },
    ]
  },
  {
    title: 'CONFIGURATION',
    links: [
      { to: '/admin/settings', label: 'System Settings', icon: Settings },
    ]
  }
];

export default function Sidebar({
  role = 'student',
  currentUser,
  setCurrentUser,
  mobileOpen = false,
  setMobileOpen
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isFaculty = role === 'faculty' || role === 'teacher';
  const isAdmin = role === 'admin';

  const handleLogout = async () => {
    await logout();
    if (setCurrentUser) {
      setCurrentUser(null);
    }
    navigate('/');
  };

  const closeSidebar = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const roleBadge = isAdmin ? 'Admin Console' : isFaculty ? 'Faculty Portal' : 'Student Portal';
  const userName = currentUser?.name || (isAdmin ? 'Admin' : isFaculty ? 'Faculty' : 'Student');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-base tracking-tight block">
                  Campus AI
                </span>
                <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold text-[9px] rounded-md tracking-wider">
                  PRO
                </span>
              </div>
              <span className="text-slate-400 font-medium text-[11px] block -mt-0.5">
                {roleBadge}
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={closeSidebar}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pt-3 pb-2">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold py-2.5 px-3 rounded-xl shadow-sm shadow-indigo-600/25 transition-all duration-150 hover:shadow-md active:scale-[0.99]"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Quick Create Entry</span>
          </button>
        </div>

        {/* Navigation Links Area */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {isAdmin ? (
            adminSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </div>
                {section.links.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                        isActive
                          ? 'bg-indigo-50/90 text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={16}
                          className={`transition-colors shrink-0 ${
                            isActive
                              ? 'text-indigo-600'
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))
          ) : (
            <div className="space-y-1">
              <div className="px-3 pt-1 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {isFaculty ? 'FACULTY MODULES' : 'STUDENT PORTAL'}
              </div>
              {(isFaculty ? teacherLinks : studentLinks).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-indigo-50/90 text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={16}
                        className={`transition-colors shrink-0 ${
                          isActive
                            ? 'text-indigo-600'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User Card & Logout Bottom Section */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-1">
          {/* User Mini Profile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs mb-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 truncate">
                  {userName}
                </span>
                <span className="block text-[10px] font-medium text-slate-400 truncate capitalize">
                  {role}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>

          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
          >
            <HelpCircle size={15} className="text-slate-400" />
            <span>Help & Documentation</span>
          </button>
        </div>
      </aside>
    </>
  );
}
