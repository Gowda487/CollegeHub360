import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { motion } from 'motion/react';
import { Camera, Scan, RefreshCw, CheckCircle2, AlertCircle, History, UserPlus, BookOpen, Sparkles, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, getDocs, where, doc, getDoc, writeBatch } from 'firebase/firestore';

export default function AttendancePage() {
  const webcamRef = useRef<Webcam>(null);
  const [isCapping, setIsCapping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExisting, setIsExisting] = useState<boolean | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("1st Year");
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const selectedClass = `${selectedYear} - ${selectedSection}`;
  const [selectedHour, setSelectedHour] = useState<string>("1st Hour");
  const [selectedSubject, setSelectedSubject] = useState<string>("Computer Networks");
  const [selectedCourse, setSelectedCourse] = useState<string>("BCA");
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [mode, setMode] = useState<'ATTENDANCE' | 'REGISTRATION' | 'AI_BATCH'>('ATTENDANCE');
  const [aiReport, setAiReport] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    phone: '',
    email: '',
    batch: '2024'
  });
  const [history, setHistory] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [scanStatus, setScanStatus] = useState<'success' | 'error' | null>(null);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back Online", {
        description: "Synchronizing pending data with cloud ledger..."
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network Lost", {
        description: "Switching to local buffered mode. Data will sync once connection is restored."
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // QR Scanning Loop
  useEffect(() => {
    let requestRef: number;
    
    const scan = () => {
      if (!isScanning || result || isProcessing) {
        requestRef = requestAnimationFrame(scan);
        return;
      }

      const video = webcamRef.current?.video;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            handleScanResult(code.data);
          }
        }
      }
      requestRef = requestAnimationFrame(scan);
    };

    requestRef = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(requestRef);
  }, [isScanning, result, isProcessing]);

  const handleScanResult = async (data: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
        let studentId = data.trim();
        let name = "Scanning...";

        // Handle JSON encoded QR codes
        try {
            const parsed = JSON.parse(data);
            if (parsed.studentId) studentId = parsed.studentId;
            if (parsed.name) name = parsed.name;
        } catch (e) {}

        const q = query(collection(db, 'students'), where('studentId', '==', studentId.toUpperCase()));
        const snap = await getDocs(q);
        
        const exists = !snap.empty;
        setIsExisting(exists);
        
        const studentInfo = { 
            studentId: studentId.toUpperCase(), 
            name: exists ? snap.docs[0].data().name : (name === 'Scanning...' ? 'New Student' : name),
            course: exists ? snap.docs[0].data().course : selectedCourse,
            batch: exists ? snap.docs[0].data().batch : '2024',
            qrData: data
        };
        setResult(studentInfo);

        if (mode === 'ATTENDANCE') {
            if (!exists) {
                toast.error("Unregistered ID. Please switch to Registration mode.", {
                    description: `ID: ${studentInfo.studentId} not found in database.`
                });
                // In attendance mode, if not found, we just reset to keep scanning
                setTimeout(() => {
                    setResult(null);
                    setIsExisting(null);
                    setIsScanning(true);
                }, 3000);
            } else {
                const studentData = snap.docs[0].data();
                // Enforce course-wise separation
                if (studentData.course !== selectedCourse) {
                    toast.warning("Course Context Mismatch", {
                        description: `Student belongs to ${studentData.course}, but terminal is set to ${selectedCourse}.`
                    });
                    setScanStatus('error');
                    setTimeout(() => {
                        setResult(null);
                        setIsExisting(null);
                        setIsScanning(true);
                        setScanStatus(null);
                    }, 3000);
                    return;
                }

                toast.success("Identity Verified. Logging entry...");
                
                await addDoc(collection(db, 'attendance'), {
                    studentId: studentInfo.studentId,
                    name: studentInfo.name,
                    course: studentInfo.course,
                    className: selectedClass,
                    subject: selectedSubject,
                    hour: selectedHour,
                    status: 'present',
                    timestamp: new Date().toISOString(),
                    isRegistrationScan: false
                });
            
                toast.success(`Welcome, ${studentInfo.name}. Entry logged.`);
                
                setScanStatus('success');
                setLastScannedName(studentInfo.name);

                setTimeout(() => {
                    setResult(null);
                    setIsExisting(null);
                    setIsScanning(true);
                    setScanStatus(null);
                }, 2000);
            }
        } else {
            // REGISTRATION MODE logic
            if (exists) {
                toast.warning("Student already registered.", {
                    description: "Switch to Attendance mode to log marks/entry."
                });
                setIsScanning(false); // Stop to show student info
            } else {
                toast.info("New ID Captured. Please complete the profile below.");
                setIsScanning(false); // Stop scanning to fill the form
            }
        }
    } catch (error) {
        console.error("QR Processing Error:", error);
        setIsScanning(true);
    } finally {
        setIsProcessing(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Error fetching attendance history:", err));
    return () => unsub();
  }, []);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setIsProcessing(true);
      try {
        const base64Content = imageSrc.split(',')[1];
        
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Content }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        // CHECK IF STUDENT EXISTS
        const q = query(collection(db, 'students'), where('studentId', '==', data.studentId.toUpperCase()));
        const snap = await getDocs(q);
        
        setIsExisting(!snap.empty);
        setResult(data);
        
        if (snap.empty) {
            toast.info("Unrecognized ID. Redirecting to Registration.");
        } else {
            toast.success("Identity Verified.");
        }
      } catch (error) {
        console.error("OCR Error:", error);
        toast.error("Failed to recognize ID card. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }
  }, [webcamRef]);

  const handleRegistrationAndAttendance = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      // 1. Create Student Profile if new
      if (!isExisting) {
          await addDoc(collection(db, 'students'), {
              studentId: result.studentId.toUpperCase(),
              name: result.name,
              course: result.course || 'Not Set',
              email: registrationData.email,
              phone: registrationData.phone,
              batch: registrationData.batch,
              password: 'STU' + result.studentId.slice(-4), // Default password
              gpa: 0,
              attendanceRate: 0,
              createdAt: new Date().toISOString()
          });
          toast.success("Profile created successfully!");
      }

      // 2. Mark Attendance with Class context
      await addDoc(collection(db, 'attendance'), {
        studentId: result.studentId,
        name: result.name,
        course: result.course,
        className: selectedClass,
        subject: selectedSubject,
        hour: selectedHour,
        status: 'present',
        timestamp: new Date().toISOString(),
        isRegistrationScan: !isExisting
      });

      toast.success(`Attendance marked for ${selectedClass}`);
      setScanStatus('success');
      setLastScannedName(result.name);
      
      setResult(null);
      setIsExisting(null);
      setIsScanning(true);

      setTimeout(() => {
        setScanStatus(null);
      }, 3000);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'attendance');
      toast.error("Process failed. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const runAiAttendance = async () => {
    if (!aiReport.trim()) return;
    setIsAiProcessing(true);
    try {
        const response = await fetch('/api/ai/parse-attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: aiReport,
                subject: selectedSubject,
                className: selectedClass,
                hour: selectedHour,
                course: selectedCourse
            })
        });

        if (!response.ok) throw new Error("API Failure");
        const { data } = await response.json();
        const batch = writeBatch(db);
        
        if (data.present && Array.isArray(data.present)) {
            for (const id of data.present) {
                const docRef = doc(collection(db, 'attendance'));
                batch.set(docRef, {
                    studentId: id.toUpperCase(),
                    className: selectedClass,
                    subject: selectedSubject,
                    hour: selectedHour,
                    status: 'present',
                    timestamp: new Date().toISOString(),
                    isAiGenerated: true
                });
            }
        }

        if (data.absent && Array.isArray(data.absent)) {
            for (const id of data.absent) {
                const docRef = doc(collection(db, 'attendance'));
                batch.set(docRef, {
                    studentId: id.toUpperCase(),
                    className: selectedClass,
                    subject: selectedSubject,
                    hour: selectedHour,
                    status: 'absent',
                    timestamp: new Date().toISOString(),
                    isAiGenerated: true
                });
            }
        }

        await batch.commit();
        toast.success(data.summary || "Batch attendance synchronized via AI.");
        setAiReport("");
    } catch (e) {
        console.error(e);
        toast.error("AI was unable to process the report.");
    } finally {
        setIsAiProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <Badge className="bg-blue-50 text-blue-600 mb-2 border-none px-4">Gate & Class Management</Badge>
           <h1 className="text-4xl font-black tracking-tighter text-slate-900">Smart Terminal</h1>
           <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mt-4">
              <button 
                onClick={() => { setMode('ATTENDANCE'); setResult(null); setIsScanning(true); }}
                className={cn(
                    "px-6 py-2 rounded-xl text-xs font-black transition-all",
                    mode === 'ATTENDANCE' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                  LOG ATTENDANCE
              </button>
              <button 
                onClick={() => { setMode('REGISTRATION'); setResult(null); setIsScanning(true); }}
                className={cn(
                    "px-6 py-2 rounded-xl text-xs font-black transition-all",
                    mode === 'REGISTRATION' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                  NEW REGISTRATION
              </button>
              <button 
                onClick={() => { setMode('AI_BATCH'); setResult(null); setIsScanning(false); }}
                className={cn(
                    "px-6 py-2 rounded-xl text-xs font-black transition-all",
                    mode === 'AI_BATCH' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                  AI BATCH LOG
              </button>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-32 h-12 rounded-2xl bg-white border-slate-100 font-bold">
                    <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                    <SelectItem value="BCA">BCA</SelectItem>
                    <SelectItem value="BCOM">BCOM</SelectItem>
                    <SelectItem value="BBA">BBA</SelectItem>
                    <SelectItem value="BSC">BSC</SelectItem>
                </SelectContent>
            </Select>

            <div className="relative">
                <Input
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    placeholder="Select/Type Subject"
                    className="w-48 h-12 rounded-2xl bg-white border-slate-100 font-bold pr-10 focus:ring-2 focus:ring-blue-500 text-slate-800"
                    onFocus={() => setSubjectDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setSubjectDropdownOpen(false), 200)}
                />
                <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                {subjectDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl p-1 max-h-60 overflow-y-auto">
                        {['Computer Networks', 'Operating Systems', 'Software Engineering', 'Mathematics-III'].map((sub) => (
                            <button
                                key={sub}
                                type="button"
                                onMouseDown={() => {
                                    setSelectedSubject(sub);
                                    setSubjectDropdownOpen(false);
                                }}
                                className="w-full text-left rounded-xl px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger className="w-32 h-12 rounded-2xl bg-white border-slate-100 font-bold">
                    <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                    {['1st Hour', '2nd Hour', '3rd Hour', '4th Hour', '5th Hour', '6th Hour'].map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32 h-12 rounded-2xl bg-white border-slate-100 font-bold">
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                    {['1st Year', '2nd Year', '3rd Year'].map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-24 h-12 rounded-2xl bg-white border-slate-100 font-bold">
                    <SelectValue placeholder="Sec" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                    {['A', 'B', 'C'].map(sec => (
                        <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-3xl flex items-center gap-4 shadow-xl">
           <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <History className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Total Scans Today</p>
              <p className="text-xl font-black">{history.length}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 min-h-[600px]">
        {mode === 'AI_BATCH' ? (
            <Card className="xl:col-span-12 rounded-[48px] border-none shadow-2xl bg-slate-900 p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
                <div className="absolute top-0 right-0 p-20 opacity-5">
                    <Sparkles className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 w-full max-w-2xl text-center space-y-8">
                    <div className="space-y-2">
                        <Badge className="bg-blue-600 text-white border-none px-4 py-1">Zero-Manual Mode</Badge>
                        <h2 className="text-4xl font-black text-white tracking-tighter">AI Attendance Terminal</h2>
                        <p className="text-slate-400 font-bold">Paste report, use voice, or describe the attendance in natural language.</p>
                    </div>
                    
                    <div className="space-y-4 text-left">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Unstructured Report</Label>
                        <textarea 
                            value={aiReport}
                            onChange={(e) => setAiReport(e.target.value)}
                            className="w-full h-48 rounded-3xl bg-white/5 border border-white/10 text-white p-8 font-medium leading-relaxed focus:outline-none focus:ring-4 focus:ring-blue-600/20"
                            placeholder="Example: 'Everyone present except 001 and 002' or 'Only USN005 was present for OS class today'"
                        />
                    </div>

                    <Button 
                        onClick={runAiAttendance}
                        disabled={isAiProcessing || !aiReport.trim()}
                        className="h-16 px-12 rounded-full bg-blue-600 hover:bg-white hover:text-blue-600 font-black text-lg transition-all shadow-2xl"
                    >
                        {isAiProcessing ? <RefreshCw className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                        Execute AI Sync
                    </Button>

                    <div className="flex items-center justify-center gap-8 pt-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase">{selectedSubject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Scan className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase">Hour: {selectedHour}</span>
                        </div>
                    </div>
                </div>
            </Card>
        ) : (
            <>
                {/* Camera Feed - 7 cols */}
        <Card className="xl:col-span-7 rounded-[48px] border-none shadow-2xl overflow-hidden flex flex-col bg-slate-900 ring-1 ring-slate-800">
          <CardHeader className="bg-slate-900 border-b border-white/5 px-8">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black text-white flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-xl">
                    <Camera className="w-5 h-5 text-white" />
                </div>
                Optical Recognition
              </CardTitle>
              <div className="flex items-center gap-4">
                {isScanning && !result && !isProcessing && (
                  <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full",
                      mode === 'ATTENDANCE' ? "bg-blue-500/10" : "bg-amber-500/10"
                  )}>
                    <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", mode === 'ATTENDANCE' ? "bg-blue-500" : "bg-amber-500")} />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", mode === 'ATTENDANCE' ? "text-blue-500" : "text-amber-500")}>
                        {mode === 'ATTENDANCE' ? 'Active QR Listener' : 'Registration Scanner'}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={cn(
                      "h-2 w-2 rounded-full animate-pulse",
                      isOnline ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      isOnline ? "text-emerald-500" : "text-rose-500"
                  )}>
                      {isOnline ? 'Cloud Linked' : 'Local Buffered (Offline)'}
                  </span>
                  {isOnline ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-rose-500" />}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover opacity-90"
              videoConstraints={{ facingMode: "environment" }}
            />
            {/* Advanced HUD */}
            <div className="absolute inset-x-8 inset-y-12 pointer-events-none">
              <div className="w-full h-full border-2 border-white/10 rounded-[32px] relative">
                {/* Result Overlay */}
                {scanStatus && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-[30px]"
                  >
                    <div className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center shadow-2xl mb-6 border-8 border-white/20",
                      scanStatus === 'success' ? "bg-emerald-500" : "bg-rose-500"
                    )}>
                      {scanStatus === 'success' ? (
                        <CheckCircle2 className="w-16 h-16 text-white" />
                      ) : (
                        <AlertCircle className="w-16 h-16 text-white" />
                      )}
                    </div>
                    <div className="text-center space-y-2">
                       <h2 className="text-4xl font-black text-white tracking-widest uppercase">
                          {scanStatus === 'success' ? 'VERIFIED' : 'FAILED'}
                       </h2>
                       {lastScannedName && (
                         <p className="text-white font-bold opacity-80 text-lg">{lastScannedName}</p>
                       )}
                       <p className="text-white/50 text-xs font-black uppercase tracking-[0.3em]">
                          {scanStatus === 'success' ? 'Synchronized with Ledger' : 'Check Connectivity'}
                       </p>
                    </div>
                  </motion.div>
                )}

                <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-blue-600 rounded-tl-[32px]" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-blue-600 rounded-tr-[32px]" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-blue-600 rounded-bl-[32px]" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-blue-600 rounded-br-[32px]" />
                
                {/* Scanning line effect */}
                <motion.div 
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-sm"
                />
              </div>
            </div>
            
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <Button 
                onClick={capture} 
                className="h-24 w-24 rounded-full bg-blue-600 hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-2xl group flex flex-col gap-1 border-4 border-white/10"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <RefreshCw className="w-10 h-10 animate-spin" />
                ) : (
                  <>
                    <Scan className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Capture</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Processing Panel - 5 cols */}
        <Card className="xl:col-span-5 rounded-[48px] border border-white shadow-2xl flex flex-col bg-white overflow-hidden">
          <CardHeader className="px-8 pt-10">
            <CardTitle className="text-2xl font-black text-slate-900">Verification</CardTitle>
            <CardDescription className="font-bold text-slate-400">Processing identity and regularity...</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-8 pt-0">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50" />
                    <div className="relative w-32 h-32 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center">
                        <Scan className="w-16 h-16 text-slate-200" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-black text-xl text-slate-400 uppercase tracking-tighter">System Idle</p>
                  <p className="text-sm text-slate-400 font-medium max-w-[240px] leading-relaxed">
                    {mode === 'ATTENDANCE' 
                      ? "Place the Student ID card or QR Code within the frame for automatic recognition." 
                      : "Scan the Student ID or QR to begin first-time data recording."}
                  </p>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-8 flex-1 py-4"
              >
                {/* Result Header */}
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg",
                        isExisting ? "bg-emerald-500" : "bg-amber-500"
                    )}>
                        {isExisting ? <CheckCircle2 className="w-10 h-10" /> : <UserPlus className="w-10 h-10" />}
                    </div>
                    <div>
                        <Badge className={cn(
                            "mb-1 border-none",
                            isExisting ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                            {isExisting ? "Recognized ID" : "New ID Detected"}
                        </Badge>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{result.name}</h3>
                        <p className="text-blue-600 font-bold opacity-80 tracking-widest uppercase text-xs">{result.studentId}</p>
                    </div>
                </div>

                {/* Form Logic */}
                <div className="space-y-6">
                    {/* Class Selection for ALL scans */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mark For Class/Session</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-slate-400 uppercase">Year</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-slate-700">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {['1st Year', '2nd Year', '3rd Year'].map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-slate-400 uppercase">Section</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-slate-700">
                                        <SelectValue placeholder="Select Sec" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {['A', 'B', 'C'].map(sec => (
                                            <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {!isExisting && (
                        <div className="p-6 rounded-[32px] bg-amber-50/50 border border-amber-100 space-y-5">
                            <p className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Registration Details Required
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold">FULL NAME</Label>
                                    <Input 
                                        placeholder="Student Name"
                                        className="h-12 rounded-xl bg-white border-transparent"
                                        value={result.name}
                                        onChange={(e) => setResult({...result, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold">COURSE / BRANCH</Label>
                                    <Input 
                                        placeholder="e.g. CS Engineering"
                                        className="h-12 rounded-xl bg-white border-transparent"
                                        value={result.course}
                                        onChange={(e) => setResult({...result, course: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold">CONTACT EMAIL</Label>
                                    <Input 
                                        placeholder="email@college.edu"
                                        className="h-12 rounded-xl bg-white border-transparent"
                                        value={registrationData.email}
                                        onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold">PHONE NUMBER</Label>
                                    <Input 
                                        placeholder="+91 XXXXX XXXXX"
                                        className="h-12 rounded-xl bg-white border-transparent"
                                        value={registrationData.phone}
                                        onChange={(e) => setRegistrationData({...registrationData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold">ACADEMIC BATCH</Label>
                                    <Input 
                                        placeholder="e.g. 2024-27"
                                        className="h-12 rounded-xl bg-white border-transparent"
                                        value={registrationData.batch}
                                        onChange={(e) => setRegistrationData({...registrationData, batch: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
                        <Button 
                            onClick={handleRegistrationAndAttendance}
                            disabled={isSaving}
                            className={cn(
                                "w-full h-16 rounded-[24px] font-black text-lg transition-all shadow-xl",
                                isExisting ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                            )}
                        >
                            {isSaving ? <RefreshCw className="animate-spin w-6 h-6 mr-3" /> : (isExisting ? <CheckCircle2 className="w-6 h-6 mr-3" /> : <UserPlus className="w-6 h-6 mr-3" />)}
                            {isExisting ? "Mark Regularity" : "Register & Mark Entry"}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full h-14 rounded-[24px] font-black text-slate-400 hover:bg-slate-50" 
                            onClick={() => { setResult(null); setIsExisting(null); setIsScanning(true); }}
                        >
                            Discard Scan
                        </Button>
                    </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </>
    )}
</div>

      {/* Recents list */}
      <Card className="rounded-[48px] border border-white shadow-2xl bg-white h-[400px] flex flex-col overflow-hidden">
        <CardHeader className="px-10 pt-10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-4">
                <div className="bg-emerald-50 p-2.5 rounded-2xl">
                    <History className="w-6 h-6 text-emerald-600" />
                </div>
                Live Activity Log
              </CardTitle>
            </div>
            <Badge variant="outline" className="h-8 px-4 font-black border-slate-100 text-slate-400">Real-time Stream</Badge>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="space-y-4 pt-4">
            {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                   <History className="w-16 h-16 opacity-20 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] font-black opacity-40">No scans recorded in this session</p>
                </div>
            ) : history.map((record, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={record.id} 
                className="group flex items-center justify-between p-6 rounded-[32px] bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 text-blue-600 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                    {record.studentId?.slice(-3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-black text-slate-900">{record.name}</p>
                        {record.isRegistrationScan && <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] h-4">First Scan</Badge>}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-0.5">
                        {record.className} • {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                    <Badge variant="outline" className="text-emerald-600 border-emerald-100 bg-emerald-50 px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest">Verified</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
