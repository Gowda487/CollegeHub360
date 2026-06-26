/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Toaster } from '@/components/ui/sonner';

import { DashboardLayout } from './components/layout/DashboardLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const AttendancePage = lazy(() => import('./pages/Attendance'));
const PerformancePage = lazy(() => import('./pages/Performance'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const MarksEntry = lazy(() => import('./pages/MarksEntry'));
const StudentPortal = lazy(() => import('./pages/StudentPortal'));

function StudentProtectedRoute({ children }: { children: React.ReactNode }) {
  const [hasSession, setHasSession] = useState(() => !!localStorage.getItem('student_session'));

  useEffect(() => {
    const handleStorageChange = () => {
      setHasSession(!!localStorage.getItem('student_session'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminProtectedRoute({ user, children }: { user: User | null; children: React.ReactNode }) {
  const [hasSession, setHasSession] = useState(() => !!localStorage.getItem('admin_session'));

  useEffect(() => {
    const handleStorageChange = () => {
      setHasSession(!!localStorage.getItem('admin_session'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!user && !hasSession) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const FallbackLoader = () => (
  <div className="h-screen flex items-center justify-center bg-[#F8F9FA]">
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-semibold text-slate-500 text-sm tracking-wide">Syncing Interface...</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [hasStudentSession, setHasStudentSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const checkSession = () => {
      setHasStudentSession(!!localStorage.getItem('student_session'));
    };
    checkSession();
    window.addEventListener('storage', checkSession);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', checkSession);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-medium text-slate-500">Initializing Hub360...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Portal Routes */}
          <Route path="/overview" element={
            <AdminProtectedRoute user={user}>
              <DashboardLayout>
                <DashboardOverview />
              </DashboardLayout>
            </AdminProtectedRoute>
          } />

          <Route path="/attendance" element={
            <AdminProtectedRoute user={user}>
              <DashboardLayout>
                <AttendancePage />
              </DashboardLayout>
            </AdminProtectedRoute>
          } />

          <Route path="/performance" element={
            <AdminProtectedRoute user={user}>
              <DashboardLayout>
                <PerformancePage />
              </DashboardLayout>
            </AdminProtectedRoute>
          } />

          <Route path="/students" element={
            <AdminProtectedRoute user={user}>
              <DashboardLayout>
                <StudentsPage />
              </DashboardLayout>
            </AdminProtectedRoute>
          } />

          <Route path="/marks-entry" element={
            <AdminProtectedRoute user={user}>
              <DashboardLayout>
                <MarksEntry />
              </DashboardLayout>
            </AdminProtectedRoute>
          } />

          <Route path="/student-portal" element={
            <StudentProtectedRoute>
              <StudentPortal />
            </StudentProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
