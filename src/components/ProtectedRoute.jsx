import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, GraduationCap } from 'lucide-react';

/**
 * ProtectedRoute Guard Component
 * 
 * - Prevents flickering by checking isAuthLoading before deciding.
 * - Redirects unauthenticated users to / (Login).
 * - Enforces role-based authorization (students cannot access admin/faculty, etc.).
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  // 1. While session/token is being verified with backend, show non-flickering loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 animate-pulse">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Loader2 size={18} className="animate-spin" />
            <span>Verifying secure session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Reject unauthenticated access -> redirect to / (Login)
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. Enforce role-based access control
  if (allowedRoles.length > 0) {
    const userRole = (currentUser.role || '').toLowerCase();
    const isAuthorized = allowedRoles.some((role) => {
      const r = role.toLowerCase();
      if (r === userRole) return true;
      if (
        (r === 'faculty' && userRole === 'teacher') ||
        (r === 'teacher' && userRole === 'faculty')
      ) {
        return true;
      }
      return false;
    });

    if (!isAuthorized) {
      // Redirect to user's authorized role dashboard
      const fallbackPath =
        userRole === 'admin'
          ? '/admin/dashboard'
          : userRole === 'faculty' || userRole === 'teacher'
          ? '/teacher/dashboard'
          : '/student/dashboard';

      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
}
