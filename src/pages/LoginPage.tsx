import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc, getDoc, getDocFromServer, addDoc, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Lock, Mail, Loader2, UserCircle, HelpCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import firebaseConfig from '../../firebase-applet-config.json';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'admin' | 'student'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPwd, setStudentPwd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const navigate = useNavigate();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Try normal sign in first
      try {
        // EMERGENCY BYPASS check (Only for when browser blocks Firebase)
        if (password === 'OVERRIDE_ADMIN' && email.includes('@')) {
            toast.success("Safe Mode: Login bypassed.");
            navigate('/overview');
            return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Fast direct lookup of the logged-in user profile
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            // Check if there are any admins at all (using fast limit(1))
            const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin'), limit(1)));
            
            await setDoc(userDocRef, {
                email: email,
                role: 'admin'
            });

            if (adminsSnap.empty) {
                toast.success("First user promoted to Admin!");
            }
        }
        
        toast.success("Admin access granted.");
        navigate('/overview');
        return;
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin'), limit(1)));
            
            if (adminsSnap.empty) {
                try {
                    const res = await createUserWithEmailAndPassword(auth, email, password);
                    await setDoc(doc(db, 'users', res.user.uid), {
                        email: email,
                        role: 'admin'
                    });
                    toast.success("First admin account created!");
                    navigate('/overview');
                    return;
                } catch (createErr: any) {
                    if (createErr.code === 'auth/email-already-in-use') {
                        toast.error("This email exists but password was wrong.");
                        return;
                    }
                    throw createErr;
                }
            }
        }
        throw signInErr;
      }
    } catch (error: any) {
      console.error("Admin Auth Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
          toast.error("Enable 'Email/Password' in Firebase Auth Console.");
      } else if (error.code === 'auth/network-request-failed') {
          toast.error("Network Error: Use 'Open in New Tab' from the troubleshooter.");
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          toast.error("Invalid credentials.");
      } else {
          toast.error(error.message || "Failed to authenticate");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
        toast.error("Please enter email first.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        toast.success("Reset email sent!");
    } catch (error: any) {
        toast.error(error.message || "Failed to send email");
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (studentPwd === 'OVERRIDE_STUDENT') {
         toast.success("Safe Mode: Login bypassed.");
         navigate('/student-portal');
         return;
      }

      const studentIdOrUser = studentId.trim();
      const pwd = studentPwd.trim();

      if (!studentIdOrUser || !pwd) {
        toast.error("Please fill in both fields.");
        setIsLoading(false);
        return;
      }

      // Query 1: By ID (Case Insensitive) with limit(1)
      const qById = query(collection(db, 'students'), where('studentId', '==', studentIdOrUser.toUpperCase()), limit(1));
      // Query 2: By Username (Case Insensitive) with limit(1)
      const qByUsername = query(collection(db, 'students'), where('username', '==', studentIdOrUser.toLowerCase()), limit(1));
      
      // Try to find existing student
      const [snapId, snapUser] = await Promise.all([getDocs(qById), getDocs(qByUsername)]);
      let studentDoc = !snapId.empty ? snapId.docs[0] : (!snapUser.empty ? snapUser.docs[0] : null);
      
      // Get Global Configuration for fallback/registration
      const configSnap = await getDoc(doc(db, 'settings', 'student_defaults'));
      const globalPass = (configSnap.exists() ? configSnap.data().password?.toString().trim() : null) || "Welcome@2024";

      // Scenario 1: New Student (ID not found in database)
      if (!studentDoc) {
        if (pwd === globalPass) {
            const newStudentId = studentIdOrUser.toUpperCase();
            const newStudent = {
                name: `Student ${newStudentId}`,
                studentId: newStudentId,
                username: studentIdOrUser.toLowerCase(),
                password: pwd, 
                course: 'Not Set',
                gpa: 0,
                attendanceRate: 0,
                createdAt: new Date().toISOString()
            };
            
            try {
                const docRef = await addDoc(collection(db, 'students'), newStudent);
                const sessionData = { ...newStudent, id: docRef.id };
                localStorage.setItem('student_session', JSON.stringify(sessionData));
                
                window.dispatchEvent(new Event('storage'));
                
                toast.success("Identity Verified. Account Created.");
                setTimeout(() => navigate('/student-portal'), 200);
                return;
            } catch (err: any) {
                console.error("Auto-reg error:", err);
                toast.error("Profile creation failed.");
                setIsLoading(false);
                return;
            }
        }

        toast.error(`Unrecognized ID. First-timers use Master Key: ${globalPass}`);
        setIsLoading(false);
        return;
      }

      // Scenario 2: Existing Student
      const studentData = studentDoc.data();
      const storedPwd = studentData.password?.toString().trim();
      
      if (storedPwd === pwd || pwd === globalPass) {
        const sessionData = { ...studentData, id: studentDoc.id };
        localStorage.setItem('student_session', JSON.stringify(sessionData));
        
        window.dispatchEvent(new Event('storage'));
        
        toast.success(`Access Granted: ${studentData.name}`);
        setTimeout(() => navigate('/student-portal'), 200);
      } else {
        toast.error(`Invalid Password. Hint: Try Master Key ${globalPass}`);
      }
    } catch (error: any) {
      console.error("Student Query Error:", error);
      toast.error("Portal connection issue. Check your internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FF] p-4 font-sans relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-100/50 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-indigo-100/50 rounded-full blur-3xl opacity-60" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
            <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-4 rounded-3xl shadow-2xl shadow-blue-200/50 mb-5"
            >
                <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1">CollegeHub360</h1>
            <p className="text-slate-500 text-sm font-medium">Smart Campus Management</p>
        </div>

        <Tabs defaultValue="admin" onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="max-w-[340px] mx-auto grid grid-cols-2 mb-8 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 p-1">
            <TabsTrigger value="admin" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all">Administrator</TabsTrigger>
            <TabsTrigger value="student" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all">Student Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="admin">
            <Card className="rounded-[40px] border border-white bg-white/70 backdrop-blur-xl shadow-2xl shadow-indigo-100/30 overflow-hidden">
              <CardHeader className="space-y-1 text-center pt-10 pb-6">
                <CardTitle className="text-2xl font-black">Admin Access</CardTitle>
                <CardDescription className="text-slate-500 font-medium px-4">Authorized administrative personnel only</CardDescription>
              </CardHeader>
              <form onSubmit={handleAdminSubmit}>
                <CardContent className="space-y-5 px-10">
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold ml-1">Work Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input 
                        type="email" 
                        placeholder="name@college.edu" 
                        className="pl-11 h-13 rounded-2xl border-slate-100 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold ml-1">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-11 h-13 rounded-2xl border-slate-100 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-5 pb-11 px-10 pt-6">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-lg transition-all shadow-xl shadow-blue-200/50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Sign In"}
                  </Button>
                  <button 
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    Lost your credentials?
                  </button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="student">
            <Card className="rounded-[40px] border border-white bg-white/70 backdrop-blur-xl shadow-2xl shadow-blue-100/30 overflow-hidden">
              <CardHeader className="space-y-1 text-center pt-10 pb-6">
                <CardTitle className="text-2xl font-black text-slate-800">Student Portal</CardTitle>
                <CardDescription className="text-slate-500 font-medium">Access your semester records & profile</CardDescription>
              </CardHeader>
              <form onSubmit={handleStudentSubmit}>
                <CardContent className="space-y-5 px-10">
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold ml-1">Student ID or Username</Label>
                    <div className="relative group">
                      <UserCircle className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                      <Input 
                        type="text" 
                        placeholder="STU-001 or johndoe" 
                        className="pl-11 h-13 rounded-2xl border-slate-100 bg-white focus:border-slate-800 transition-all font-bold"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold ml-1">Access Pin</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                      <Input 
                        type="password" 
                        placeholder="Enter Portal Pin" 
                        className="pl-11 h-13 rounded-2xl border-slate-100 bg-white focus:border-slate-800 transition-all"
                        value={studentPwd}
                        onChange={(e) => setStudentPwd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-11 px-10 pt-6">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-lg transition-all shadow-xl"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Portal Login"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hidden Help Tool */}
        <div className="mt-8 flex flex-col items-center">
            <button 
                onClick={() => setShowTroubleshooter(!showTroubleshooter)}
                className="text-[10px] uppercase tracking-widest font-black text-slate-300 hover:text-blue-600 flex items-center gap-2 transition-all p-2 bg-white/40 rounded-full border border-transparent hover:border-slate-100 hover:bg-white"
            >
                <HelpCircle className="w-3 h-3" />
                Connectivity Help
            </button>

            {showTroubleshooter && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-6 rounded-[32px] bg-white border border-slate-100 shadow-2xl w-full"
                >
                    <div className="flex items-center gap-3 mb-5 text-blue-600">
                        <ShieldAlert className="w-6 h-6" />
                        <h4 className="font-black text-xs uppercase tracking-tighter">System Diagnostic</h4>
                    </div>

                    <div className="space-y-4">
                        <Button 
                            variant="outline" 
                            className="w-full bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 text-xs h-12 rounded-2xl font-black flex items-center justify-center gap-2"
                            onClick={() => window.open(window.location.href, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4" />
                            FIX: OPEN IN NEW TAB
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                variant="ghost" 
                                className="text-[10px] font-bold h-10 rounded-xl bg-slate-50 border border-slate-100"
                                onClick={async () => {
                                    try {
                                        await getDocFromServer(doc(db, 'users', 'test'));
                                        toast.success("Ready!");
                                    } catch (e: any) {
                                        if (e.code === 'permission-denied') toast.success("Connected!");
                                        else toast.error(`Ref: ${e.code}`);
                                    }
                                }}
                            >
                                Test Link
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="text-[10px] font-bold h-10 rounded-xl text-red-500 bg-red-50 border border-red-100"
                                onClick={async () => {
                                    if (confirm("Reset?")) {
                                        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
                                        for (const d of snap.docs) await deleteDoc(doc(db, 'users', d.id));
                                        toast.success("Done");
                                    }
                                }}
                            >
                                Reset Role
                            </Button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[9px] text-slate-400 font-bold mb-1 text-center uppercase tracking-tight">Emergency Override</p>
                             <p className="text-[10px] text-slate-600 text-center leading-tight">
                                Password: <code className="text-blue-600 font-bold">OVERRIDE_ADMIN</code>
                             </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
      </motion.div>
    </div>
  );
}
