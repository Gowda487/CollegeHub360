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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // For Demo Purposes: Allow direct entry to portal even if not logged in to Firebase
  // In a real app, we'd wait for Firebase.
  const [isDemoMode, setIsDemoMode] = useState(false);

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
        
        {/* Portal Routes */}
        <Route path="/overview" element={
          <DashboardLayout>
            <DashboardOverview />
          </DashboardLayout>
        } />

        <Route path="/attendance" element={
          <DashboardLayout>
            <AttendancePage />
          </DashboardLayout>
        } />

        <Route path="/performance" element={
          <DashboardLayout>
            <PerformancePage />
          </DashboardLayout>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
