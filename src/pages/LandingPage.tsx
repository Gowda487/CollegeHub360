import React from 'react';
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
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
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
            <Button variant="outline" className="rounded-full px-6">Login</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">Get Started</Button>
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
                onClick={() => window.location.href = '/overview'}
                size="lg" className="h-14 px-10 bg-blue-600 hover:bg-blue-700 rounded-full text-lg font-semibold group"
              >
                Enter Portal
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg font-semibold">
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Logo Section */}
      <section className="py-20 border-y border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Institutions', value: '250+' },
              { label: 'Active Students', value: '1M+' },
              { label: 'Reports Generated', value: '500k+' },
              { label: 'Success Rate', value: '99.9%' },
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
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <Card className="border-none bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors p-8 rounded-3xl">
      <CardContent className="p-0">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm">
          <Icon className="w-7 h-7 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-[#6B7280] leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
