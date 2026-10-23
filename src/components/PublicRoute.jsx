import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, GraduationCap } from 'lucide-react';

/**
 * PublicRoute Component
 * 
 * - If user is already authenticated with a valid session, redirects to their role dashboard.
 * - If user is not authenticated, renders the public route (e.g. Login).
 */
export default function PublicRoute({ children }) {
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 animate-pulse">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Loader2 size={18} className="animate-spin" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && currentUser) {
    const userRole = (currentUser.role || '').toLowerCase();
    const dashboardPath =
      userRole === 'admin'
        ? '/admin/dashboard'
        : userRole === 'faculty' || userRole === 'teacher'
        ? '/teacher/dashboard'
        : '/student/dashboard';

    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}
