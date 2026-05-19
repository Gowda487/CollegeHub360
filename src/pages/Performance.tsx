import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Target, 
  Lightbulb, 
  Compass, 
  Loader2,
  LineChart,
  BrainCircuit,
  Star,
  Search,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function PerformancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentList);
      if (studentList.length > 0 && !selectedStudent) {
        setSelectedStudent(studentList[0]);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      const q = query(
        collection(db, 'marks'), 
        where('studentId', '==', selectedStudent.studentId.toUpperCase())
      );
      
      const unsub = onSnapshot(q, (snapshot) => {
        // Aggregate unique subjects, taking the latest score
        const subjectMap: Record<string, any> = {};
        const sortedDocs = [...snapshot.docs].sort((a, b) => 
            new Date(b.data().date).getTime() - new Date(a.data().date).getTime()
        );

        sortedDocs.forEach(doc => {
            const data = doc.data();
            if (!subjectMap[data.subject]) {
                subjectMap[data.subject] = {
                    subject: data.subject,
                    score: data.score,
                    maxScore: data.maxScore || 100,
                    date: data.date
                };
            }
        });
        setMarks(Object.values(subjectMap));
      });
      return () => unsub();
    }
  }, [selectedStudent]);

  const runAIAnalysis = async () => {
    if (!selectedStudent) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const response = await fetch('/api/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentData: { ...selectedStudent, marks } }),
      });
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const skillData = marks.map(m => ({
    subject: m.subject,
    A: m.score,
    fullMark: 100
  }));

  if (isLoading) {
    return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Performance Analysis</h1>
          <p className="text-[#6B7280]">Real-time student insights and career intelligence.</p>
        </div>
        <div className="flex gap-4">
            <select 
                className="h-12 px-4 rounded-full border-none bg-white shadow-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
                value={selectedStudent?.id || ''}
                onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value))}
            >
                {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                ))}
            </select>
            <Button 
                onClick={runAIAnalysis} 
                disabled={isAnalyzing || !selectedStudent}
                className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg gap-3"
            >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
            Analyze {selectedStudent?.name?.split(' ')[0]}
            </Button>
        </div>
      </div>

      {!selectedStudent ? (
          <Card className="p-20 text-center rounded-[32px] border-dashed border-2">
              <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No Students Found</h3>
              <p className="text-slate-500">Go to Dashboard to seed initial data or Attendance to scan IDs.</p>
          </Card>
      ) : (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Summary and Radar */}
                <Card className="lg:col-span-1 rounded-[32px] border-none shadow-sm h-fit">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Skill Assessment: {selectedStudent.name}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="subject" tick={{fill: '#4B5563', fontSize: 10}} />
                        <Radar
                            name="Student Performance"
                            dataKey="A"
                            stroke="#2563EB"
                            fill="#3B82F6"
                            fillOpacity={0.6}
                        />
                        </RadarChart>
                    </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50">
                            <div className="flex items-center gap-3">
                                <Star className="w-4 h-4 text-blue-600 fill-current" />
                                <span className="text-sm font-semibold">Current GPA</span>
                            </div>
                            <span className="font-bold text-blue-700">{selectedStudent.gpa || 'N/A'} / 4.0</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50">
                            <div className="flex items-center gap-3">
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-semibold">Attendance</span>
                            </div>
                            <span className="font-bold text-emerald-700">{selectedStudent.attendanceRate || '0'}%</span>
                        </div>
                    </div>
                </CardContent>
                </Card>

                {/* Right: AI Analysis Content */}
                <Card className="lg:col-span-2 rounded-[32px] border-none shadow-sm flex flex-col min-h-[500px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Compass className="w-5 h-5 text-blue-600" />
                        Career & Study Intelligence
                    </CardTitle>
                    <CardDescription>Generative insights based on actual performance in {marks.length} subjects.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    {!analysis && !isAnalyzing ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                            <Zap className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Ready for Insights</h3>
                        <p className="text-[#6B7280] max-w-sm">Click the analysis button above to generate personalized recommendations for this student.</p>
                    </div>
                    ) : isAnalyzing ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <p className="font-medium text-slate-600 animate-pulse">Consulting AI Academic Advisor...</p>
                    </div>
                    ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="prose prose-blue max-w-none text-[#4B5563]"
                    >
                        <div className="p-6 rounded-3xl bg-[#F9FAFB] border border-[#E5E7EB] mb-6">
                            <div className="flex items-center gap-2 text-blue-600 font-bold mb-4 uppercase tracking-widest text-xs">
                                <Lightbulb className="w-4 h-4" />
                                Smart Recommendations
                            </div>
                            <div className="markdown-body">
                            <ReactMarkdown>
                                {analysis || ""}
                            </ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                    )}
                </CardContent>
                </Card>
            </div>

            {/* Historical Trend */}
            <Card className="rounded-[32px] border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LineChart className="w-5 h-5 text-blue-600" />
                        Performance Trajectory
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={[
                            { name: 'Sem 1', score: 72, avg: 68 },
                            { name: 'Sem 2', score: 78, avg: 70 },
                            { name: 'Sem 3', score: 85, avg: 72 },
                            { name: 'Sem 4', score: 82, avg: 74 },
                            { name: 'Sem 5', score: (selectedStudent.gpa * 25) || 91, avg: 75 },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                            <Tooltip cursor={{fill: '#F3F4F6'}} />
                            <Legend iconType="circle" />
                            <Bar dataKey="score" name="Student Score" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                            <Line type="monotone" dataKey="avg" name="Class Average" stroke="#94A3B8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </>
      )}
    </div>
  );
}

function UserCheck({ className }: { className?: string }) {
    return <User className={className} />;
}
