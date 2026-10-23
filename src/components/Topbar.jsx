import React from 'react';
import { Search, Bell, HelpCircle, ChevronDown, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Topbar({
  placeholder = "Search Campus AI...",
  userName = "Hitarth",
  role = "student",
  currentUser,
  onOpenMobileSidebar
}) {
  const displayRole = role === 'admin' 
    ? 'Administrator' 
    : (role === 'teacher' || role === 'faculty') 
      ? 'Faculty Member' 
      : 'Student';

  const profilePath = role === 'teacher' || role === 'faculty'
    ? '/teacher/profile'
    : role === 'admin'
      ? '/admin/dashboard'
      : '/student/profile';

  const initial = (userName || 'U').charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-14 py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Operational Status, Alerts & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Live Academic Session Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50/90 border border-emerald-200/60 text-emerald-700 text-xs font-semibold rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="tracking-tight text-[11px]">Academic Session 2026-27</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Notifications & Alerts"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
        </button>

        {/* Help Center Icon Button */}
        <button
          type="button"
          className="hidden sm:inline-flex p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Documentation & Help"
        >
          <HelpCircle size={19} />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1" />

        {/* User Pill / Profile Button */}
        <Link
          to={profilePath}
          className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-xs ring-2 ring-white">
            {initial}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
              {userName}
            </span>
            <span className="text-[10px] font-medium text-slate-400 leading-tight">
              {displayRole}
            </span>
          </div>
          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors ml-0.5" />
        </Link>
      </div>
    </header>
  );
}
