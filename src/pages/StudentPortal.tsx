import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Award,
  LogOut,
  RefreshCw,
  Sparkles,
  Zap,
  Target,
  Search,
  Download,
  ExternalLink,
  FileText,
  Video,
  Code,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auth, db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Bell,
  MessageSquare,
  ScanLine
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import AIChatbox from '@/components/AIChatbox';

interface BcaResourceFile {
  id: string;
  name: string;
  type: string;
  size: string;
  subject: string;
  author: string;
  downloadUrl: string;
}

interface BcaHubData {
  title: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  icon: any;
  files: BcaResourceFile[];
}

const bcaResourcesData: Record<string, BcaHubData> = {
  'lecture-notes': {
    title: 'BCA Lecture Notes & Slides',
    description: 'Verified syllabus-compliant notes compiled by Senior BCA Department Faculty.',
    accentColor: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700',
    icon: BookOpen,
    files: [
      { id: 'ln1', name: 'Database Management Systems (DBMS) - Comprehensive Notes', type: 'PDF Document', size: '4.8 MB', subject: 'BCA-202 (Database)', author: 'Prof. Anitha Rao', downloadUrl: '#' },
      { id: 'ln2', name: 'Data Structures & Algorithms - Complete Lab Manual & Slides', type: 'PDF Document', size: '6.2 MB', subject: 'BCA-201 (DSA)', author: 'Dr. Ramesh Kumar', downloadUrl: '#' },
      { id: 'ln3', name: 'Modern Web Development with HTML5, CSS3, ES6 & React', type: 'PDF Document', size: '3.5 MB', subject: 'BCA-402 (Web Tech)', author: 'Prof. Bhuvan Gowda', downloadUrl: '#' },
      { id: 'ln4', name: 'Object-Oriented Programming with C++ & Java Core Slides', type: 'PDF Document', size: '5.1 MB', subject: 'BCA-203 (OOPs)', author: 'Prof. Sneha Deshmukh', downloadUrl: '#' },
      { id: 'ln5', name: 'Software Engineering Principles & Agile Methodologies', type: 'PDF Document', size: '2.9 MB', subject: 'BCA-304 (SE)', author: 'Dr. Vivek Varma', downloadUrl: '#' },
      { id: 'ln6', name: 'Operating System Design Concepts & Linux Commands Sheet', type: 'PDF Document', size: '4.2 MB', subject: 'BCA-301 (OS)', author: 'Prof. Rajesh Hegde', downloadUrl: '#' },
    ]
  },
  'assessment-prep': {
    title: 'BCA Exam Prep & Question Banks',
    description: 'Boost your exam scores with fully-solved previous year questions and practice assignments.',
    accentColor: 'text-rose-600',
    badgeBg: 'bg-rose-50 text-rose-700',
    icon: Target,
    files: [
      { id: 'ap1', name: 'DBMS Semester Exam Solved Question Papers (2022-2025)', type: 'Exam Guide', size: '2.1 MB', subject: 'BCA-202 (Database)', author: 'Academic Cell', downloadUrl: '#' },
      { id: 'ap2', name: 'Data Structures Viva Questions & Quick-Revision Cheat Sheet', type: 'Lab Prep', size: '1.2 MB', subject: 'BCA-201 (DSA)', author: 'Dr. Ramesh Kumar', downloadUrl: '#' },
      { id: 'ap3', name: 'Java Programming Mock Interview & Semester Practical Exercises', type: 'Exam Guide', size: '1.8 MB', subject: 'BCA-303 (Java)', author: 'Prof. Sneha Deshmukh', downloadUrl: '#' },
      { id: 'ap4', name: 'Computer Networks - Practice MCQ Bank & Network Protocols Manual', type: 'Revision Key', size: '3.0 MB', subject: 'BCA-302 (Networks)', author: 'Dr. Vivek Varma', downloadUrl: '#' },
    ]
  },
  'video-archive': {
    title: 'BCA Recorded Lectures & Code Tutorials',
    description: 'Curated high-definition video walkthroughs covering core theories and terminal-level coding tutorials.',
    accentColor: 'text-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700',
    icon: Sparkles,
    files: [
      { id: 'va1', name: 'Database Normalization (1NF, 2NF, 3NF, BCNF) Made Easy', type: 'Video Lesson', size: '45 mins', subject: 'BCA-202 (Database)', author: 'Prof. Anitha Rao', downloadUrl: '#' },
      { id: 'va2', name: 'Implementing Dynamic Linked Lists, Stacks, & Queues in C', type: 'Code Walkthrough', size: '62 mins', subject: 'BCA-201 (DSA)', author: 'Dr. Ramesh Kumar', downloadUrl: '#' },
      { id: 'va3', name: 'React JS Full Stack Crash Course for BCA Projects', type: 'Video Series', size: '120 mins', subject: 'BCA-402 (Web Tech)', author: 'Prof. Bhuvan Gowda', downloadUrl: '#' },
      { id: 'va4', name: 'Understanding IP Addressing, Subnetting, & CIDR Notation', type: 'Animation Walkthrough', size: '35 mins', subject: 'BCA-302 (Networks)', author: 'Dr. Vivek Varma', downloadUrl: '#' },
    ]
  },
  'source-assets': {
    title: 'BCA Project Source Code & Assets',
    description: 'Download verified starter packs, boilerplate codes, and database schemas for final year and lab projects.',
    accentColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    icon: Zap,
    files: [
      { id: 'sa1', name: 'Responsive College Portal Template (React + Tailwind CSS)', type: 'GitHub Repo', size: 'Source ZIP', subject: 'BCA-Project', author: 'Tech Club', downloadUrl: '#' },
      { id: 'sa2', name: 'Library Management System Code (Java Swing + JDBC + MySQL)', type: 'GitHub Repo', size: 'Source ZIP', subject: 'BCA-303 (Java)', author: 'Student Innovators', downloadUrl: '#' },
      { id: 'sa3', name: 'Attendance QR Scanner App System (Python OpenCV & Flask)', type: 'GitHub Repo', size: 'Source ZIP', subject: 'BCA-Project', author: 'Core Dev Team', downloadUrl: '#' },
      { id: 'sa4', name: 'E-commerce Database SQL Script & Schema Architecture Diagram', type: 'SQL Script', size: '12 KB', subject: 'BCA-202 (Database)', author: 'Prof. Anitha Rao', downloadUrl: '#' },
    ]
  }
};

const bcaSyllabus = [
  {
    semester: 1,
    title: 'Semester 1',
    subjects: [
      { code: 'BCA-101', name: 'Programming in C', credits: 4, type: 'Core Theory + Practical' },
      { code: 'BCA-102', name: 'Computer Fundamentals & IT', credits: 3, type: 'Core Theory' },
      { code: 'BCA-103', name: 'Mathematical Foundation', credits: 4, type: 'Allied Mathematics' },
      { code: 'BCA-104', name: 'Technical Communication', credits: 2, type: 'Ability Enhancement' }
    ]
  },
  {
    semester: 2,
    title: 'Semester 2',
    subjects: [
      { code: 'BCA-201', name: 'Data Structures using C', credits: 4, type: 'Core Theory + Practical' },
      { code: 'BCA-202', name: 'Database Management Systems', credits: 4, type: 'Core Theory + Practical' },
      { code: 'BCA-203', name: 'OOPs with C++', credits: 3, type: 'Core Theory' },
      { code: 'BCA-204', name: 'Environmental Studies', credits: 2, type: 'Ability Enhancement' }
    ]
  },
  {
    semester: 3,
    title: 'Semester 3 (Current)',
    subjects: [
      { code: 'BCA-301', name: 'Operating Systems', credits: 4, type: 'Core Theory' },
      { code: 'BCA-302', name: 'Computer Networks', credits: 4, type: 'Core Theory' },
      { code: 'BCA-303', name: 'Java Programming', credits: 4, type: 'Core Theory + Practical' },
      { code: 'BCA-304', name: 'Software Engineering', credits: 3, type: 'Core Theory' }
    ]
  },
  {
    semester: 4,
    title: 'Semester 4',
    subjects: [
      { code: 'BCA-401', name: 'Python Programming & Scripting', credits: 4, type: 'Core Theory + Practical' },
      { code: 'BCA-402', name: 'Web Technology (React, Node)', credits: 4, type: 'Core Theory + Practical' },
      { code: 'BCA-403', name: 'Cloud Computing & DevOps', credits: 3, type: 'Core Elective' },
      { code: 'BCA-404', name: 'Introduction to AI & ML', credits: 3, type: 'Specialization' }
    ]
  }
];

export default function StudentPortal() {
  const [studentData, setStudentData] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([
    { day: 'Mon', time: '09:00 AM', subject: 'Cloud Computing', room: 'Lab 402', color: 'bg-blue-500' },
    { day: 'Mon', time: '11:30 AM', subject: 'Machine Learning', room: 'Hall A', color: 'bg-indigo-500' },
    { day: 'Tue', time: '10:00 AM', subject: 'Cyber Security', room: 'Lab 101', color: 'bg-rose-500' },
    { day: 'Tue', time: '02:00 PM', subject: 'Applied Ethics', room: 'LRC 2', color: 'bg-amber-500' },
  ]);
  const [assignments, setAssignments] = useState<any[]>([
    { id: 1, title: 'Final Project Milestone 1', subject: 'Cloud Computing', dueDate: 'Nov 24', status: 'Pending', priority: 'High' },
    { id: 2, title: 'Weekly Ethical Case Study', subject: 'Applied Ethics', dueDate: 'Nov 26', status: 'Submitted', priority: 'Medium' },
    { id: 3, title: 'Neural Network Documentation', subject: 'Machine Learning', dueDate: 'Nov 28', status: 'Pending', priority: 'Urgent' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    course: '',
    gpa: '',
    subjects: [] as { subject: string, score: number }[]
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const navigate = useNavigate();

  const [selectedHubKey, setSelectedHubKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBcaSemester, setActiveBcaSemester] = useState<number>(3);
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);

  useEffect(() => {
    if (studentData) {
        setEditForm(prev => ({
            ...prev,
            name: studentData.name || '',
            course: studentData.course !== 'Not Set' ? studentData.course : '',
            gpa: studentData.gpa?.toString() || '0'
        }));
    }
    if (marks.length > 0) {
        setEditForm(prev => ({
            ...prev,
            subjects: marks
        }));
    }
  }, [studentData, marks]);

  useEffect(() => {
    const fetchProfile = async () => {
      let activeStudentId: string | null = null;
      
      const sessionStr = localStorage.getItem('student_session');
      if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            activeStudentId = session.studentId;
          } catch (e) {
            localStorage.removeItem('student_session');
          }
      } 
      
      if (!activeStudentId && auth.currentUser) {
          const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userSnap.exists()) {
              const userData = userSnap.data();
              if (userData.role === 'student' && userData.studentId) {
                  activeStudentId = userData.studentId;
              }
          }
      }

      if (!activeStudentId) {
          setIsLoading(false);
          return;
      }

      // Live student profile
      const studentUnsub = onSnapshot(collection(db, 'students'), (snap) => {
          const s = snap.docs.find(d => d.data().studentId === activeStudentId);
          if (s) setStudentData({ id: s.id, ...s.data() });
      });

      // Live marks
      const marksQuery = query(collection(db, 'marks'), where('studentId', '==', activeStudentId.toUpperCase()));
      const marksUnsub = onSnapshot(marksQuery, (snap) => {
          const subjectMap: Record<string, any> = {};
          const sortedDocs = [...snap.docs].sort((a, b) => 
              new Date(b.data().date).getTime() - new Date(a.data().date).getTime()
          );

          sortedDocs.forEach(doc => {
              const data = doc.data();
              if (!subjectMap[data.subject]) {
                  subjectMap[data.subject] = {
                      subject: data.subject,
                      score: data.score
                  };
              }
          });
          setMarks(Object.values(subjectMap));
      });

      // Live attendance
      const attQuery = query(collection(db, 'attendance'), where('studentId', '==', activeStudentId));
      const attUnsub = onSnapshot(attQuery, (snap) => {
          setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setIsLoading(false);
      });

      return () => {
          studentUnsub();
          marksUnsub();
          attUnsub();
      };
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('student_session');
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  const handleUpdateProfile = async () => {
    if (!studentData?.id) return;
    setIsSavingProfile(true);
    try {
        await updateDoc(doc(db, 'students', studentData.id), {
            name: editForm.name,
        });

        toast.success("Identity profile updated");
        setIsEditingProfile(false);
    } catch (error) {
        console.error(error);
        toast.error("Update failed. Please check your connection.");
    } finally {
        setIsSavingProfile(false);
    }
  };

  const generateAIAnalysis = async () => {
    if (!studentData) return;
    setIsAnalyzing(true);
    try {
        const response = await fetch('/api/analyze-performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                studentData: {
                    ...studentData,
                    marks,
                    attendanceCount: attendance.length
                }
            })
        });
        const data = await response.json();
        if (data.analysis) {
            setAiAnalysis(data.analysis);
            toast.success("AI Insights Generated!");
        } else {
            throw new Error("No analysis returned");
        }
    } catch (error) {
        toast.error("The AI assistant is busy. Try again in a moment.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );
  }

  if (!studentData) {
      return (
          <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-center p-6">
              <User className="w-16 h-16 text-slate-300" />
              <h2 className="text-xl font-bold">Profile Loading Error</h2>
              <p className="text-slate-500 max-w-xs">We couldn't link your session. Please login again.</p>
              <Button onClick={handleSignOut} variant="outline" className="rounded-full">Back to Login</Button>
          </div>
      )
  }

  const skillData = marks.map(m => ({
    subject: m.subject,
    A: m.score,
    fullMark: 100
  }));

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">Student<span className="text-blue-600">Sync</span></span>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors focus:outline-none cursor-pointer">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-[32px] border-none shadow-2xl p-4 ring-1 ring-slate-100">
                <DropdownMenuLabel className="font-black text-slate-900 px-2 pb-4 text-lg tracking-tighter">Academic Feed</DropdownMenuLabel>
                <DropdownMenuSeparator className="hidden" />
                <div className="space-y-2">
                    <DropdownMenuItem className="p-4 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-100 focus:bg-blue-50/50 cursor-pointer transition-all">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 tracking-tight">Gemini Insight Ready</p>
                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed mt-0.5">Your updated performance analysis for {new Date().toLocaleDateString('en-US', { month: 'long' })} is live.</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-1 h-1 rounded-full bg-blue-600" />
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">System • Now</p>
                                </div>
                            </div>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-4 rounded-2xl hover:bg-slate-50 cursor-pointer border border-transparent transition-all">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <ScanLine className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 tracking-tight">Attendance Logged</p>
                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed mt-0.5">Verified entry at North Gate terminal recorded successfully.</p>
                                <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">Gate Terminal • 1h ago</p>
                            </div>
                        </div>
                    </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="my-4 bg-slate-100" />
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 rounded-xl h-10">
                    Clear Workspace Feed
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-8 w-px bg-slate-100 mx-1" />
            <div className="hidden sm:block text-right">
                <p className="text-sm font-black text-slate-900">{studentData.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{studentData.studentId}</p>
            </div>
            <div className="h-8 w-px bg-slate-100 mx-1" />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-red-500 rounded-full hover:bg-red-50">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Hi, {studentData.name.split(' ')[0]} 👋</h1>
                    <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                        <DialogTrigger className="rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest px-4 h-8 cursor-pointer border border-transparent transition-colors hover:text-slate-900 text-slate-700">
                            Update Profile
                        </DialogTrigger>
                        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-slate-900">Portal Profile</DialogTitle>
                                <DialogDescription className="font-bold text-slate-400">Manage your publicly visible identity details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preferred Name</Label>
                                    <Input 
                                        className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Academic Major</Label>
                                    <Input 
                                        disabled
                                        className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold opacity-50 cursor-not-allowed"
                                        value={editForm.course}
                                        placeholder="Controlled by Administration"
                                    />
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Notice</p>
                                    <p className="text-xs text-blue-800 font-bold leading-relaxed">
                                        Academic records (GPA, Marks, Attendance) are verified by the Faculty Terminal and cannot be modified here.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    onClick={handleUpdateProfile} 
                                    disabled={isSavingProfile}
                                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl"
                                >
                                    {isSavingProfile ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <p className="text-slate-500 font-medium mt-1">Ready for today's academic challenges?</p>
            </motion.div>
            <Button 
                onClick={generateAIAnalysis}
                disabled={isAnalyzing}
                className="rounded-2xl bg-slate-900 hover:bg-black text-white h-14 px-8 font-black shadow-xl shadow-slate-200 gap-3"
            >
                {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-400" />}
                Gemini AI Advisor
            </Button>
        </div>

        {/* AI Insight Section */}
        <AnimatePresence>
            {aiAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                >
                    <Card className="rounded-[40px] border-none shadow-2xl bg-white overflow-hidden ring-1 ring-amber-100">
                        <CardHeader className="bg-gradient-to-r from-amber-50/50 to-transparent border-b border-amber-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-400 p-2 rounded-xl">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black text-slate-900">Performance Intelligence</CardTitle>
                                        <CardDescription className="font-bold text-amber-600/80">Tailored by Gemini AI</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setAiAnalysis(null)} className="rounded-full hover:bg-amber-50">Dismiss</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 prose prose-slate max-w-none">
                            <div className="markdown-body text-slate-700 leading-relaxed">
                                <Markdown>{aiAnalysis}</Markdown>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Core Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="rounded-[40px] border-none shadow-xl p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="relative z-10">
                    <Award className="w-12 h-12 mb-8 text-blue-200" />
                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Academic GPA</p>
                    <h2 className="text-5xl font-black tracking-tighter">{studentData.gpa} <span className="text-xl opacity-60 font-medium">/ 4.0</span></h2>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Performance Rank: Tier 1</span>
                    <Target className="w-4 h-4 text-blue-300" opacity={0.5} />
                </div>
            </Card>

            <Card className="rounded-[40px] border border-white shadow-xl p-8 bg-white flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="bg-emerald-50 p-4 rounded-2xl">
                        <Clock className="w-7 h-7 text-emerald-600" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1 font-black text-[10px] uppercase tracking-widest">Active Status</Badge>
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Attendance Rate</p>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{studentData.attendanceRate}%</h2>
                </div>
                <div className="mt-8 h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${studentData.attendanceRate}%` }}
                      className="h-full bg-emerald-500 rounded-full" 
                    />
                </div>
            </Card>

            <Card className="rounded-[40px] border border-white shadow-xl p-8 bg-white flex flex-col justify-between overflow-hidden">
                <div className="mb-8">
                    <div className="bg-amber-50 p-4 rounded-2xl w-fit">
                        <BookOpen className="w-7 h-7 text-amber-600" />
                    </div>
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Major Specialization</p>
                    <h2 className="text-2xl font-black text-slate-900 truncate">{studentData.course}</h2>
                </div>
                <div className="mt-8 flex gap-3">
                    <Badge variant="outline" className="text-slate-500 border-slate-100 h-8 px-4 font-bold">L4-S2</Badge>
                    <Badge variant="outline" className="text-slate-500 border-slate-100 h-8 px-4 font-bold">AY 2024</Badge>
                </div>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Subject Mastery Radar */}
            <Card className="rounded-[44px] border border-white bg-white shadow-2xl overflow-hidden">
                <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-2xl font-black flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-2xl">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        Subject Equilibrium
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold ml-14">Holistic performance mapping</CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12 pt-6">
                    {skillData.length > 0 ? (
                        <div className="h-[340px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                                <PolarGrid stroke="#F1F5F9" />
                                <PolarAngleAxis dataKey="subject" tick={{fill: '#64748B', fontSize: 11, fontWeight: 800}} />
                                <Radar
                                    name="Your Score"
                                    dataKey="A"
                                    stroke="#2563EB"
                                    strokeWidth={4}
                                    fill="url(#radarGradient)"
                                    fillOpacity={0.6}
                                />
                                <defs>
                                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[340px] flex flex-col items-center justify-center text-slate-300 gap-6">
                            <div className="bg-slate-50 p-10 rounded-full border border-slate-100">
                                <Award className="w-12 h-12 opacity-30" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40">Data Integration Pending</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attendance Ledger */}
            <Card className="rounded-[44px] border border-white bg-white shadow-2xl overflow-hidden">
                <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-2xl font-black flex items-center gap-4">
                        <div className="bg-emerald-50 p-3 rounded-2xl">
                            <MapPin className="w-6 h-6 text-emerald-600" />
                        </div>
                        Campus Footprint
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold ml-14">Recent verified campus entries</CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12 pt-8">
                    <div className="space-y-4">
                        {attendance.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-6">
                                <div className="bg-slate-50 p-8 rounded-full">
                                    <MapPin className="w-12 h-12 text-slate-200" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">No Activity Recorded</p>
                            </div>
                        ) : attendance.slice(0, 5).map((log, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={log.id} 
                                className="group flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-lg transition-all cursor-default"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="p-3.5 rounded-2xl bg-white border border-slate-100 group-hover:scale-110 transition-transform">
                                        <Calendar className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-900">
                                            {new Date(log.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • North Gate
                                        </p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black px-5 py-2 rounded-2xl text-[10px] uppercase tracking-[0.15em]">Verified</Badge>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* NEW: Institutional Workflow Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Class Schedule */}
            <Card className="lg:col-span-2 rounded-[44px] border border-white bg-white shadow-2xl overflow-hidden">
                <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-2xl font-black flex items-center gap-4">
                        <div className="bg-slate-900 p-3 rounded-2xl">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        Academic Itinerary
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold ml-14">Your real-time lecture schedule</CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {schedule.map((slot, idx) => (
                            <div key={idx} className="flex gap-4 p-5 rounded-[32px] bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors group">
                                <div className={cn("w-2 rounded-full", slot.color)} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-black text-slate-900 leading-tight">{slot.subject}</p>
                                        <Badge variant="ghost" className="bg-white text-[9px] font-black px-2 py-0.5 rounded-lg border-slate-200">{slot.day}</Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">{slot.time}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">{slot.room}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Assignments & Deadlines */}
            <Card className="rounded-[44px] border border-white bg-white shadow-2xl overflow-hidden flex flex-col">
                <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-2xl font-black flex items-center gap-4">
                        <div className="bg-rose-50 p-3 rounded-2xl">
                            <Target className="w-6 h-6 text-rose-600" />
                        </div>
                        Deadlines
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold ml-14">Action priority list</CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12 pt-8 flex-1">
                    <div className="space-y-4">
                        {assignments.map((task) => (
                            <div key={task.id} className="p-5 rounded-[32px] border border-slate-100 hover:shadow-lg transition-all space-y-3 bg-white relative overflow-hidden">
                                {task.priority === 'Urgent' && <div className="absolute top-0 right-0 h-10 w-10 bg-rose-500 rounded-bl-[24px] flex items-center justify-center p-2"><Zap className="w-4 h-4 text-white animate-pulse" /></div>}
                                <div className="pr-8">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{task.subject}</p>
                                    <p className="text-sm font-black text-slate-900 mt-1 leading-tight">{task.title}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-bold">Due {task.dueDate}</span>
                                    </div>
                                    <Badge className={cn(
                                        "font-black text-[9px] px-3 py-1 rounded-full border-none",
                                        task.status === 'Submitted' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                                    )}>{task.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-6 rounded-2xl h-12 font-black text-slate-400 border border-slate-50 hover:bg-slate-50 hover:text-slate-900 transition-all">
                        View Assignment Archive
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Resources & Library Explorer */}
        <section className="pt-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Resource Hub</h2>
                    <p className="text-slate-500 font-medium">Synced Cloud Library for your BCA courses</p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => setIsSyllabusOpen(true)}
                    className="rounded-2xl h-12 px-6 font-black border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <GraduationCap className="w-5 h-5 mr-3 text-blue-600" /> BCA Course Syllabus
                </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { key: 'lecture-notes', name: 'BCA Lecture Notes', count: '6 Core Files', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
                    { key: 'assessment-prep', name: 'BCA Assessment Prep', count: '4 Solved Papers', icon: Target, color: 'bg-rose-50 text-rose-600' },
                    { key: 'video-archive', name: 'BCA Video Archive', count: '4 Tutorials', icon: Sparkles, color: 'bg-amber-50 text-amber-600' },
                    { key: 'source-assets', name: 'BCA Source Assets', count: '4 Projects', icon: Zap, color: 'bg-emerald-50 text-emerald-600' },
                ].map((hub) => (
                    <Card 
                        key={hub.key} 
                        onClick={() => {
                            setSelectedHubKey(hub.key);
                            setSearchQuery('');
                        }}
                        className="rounded-[40px] border-none shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all p-8 cursor-pointer group bg-white border border-transparent hover:border-slate-100"
                    >
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", hub.color)}>
                            <hub.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">{hub.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{hub.count}</p>
                    </Card>
                ))}
            </div>
        </section>

        {/* Dynamic Resource Hub Dialog */}
        <Dialog open={!!selectedHubKey} onOpenChange={(open) => { if (!open) setSelectedHubKey(null); }}>
            <DialogContent className="max-w-4xl rounded-[40px] border-none shadow-2xl p-8 bg-white max-h-[85vh] overflow-y-auto">
                {selectedHubKey && bcaResourcesData[selectedHubKey] && (() => {
                    const hub = bcaResourcesData[selectedHubKey];
                    const HubIcon = hub.icon;
                    
                    // Filter files based on query
                    const filteredFiles = hub.files.filter(f => 
                        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        f.author.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    return (
                        <div className="space-y-6">
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    <div className={cn("p-4 rounded-3xl", hub.badgeBg)}>
                                        <HubIcon className="w-8 h-8" />
                                    </div>
                                    <div className="text-left">
                                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">{hub.title}</DialogTitle>
                                        <DialogDescription className="font-bold text-slate-400 mt-1">{hub.description}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <Input 
                                    placeholder="Search by topic, course code, or professor..." 
                                    className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold focus-visible:ring-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Files list */}
                            <div className="space-y-3 mt-4">
                                {filteredFiles.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 font-bold">
                                        No BCA resources match your search query.
                                    </div>
                                ) : (
                                    filteredFiles.map((file) => (
                                        <div 
                                            key={file.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/10 transition-all gap-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500">
                                                    {selectedHubKey === 'video-archive' ? (
                                                        <Video className="w-5 h-5 text-amber-500" />
                                                    ) : selectedHubKey === 'source-assets' ? (
                                                        <Code className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                        <FileText className="w-5 h-5 text-blue-500" />
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-slate-900 leading-snug">{file.name}</p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-semibold">
                                                        <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{file.subject}</span>
                                                        <span>•</span>
                                                        <span>{file.type}</span>
                                                        <span>•</span>
                                                        <span>{file.size}</span>
                                                        <span>•</span>
                                                        <span className="text-slate-400">By {file.author}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => {
                                                    toast.success(`Download started: ${file.name}`, {
                                                        description: `Retrieved successfully from BCA cloud vault.`,
                                                    });
                                                }}
                                                className="h-11 px-5 rounded-xl bg-slate-950 hover:bg-black font-black text-xs uppercase tracking-wider text-white gap-2 cursor-pointer self-start sm:self-center"
                                            >
                                                <Download className="w-4 h-4 text-white" />
                                                Retrieve
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <DialogFooter className="pt-4 border-t border-slate-100">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setSelectedHubKey(null)}
                                    className="rounded-xl font-black text-xs uppercase tracking-wider h-11 border-slate-200"
                                >
                                    Close Vault
                                </Button>
                            </DialogFooter>
                        </div>
                    );
                })()}
            </DialogContent>
        </Dialog>

        {/* BCA Course Syllabus Overview Dialog */}
        <Dialog open={isSyllabusOpen} onOpenChange={setIsSyllabusOpen}>
            <DialogContent className="max-w-4xl rounded-[40px] border-none shadow-2xl p-8 bg-white max-h-[85vh] overflow-y-auto">
                <div className="space-y-6">
                    <DialogHeader>
                        <div className="flex items-start gap-4">
                            <div className="p-4 rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                                <GraduationCap className="w-8 h-8" />
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">BCA Curriculum & Credits</DialogTitle>
                                <DialogDescription className="font-bold text-slate-400 mt-1">Bachelor of Computer Applications official course progression</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Semester Tabs */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                        {bcaSyllabus.map((sem) => (
                            <button
                                key={sem.semester}
                                onClick={() => setActiveBcaSemester(sem.semester)}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                                    activeBcaSemester === sem.semester 
                                        ? "bg-white text-slate-900 shadow-sm font-black" 
                                        : "text-slate-500 hover:text-slate-900 font-bold"
                                )}
                            >
                                {sem.title}
                            </button>
                        ))}
                    </div>

                    {/* Syllabus Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bcaSyllabus.find(s => s.semester === activeBcaSemester)?.subjects.map((sub, idx) => (
                            <div key={idx} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-slate-100/30 transition-all text-left">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">{sub.code}</span>
                                    <span className="text-xs font-black text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-lg">{sub.credits} Credits</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-950 mt-3 leading-snug">{sub.name}</h4>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-400">{sub.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="pt-4 border-t border-slate-100">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsSyllabusOpen(false)}
                            className="rounded-xl font-black text-xs uppercase tracking-wider h-11 border-slate-200"
                        >
                            Close Curriculum
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
      </main>
      
      <AIChatbox studentData={studentData} />
    </div>
  );
}

