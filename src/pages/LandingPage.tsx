import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  BrainCircuit, 
  Camera, 
  LineChart, 
  ShieldCheck, 
  Cpu, 
  Zap,
  CheckCircle2,
  Lock,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

import AIChatbox from '@/components/AIChatbox';

export default function LandingPage() {
  const [stats, setStats] = useState({
    students: '0',
    scans: '0',
    classes: '0',
    uptime: '99.9%'
  });

  useEffect(() => {
    // Real-time Student Count
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStats(prev => ({ ...prev, students: snap.size.toString() }));
    });

    // Real-time Attendance Count
    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snap) => {
      setStats(prev => ({ ...prev, scans: snap.size.toString() }));
    });

    return () => {
      unsubStudents();
      unsubAttendance();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">CollegeHub360</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[#4B5563] hover:text-[#1A1A1A]">Features</a>
            <a href="#solutions" className="text-sm font-medium text-[#4B5563] hover:text-[#1A1A1A]">Solutions</a>
            <a href="#about" className="text-sm font-medium text-[#4B5563] hover:text-[#1A1A1A]">About</a>
            <Button onClick={() => window.location.href = '/login'} variant="outline" className="rounded-full px-6">Login</Button>
            <Button onClick={() => window.location.href = '/login'} className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">Enter Portal</Button>
          </div>
          <div className="flex md:hidden items-center">
            <Button onClick={() => window.location.href = '/login'} className="bg-blue-600 hover:bg-blue-700 rounded-full text-xs px-4 h-9 font-semibold">
              Portal
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-8">
              <Zap className="w-4 h-4 fill-current" />
              <span>Version 2.0 is now live</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-[#1A1A1A] mb-8 leading-[1.1]">
              The Future of <span className="text-blue-600">Academic</span> <br /> Management.
            </h1>
            <p className="text-xl text-[#6B7280] max-w-3xl mx-auto mb-12 leading-relaxed">
              Empower your institution with CollegeHub360. Transform manual processes with AI-driven attendance, 
              real-time performance analytics, and career intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => {
                  const el = document.getElementById('portals');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                size="lg" className="h-14 px-10 bg-blue-600 hover:bg-blue-700 rounded-full text-lg font-semibold group"
              >
                Access Terminals
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={() => window.location.href = '/overview'} size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg font-semibold">
                Explore Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dual Portal Section */}
      <section id="portals" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[40px] border-none bg-slate-900 text-white p-12 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Lock className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-blue-500/20 text-blue-400 border-none mb-6 px-4">FACULTY & STAFF</Badge>
                <h3 className="text-4xl font-black mb-4 tracking-tighter">Admin Terminal</h3>
                <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10 max-w-sm">
                  Record attendance via OCR, conduct AI-powered mark entry, and manage the student lifecycle.
                </p>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="h-14 px-12 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-black text-lg"
                >
                  Enter Admin Suite
                </Button>
              </div>
            </Card>

            <Card className="rounded-[40px] border-none bg-white p-12 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl ring-1 ring-slate-100">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <GraduationCap className="w-32 h-32 text-slate-900" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-blue-50 text-blue-600 border-none mb-6 px-4">STUDENTS ONLY</Badge>
                <h3 className="text-4xl font-black mb-4 tracking-tighter text-slate-900">Student Portal</h3>
                <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10 max-w-sm">
                  View your semester progress, get Gemini AI career coaching, and track campus attendance.
                </p>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                  className="h-14 px-12 border-slate-200 text-slate-900 hover:bg-slate-50 rounded-full font-black text-lg"
                >
                  Access My Records
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Active Profiles', value: stats.students },
              { label: 'Identity Scans', value: stats.scans },
              { label: 'Analytic Reports', value: stats.scans },
              { label: 'System Health', value: stats.uptime },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-bold text-[#1A1A1A] mb-2">{stat.value}</p>
                <p className="text-sm font-medium text-[#6B7280] uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Designed for Modern Education</h2>
            <p className="text-[#6B7280] text-lg max-w-2xl mx-auto">
              We've built a suite of AI-first tools to help educators focus on what matters most: student success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Camera}
              title="Camera Attendance"
              description="Automate attendance marking using real-time ID scanning and OCR technology."
            />
            <FeatureCard 
              icon={BrainCircuit}
              title="AI Analytics"
              description="Predictive performance modeling to identify at-risk students before they fall behind."
            />
            <FeatureCard 
              icon={LineChart}
              title="Career Guidance"
              description="Personalized career pathways based on academic performance and market trends."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Smart Alerts"
              description="Instant notifications for low attendance, missed assignments, or critical performance drops."
            />
            <FeatureCard 
              icon={Cpu}
              title="OCR Recognition"
              description="Instant data extraction from student ID cards with 99% accuracy using Google Gemini."
            />
            <FeatureCard 
              icon={Lock}
              title="Secure Data"
              description="Enterprise-grade security with encrypted storage and granular access controls."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto px-6 py-20 rounded-[40px] bg-[#1A1A1A] text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(37,99,235,0.4),transparent)] px-6" />
          <h2 className="text-5xl md:text-7xl font-bold mb-10 relative z-10">Ready to transform your <br /> academic ecosystem?</h2>
          <div className="flex justify-center relative z-10">
            <Button size="lg" className="h-14 px-12 bg-white text-black hover:bg-gray-100 rounded-full text-lg font-bold">
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-20 px-6 border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-xl">CollegeHub360</span>
          </div>
          <p className="text-[#6B7280] text-sm">&copy; 2026 CollegeHub360. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-[#6B7280] hover:text-[#1A1A1A]">Privacy</a>
            <a href="#" className="text-sm text-[#6B7280] hover:text-[#1A1A1A]">Terms</a>
            <a href="#" className="text-sm text-[#6B7280] hover:text-[#1A1A1A]">Support</a>
          </div>
        </div>
      </footer>

      <AIChatbox studentData={{ name: 'Guest User' }} />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <Card className="border-none bg-white shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 p-10 rounded-[40px] group border border-slate-50">
      <CardContent className="p-0">
        <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
          <Icon className="w-8 h-8 text-slate-900 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-2xl font-black mb-4 tracking-tight text-slate-900">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
            {children}
        </span>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

