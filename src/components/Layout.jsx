import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({
  children,
  role = 'student',
  searchPlaceholder,
  currentUser,
  setCurrentUser
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const userName = currentUser?.name
    ? currentUser.name
    : (role === 'admin' ? 'Administrator' : (role === 'teacher' || role === 'faculty') ? 'Faculty Member' : 'Student');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar with Desktop Fixed & Mobile Drawer support */}
      <Sidebar
        role={role}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0 transition-all duration-200">
        <Topbar
          role={role}
          userName={userName}
          placeholder={searchPlaceholder}
          currentUser={currentUser}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
