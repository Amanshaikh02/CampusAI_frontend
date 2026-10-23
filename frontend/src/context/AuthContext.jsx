import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { getAccessToken, setAccessToken as setGlobalAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Never initialize currentUser from localStorage to prevent unverified access
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(() => getAccessToken());
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Initialize and validate session on initial mount/browser refresh
  const restoreSession = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      // 1. If an access token exists, verify it and active session via GET /api/auth/me
      const currentToken = getAccessToken();
      if (currentToken) {
        setAccessTokenState(currentToken);
        setGlobalAccessToken(currentToken);
        try {
          const user = await authService.getMe();
          if (user) {
            setCurrentUser(user);
            return;
          }
        } catch (meErr) {
          // Token expired, revoked, or invalid; proceed to try session refresh
        }
      }

      // 2. Fall back to refresh session using HttpOnly cookie via MongoDB Session collection
      const data = await authService.refreshSession();
      if (data?.user) {
        setCurrentUser(data.user);
        const token = data.accessToken || data.token;
        setAccessTokenState(token);
        setGlobalAccessToken(token);
        return;
      }

      // If no valid session verified, clean up state
      setCurrentUser(null);
      setAccessTokenState(null);
      setGlobalAccessToken(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('campus_ai_token');
    } catch (err) {
      // No valid session on backend -> clear all auth state
      setCurrentUser(null);
      setAccessTokenState(null);
      setGlobalAccessToken(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('campus_ai_token');
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Development Mode Only: Expose safe session debugging object to Chrome DevTools console
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (currentUser) {
        const devAuth = {
          userId: currentUser.id || currentUser._id,
          role: currentUser.role,
          name: currentUser.name,
          username: currentUser.username || undefined,
          enrollment: currentUser.enrollment || undefined,
          department: currentUser.department || undefined,
          semester: currentUser.semester || undefined,
          hasActiveSession: Boolean(accessToken || getAccessToken()),
          sessionVerified: true,
          authenticatedAt: new Date().toLocaleTimeString()
        };
        window.__CAMPUS_AI_AUTH__ = devAuth;
        console.log('[CampusAI DevAuth Active User]', devAuth);
      } else {
        window.__CAMPUS_AI_AUTH__ = null;
      }
    }
  }, [currentUser, accessToken]);

  // Synchronize authentication state across browser tabs in real-time
  useEffect(() => {
    const handleStorageEvent = (event) => {
      if (event.key === 'campus_ai_auth_sync' && event.newValue) {
        try {
          const payload = JSON.parse(event.newValue);
          if (payload.action === 'LOGOUT') {
            setCurrentUser(null);
            setAccessTokenState(null);
            setGlobalAccessToken(null);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('campus_ai_token');
          } else if (payload.action === 'LOGIN') {
            restoreSession();
          }
        } catch (e) {}
      } else if (event.key === 'campus_ai_token' && !event.newValue) {
        // Token was removed in another tab
        setCurrentUser(null);
        setAccessTokenState(null);
        setGlobalAccessToken(null);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [restoreSession]);

  // Centralized login
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    const token = data.accessToken || data.token;
    setAccessTokenState(token);
    setGlobalAccessToken(token);
    setCurrentUser(data.user);
    try {
      localStorage.setItem('campus_ai_auth_sync', JSON.stringify({ action: 'LOGIN', time: Date.now() }));
    } catch (e) {}
    return data;
  };

  const clearCachedUserData = () => {
    const keysToRemove = [
      'currentUser',
      'campus_ai_token',
      'attendance',
      'marks',
      'students',
      'faculty',
      'assignments',
      'materials',
      'classes',
      'subjects',
      'courses',
      'timetables',
      'sentTimetables'
    ];
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
  };

  // Centralized logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Continue cleanup even if network fails
    }
    setAccessTokenState(null);
    setGlobalAccessToken(null);
    setCurrentUser(null);
    clearCachedUserData();
    try {
      localStorage.setItem('campus_ai_auth_sync', JSON.stringify({ action: 'LOGOUT', time: Date.now() }));
    } catch (e) {}
  };

  // Centralized logout all devices
  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch (e) {
      // Continue cleanup even if network fails
    }
    setAccessTokenState(null);
    setGlobalAccessToken(null);
    setCurrentUser(null);
    clearCachedUserData();
    try {
      localStorage.setItem('campus_ai_auth_sync', JSON.stringify({ action: 'LOGOUT', time: Date.now() }));
    } catch (e) {}
  };

  // Explicit session refresh
  const refreshSession = async () => {
    const data = await authService.refreshSession();
    const token = data.accessToken || data.token;
    setAccessTokenState(token);
    setGlobalAccessToken(token);
    setCurrentUser(data.user);
    return data;
  };

  const value = {
    currentUser,
    setCurrentUser,
    accessToken,
    isAuthenticated: Boolean(currentUser && (accessToken || getAccessToken())),
    isAuthLoading,
    login,
    logout,
    logoutAll,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
