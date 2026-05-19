/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Toaster } from '@/components/ui/sonner';

import LandingPage from './pages/LandingPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import AttendancePage from './pages/Attendance';
import PerformancePage from './pages/Performance';

import LoginPage from './pages/LoginPage';
import StudentsPage from './pages/StudentsPage';
import MarksEntry from './pages/MarksEntry';
import StudentPortal from './pages/StudentPortal';

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Portal Routes */}
        <Route path="/overview" element={
          user ? (
            <DashboardLayout>
              <DashboardOverview />
            </DashboardLayout>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/attendance" element={
          user ? (
            <DashboardLayout>
              <AttendancePage />
            </DashboardLayout>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/performance" element={
          user ? (
            <DashboardLayout>
              <PerformancePage />
            </DashboardLayout>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/students" element={
          user ? (
            <DashboardLayout>
              <StudentsPage />
            </DashboardLayout>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/marks-entry" element={
          user ? (
            <DashboardLayout>
              <MarksEntry />
            </DashboardLayout>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/student-portal" element={
          localStorage.getItem('student_session') ? (
            <StudentPortal />
          ) : <Navigate to="/login" replace />
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
