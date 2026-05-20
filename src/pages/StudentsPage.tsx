import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter,
  GraduationCap,
  Trash2,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, orderBy, updateDoc, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkPassword, setBulkPassword] = useState('');
  const [globalDefaultPassword, setGlobalDefaultPassword] = useState('');
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [formData, setFormData] = useState({
      name: '',
      studentId: '',
      username: '',
      course: '',
      gpa: '0.0',
      attendanceRate: '100',
      password: ''
  });

  const handleAddStudent = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAdding(true);
      try {
          await addDoc(collection(db, 'students'), {
              ...formData,
              gpa: parseFloat(formData.gpa),
              attendanceRate: parseInt(formData.attendanceRate),
              studentId: formData.studentId.toUpperCase(),
              username: formData.username.toLowerCase(),
              createdAt: new Date().toISOString()
          });
          toast.success("Student account created successfully!");
          setFormData({ name: '', studentId: '', username: '', course: '', gpa: '0.0', attendanceRate: '100', password: '' });
          // In a real app we'd close the dialog here
      } catch (error) {
          toast.error("Failed to add student.");
      } finally {
          setIsAdding(false);
      }
  };

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      handleFirestoreError(error, OperationType.LIST, 'students');
      setIsLoading(false);
    });

    // Fetch Global Config
    getDoc(doc(db, 'settings', 'student_defaults')).then(snapshot => {
      if (snapshot.exists()) {
        setGlobalDefaultPassword(snapshot.data().password || '');
      }
    });

    return () => unsub();
  }, []);

  const deleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to remove this student?")) {
      try {
        await deleteDoc(doc(db, 'students', id));
        toast.success("Student removed successfully");
      } catch (error) {
        toast.error("Failed to remove student");
      }
    }
  };

  const handleBulkPasswordReset = async () => {
    const trimmedPass = bulkPassword.trim();
    if (!trimmedPass) return toast.error("Please enter a password");
    if (trimmedPass.length < 6) return toast.error("Password must be at least 6 characters");
    
    setIsBulkUpdating(true);
    try {
        const batch = writeBatch(db);
        
        // 1. Save as Global Default (for new students)
        batch.set(doc(db, 'settings', 'student_defaults'), { 
            password: trimmedPass,
            updatedAt: new Date().toISOString()
        });

        // 2. Update existing students
        const snapshot = await getDocs(collection(db, 'students'));
        snapshot.docs.forEach((studentDoc) => {
            batch.update(studentDoc.ref, { password: trimmedPass });
        });

        await batch.commit();
        setGlobalDefaultPassword(trimmedPass);
        toast.success(snapshot.size > 0 
            ? `Global password set and applied to ${snapshot.size} students!`
            : "Global password saved! New students can now use this to scan in for the first time."
        );
        setBulkPassword('');
    } catch (error) {
        console.error("Bulk update error:", error);
        toast.error("Failed to update passwords. Check connection.");
    } finally {
        setIsBulkUpdating(false);
    }
  };

  const updateIndividualPassword = async () => {
    if (!newPassword || !editingStudent) return;
    try {
        await updateDoc(doc(db, 'students', editingStudent.id), { password: newPassword });
        toast.success("Password updated!");
        setEditingStudent(null);
        setNewPassword('');
    } catch (error) {
        toast.error("Update failed");
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Student Database</h1>
          <p className="text-[#6B7280]">Manage student records, academic status, and profiles.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            {/* Bulk Password Dialog */}
            <Dialog>
                <DialogTrigger className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 gap-2 cursor-pointer font-semibold select-none border border-transparent transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                    Global Password Setup
                </DialogTrigger>
                <DialogContent className="rounded-[32px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <KeyRound className="w-6 h-6 text-indigo-600" />
                            Set All Passwords
                        </DialogTitle>
                        <DialogDescription>
                            This will set a universal password for EVERY student in the database.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 text-indigo-800">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold">System Default: {globalDefaultPassword || "None set"}</p>
                                <p className="text-[10px] leading-relaxed opacity-80">
                                    This password applies to all existing students and is used for automatic registration of new IDs.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>New Global Password</Label>
                            <Input 
                                type="password" 
                                placeholder="Universal password (e.g. Student2024!)" 
                                value={bulkPassword}
                                onChange={(e) => setBulkPassword(e.target.value)}
                                className="rounded-xl h-12"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg shadow-indigo-100"
                            onClick={handleBulkPasswordReset}
                            disabled={isBulkUpdating}
                        >
                            {isBulkUpdating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            Apply Global Policy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 cursor-pointer font-semibold select-none transition-colors">
                    <Plus className="w-5 h-5" />
                    Add New Student
                </DialogTrigger>
            <DialogContent className="rounded-[32px] sm:max-w-[500px]">
                <form onSubmit={handleAddStudent}>
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                            Create a student profile and set their portal access password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="studentId">Student ID</Label>
                                <Input id="studentId" placeholder="STU1234" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} required className="rounded-xl uppercase" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="course">Course Name</Label>
                            <Input id="course" placeholder="B.Sc Computer Science" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} required className="rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gpa">Current GPA</Label>
                                <Input id="gpa" type="number" step="0.01" value={formData.gpa} onChange={e => setFormData({...formData, gpa: e.target.value})} required className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="att">Attendance (%)</Label>
                                <Input id="att" type="number" value={formData.attendanceRate} onChange={e => setFormData({...formData, attendanceRate: e.target.value})} required className="rounded-xl" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username (Login)</Label>
                                <Input id="username" placeholder="johndoe123" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pwd">Portal Password</Label>
                                <Input id="pwd" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="rounded-xl" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isAdding} className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700">
                            {isAdding ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                            Create Account
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-[#F3F4F6] bg-white/50 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" />
              <Input 
                placeholder="Search by name or ID..." 
                className="pl-10 h-11 rounded-xl border-[#E5E7EB] focus:ring-blue-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="rounded-xl gap-2 flex-1 md:flex-none">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F9FAFB]">
              <TableRow className="border-none">
                <TableHead className="font-bold text-[#4B5563] pl-8 py-5">Student</TableHead>
                <TableHead className="font-bold text-[#4B5563]">Student ID</TableHead>
                <TableHead className="font-bold text-[#4B5563]">Course</TableHead>
                <TableHead className="font-bold text-[#4B5563]">GPA</TableHead>
                <TableHead className="font-bold text-[#4B5563]">Attendance</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400">Loading students...</TableCell>
                  </TableRow>
              ) : filteredStudents.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400">No students found.</TableCell>
                  </TableRow>
              ) : filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-slate-50 border-b border-[#F3F4F6] transition-colors">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {student.name?.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{student.name}</p>
                        <p className="text-xs text-[#6B7280]">@{student.username || 'no-username'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-[#4B5563]">{student.studentId}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                      {student.course}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-blue-600">{student.gpa}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={cn(
                                    "h-full rounded-full",
                                    student.attendanceRate > 80 ? "bg-emerald-500" : student.attendanceRate > 70 ? "bg-amber-500" : "bg-rose-500"
                                )} 
                                style={{ width: `${student.attendanceRate}%` }}
                            />
                        </div>
                        <span className={cn(
                            "text-xs font-bold",
                            student.attendanceRate > 80 ? "text-emerald-600" : "text-amber-600"
                        )}>
                            {student.attendanceRate}%
                        </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-blue-500 hover:bg-blue-50"
                            onClick={() => setEditingStudent(student)}
                        >
                            <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => deleteStudent(student.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Individual PW Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="rounded-[32px]">
            <DialogHeader>
                <DialogTitle>Update Password</DialogTitle>
                <DialogDescription>
                    Reset the password for <b>{editingStudent?.name}</b>
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl h-12"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button className="w-full h-12 rounded-full bg-blue-600" onClick={updateIndividualPassword}>
                    Save New Password
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
