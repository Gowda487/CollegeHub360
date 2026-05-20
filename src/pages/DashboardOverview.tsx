import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Trophy,
  RefreshCw,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Megaphone,
  CreditCard,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AIChatbox from '@/components/AIChatbox';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, onSnapshot, getDocs, addDoc, limit, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceToday: 0,
    lateToday: 0,
    atRisk: 0
  });

  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fast loading fallback to ensure smooth user interactions
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    // Real-time listeners
    // 1. Combined students count & alerts generator (saves massive network/CPU overload)
    const studentsUnsub = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStats(prev => ({ ...prev, totalStudents: snapshot.size }));
      
      const studentAlerts = snapshot.docs
          .map(doc => {
              const data = doc.data();
              if (data.attendanceRate < 75) {
                  return { title: 'Low Attendance Warning', student: data.name, score: `${data.attendanceRate}%`, status: 'Critical' };
              }
              if (data.gpa > 3.8) {
                  return { title: 'High Performance Alert', student: data.name, score: `${data.gpa} GPA`, status: 'Excellence' };
              }
              return null;
          })
          .filter(Boolean)
          .slice(0, 3);
      
      if (studentAlerts.length === 0) {
          setRecentAlerts([
              { title: 'System Ready', student: 'All status normal', score: '100%', status: 'Excellence' }
          ]);
      } else {
          setRecentAlerts(studentAlerts);
      }
    }, (err) => {
      console.error("Error fetching students count & alerts:", err);
      setIsLoading(false);
    });

    const attendanceUnsub = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const now = new Date();
      const todayStr = now.toDateString();
      const todayCount = snapshot.docs.filter(doc => new Date(doc.data().timestamp).toDateString() === todayStr).length;
      
      setStats(prev => ({ ...prev, attendanceToday: todayCount }));

      const daily = snapshot.docs.reduce((acc: any, doc) => {
        const date = new Date(doc.data().timestamp).toLocaleDateString('en-US', { weekday: 'short' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const trend = days.map(d => ({ name: d, attendance: (daily[d] || 0) })); 
      setAttendanceTrend(trend);
    }, (err) => {
      console.error("Error fetching attendance trend:", err);
      setIsLoading(false);
    });

    // Real aggregation for academic performance trends
    const marksUnsub = onSnapshot(query(collection(db, 'marks'), limit(200)), (snapshot) => {
       const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
       const dayTotals: Record<string, { sum: number, count: number }> = {
         'Mon': { sum: 0, count: 0 },
         'Tue': { sum: 0, count: 0 },
         'Wed': { sum: 0, count: 0 },
         'Thu': { sum: 0, count: 0 },
         'Fri': { sum: 0, count: 0 }
       };

       snapshot.docs.forEach(doc => {
         const data = doc.data();
         if (data.date && data.score) {
           const d = new Date(data.date);
           const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
           if (dayTotals[dayName] !== undefined) {
             dayTotals[dayName].sum += parseFloat(data.score);
             dayTotals[dayName].count += 1;
           }
         }
       });

       const trend = days.map(d => ({
         name: d,
         performance: dayTotals[d].count > 0 ? Math.round(dayTotals[d].sum / dayTotals[d].count) : 0
       }));

       const hasData = trend.some(t => t.performance > 0);
       if (!hasData) {
         setPerformanceTrend([
           { name: 'Mon', performance: 82 },
           { name: 'Tue', performance: 85 },
           { name: 'Wed', performance: 88 },
           { name: 'Thu', performance: 84 },
           { name: 'Fri', performance: 89 }
         ]);
       } else {
         setPerformanceTrend(trend);
       }
       setIsLoading(false);
       clearTimeout(loadTimer);
    }, (err) => {
       console.error("Error fetching marks trend:", err);
       setIsLoading(false);
       clearTimeout(loadTimer);
    });

    return () => {
      clearTimeout(loadTimer);
      studentsUnsub();
      attendanceUnsub();
      marksUnsub();
    };
  }, []);

  const seedData = async () => {
    try {
      const students = [
        { studentId: 'STU9920', name: 'Alex Rivera', course: 'Computer Science', gpa: 3.8, attendanceRate: 94, password: 'password123' },
        { studentId: 'STU1021', name: 'James Miller', course: 'Physics', gpa: 2.6, attendanceRate: 62, password: 'password123' },
        { studentId: 'STU4452', name: 'Sarah Chen', course: 'Engineering', gpa: 3.9, attendanceRate: 98, password: 'password123' }
      ];

      for (const s of students) {
        await addDoc(collection(db, 'students'), s);
        // Add individual mark records for each subject
        const subjects = [
          { subject: 'Math', score: Math.floor(Math.random() * 20) + 75 },
          { subject: 'Physics', score: Math.floor(Math.random() * 20) + 75 },
          { subject: 'CS', score: Math.floor(Math.random() * 20) + 80 },
          { subject: 'English', score: Math.floor(Math.random() * 20) + 65 },
          { subject: 'Soft Skills', score: Math.floor(Math.random() * 20) + 80 },
        ];

        for (const sub of subjects) {
            await addDoc(collection(db, 'marks'), {
                studentId: s.studentId,
                studentName: s.name,
                subject: sub.subject,
                score: sub.score,
                maxMarks: 100,
                examType: 'Mid-Term',
                date: new Date().toISOString()
            });
        }
      }

      const today = new Date().toISOString();
      await addDoc(collection(db, 'attendance'), {
        studentId: 'STU9920',
        timestamp: today,
        status: 'present'
      });

      alert("Data seeded successfully!");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'students');
    }
  };

  const resetDatabase = async () => {
    if (!confirm("This will delete all student records, marks, and attendance. Continue?")) return;
    try {
        const collections = ['students', 'marks', 'attendance'];
        for (const coll of collections) {
            const snap = await getDocs(collection(db, coll));
            for (const docSnap of snap.docs) {
                await deleteDoc(doc(db, coll, docSnap.id));
            }
        }
        toast.success("Database reset successfully!");
    } catch (e) {
        toast.error("Failed to reset database.");
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Academic Overview</h1>
          <p className="text-[#6B7280]">Welcome back, Dr. Wilson. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => navigate('/students')} variant="outline" className="gap-2 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm">
                <KeyRound className="w-4 h-4" />
                Set Student Passwords
            </Button>
            <Button onClick={() => navigate('/students')} variant="outline" className="gap-2 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50">
                <Users className="w-4 h-4" />
                Manage Students
            </Button>
            {stats.totalStudents > 0 && (
                <Button onClick={resetDatabase} variant="ghost" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 gap-2 rounded-full">
                    <Trash2 className="w-4 h-4" />
                    Reset Data
                </Button>
            )}
            {stats.totalStudents === 0 && (
                <Button onClick={seedData} variant="outline" className="gap-2 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50">
                    <RefreshCw className="w-4 h-4" />
                    Seed Initial Data
                </Button>
            )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Total Students" 
          value={stats.totalStudents || "0"} 
          trend="+12% from last month"
          color="bg-blue-500" 
        />
        <StatCard 
          icon={UserCheck} 
          label="Today's Attendance" 
          value={stats.attendanceToday ? `${Math.min(100, Math.round((stats.attendanceToday / stats.totalStudents) * 100))}%` : "0%"} 
          trend="+3.1% from yesterday"
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={Clock} 
          label="Late Entries" 
          value="0" 
          trend="No reports today"
          color="bg-amber-500" 
        />
        <StatCard 
          icon={AlertTriangle} 
          label="At-Risk Students" 
          value={stats.atRisk.toString()} 
          trend="Based on attendance"
          color="bg-rose-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Chart */}
        <Card className="rounded-[32px] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend.length ? attendanceTrend : [ {name: 'Mon', attendance: 0} ]}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="rounded-[32px] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Academic Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceTrend.length ? performanceTrend : [{name: 'Mon', performance: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="performance" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="col-span-1 rounded-[32px] border-none shadow-sm md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Recent Alerts</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {recentAlerts.map((alert, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    alert.status === 'Critical' ? "bg-rose-100 text-rose-600" : 
                                    alert.status === 'Excellence' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {alert.status === 'Critical' ? <AlertTriangle className="w-5 h-5" /> : 
                                     alert.status === 'Excellence' ? <Trophy className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{alert.title}</p>
                                    <p className="text-xs text-[#6B7280]">{alert.student}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-[#1A1A1A]">{alert.score}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm flex flex-col justify-center items-center p-8 bg-blue-600 text-white text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Career Insights</h3>
            <p className="text-blue-100 text-sm mb-6">Explore personalized career pathways based on your performance trends.</p>
            <Button variant="secondary" className="w-full rounded-full font-bold">Generate Report</Button>
        </Card>

        {/* Global Security Card */}
        <Card className="rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center items-center p-8 bg-white text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Student Access Control</h3>
            <p className="text-slate-500 text-sm mb-6">Instantly set or reset passwords for all students to ensure platform security.</p>
            <Button 
                onClick={() => navigate('/students')} 
                className="w-full rounded-full font-bold bg-indigo-600 hover:bg-indigo-700"
            >
                <KeyRound className="w-4 h-4 mr-2" />
                Go to Password Manager
            </Button>
        </Card>
      </div>

      {/* NEW: Institutional Enterprise Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Broadcast Center */}
          <Card className="lg:col-span-2 rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-50 p-2.5 rounded-xl">
                            <Megaphone className="w-5 h-5 text-rose-600" />
                        </div>
                        <CardTitle className="text-lg font-black tracking-tight">Broadcast Center</CardTitle>
                    </div>
                    <Button size="sm" className="rounded-full bg-slate-900 text-xs font-black px-5">New Broadcast</Button>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-4">
                        {[
                            { title: 'End-Term Examination Schedule', date: 'Just now', scope: 'All Students', type: 'Exams' },
                            { title: 'Campus Gate Maintenance Notice', date: '2h ago', scope: 'Hostel Block', type: 'Facility' },
                            { title: 'Guest Lecture: AI in Healthcare', date: '1d ago', scope: 'CS Dept', type: 'Event' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-50 hover:bg-white hover:shadow-lg transition-all">
                                <div className="flex gap-4 items-center">
                                    <div className="w-2 h-10 rounded-full bg-slate-200" />
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">{item.title}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.scope} • {item.date}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase border-slate-200">{item.type}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card className="rounded-[40px] bg-slate-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CreditCard className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Quarterly Revenue</p>
                    <h2 className="text-4xl font-black tracking-tighter">$242,500.00</h2>
                    <div className="flex items-center gap-2 mt-2 text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold">+8.4% fee regularity</span>
                    </div>
                </div>
                <div className="mt-12 space-y-4 relative z-10">
                    <div className="flex justify-between items-end">
                        <p className="text-xs font-bold text-slate-400">Fee Clearance Rate</p>
                        <p className="text-lg font-black">92%</p>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[92%]" />
                    </div>
                    <Button variant="outline" className="w-full mt-4 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs h-12">
                        View Audit Ledger
                    </Button>
                </div>
          </Card>

          {/* Faculty Registry snippet */}
          <Card className="rounded-[32px] border-none shadow-sm bg-white p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2.5 rounded-xl">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight">Active Faculty</h3>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">Active Now</span>
                </div>
                <div className="space-y-6">
                    {[
                        { name: 'Dr. Sarah Chen', dept: 'CS & AI', active: 'Room 402' },
                        { name: 'Prof. Miller', dept: 'Applied Physics', active: 'On Leave' },
                        { name: 'Dr. Alex Rivera', dept: 'Soft Engineering', active: 'Hall A' },
                    ].map((faculty, idx) => (
                        <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                {faculty.name[0]}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">{faculty.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{faculty.dept}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 space-y-3">
                    <Button 
                        onClick={() => navigate('/marks-entry')}
                        className="w-full rounded-2xl h-14 font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                    >
                        <Sparkles className="w-5 h-5 mr-3" />
                        AI Marks Terminal
                    </Button>
                    <Button variant="ghost" className="w-full rounded-2xl h-12 font-black text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-all">
                        Full Staff Directory
                    </Button>
                </div>
          </Card>
      </div>
      
      <AIChatbox studentData={{ name: 'Administrator' }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }: any) {
  return (
    <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-2xl text-white", color)}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend.split(' ').slice(0, 1)}</span>
        </div>
        <p className="text-sm font-medium text-[#6B7280] mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-[#1A1A1A]">{value}</h3>
      </CardContent>
    </Card>
  );
}
