import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Save, 
  Trash2, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Database,
  FileText,
  Loader2,
  Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

interface MarkEntry {
  studentId: string;
  name: string;
  marks: number;
  id?: string;
}

export default function MarksEntry() {
  const [subject, setSubject] = useState('Computer Networks');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<MarkEntry[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAIParse = async () => {
    if (!rawText.trim() || !subject.trim()) {
      toast.error("Enter subject and text to scan.");
      return;
    }

    setIsParsing(true);
    try {
      const response = await fetch('/api/ai/parse-marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, subject })
      });

      if (!response.ok) throw new Error('AI Engine failed');
      const { data } = await response.json();
      
      setParsedData(data);
      toast.success(`Successfully parsed ${data.length} records.`);
    } catch (error) {
      console.error(error);
      toast.error("AI was unable to process this text.");
    } finally {
      setIsParsing(false);
    }
  };

  const saveToLedger = async () => {
    if (parsedData.length === 0) return;
    setIsSaving(true);
    
    try {
        const batch = writeBatch(db);
        
        for (const entry of parsedData) {
            const marksRef = collection(db, 'marks');
            const newDoc = doc(marksRef);
            batch.set(newDoc, {
                studentId: entry.studentId.toUpperCase(),
                studentName: entry.name,
                subject: subject,
                score: entry.marks,
                maxMarks: 100,
                examType: 'Internal Assessment',
                date: new Date().toISOString()
            });
        }
        
        await batch.commit();
        toast.success("Academic records updated successfully.");
        setParsedData([]);
        setRawText('');
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'marks');
    } finally {
        setIsSaving(false);
    }
  };

  const updateMark = (index: number, value: string) => {
    const updated = [...parsedData];
    updated[index].marks = parseInt(value) || 0;
    setParsedData(updated);
  };

  const removeItem = (index: number) => {
      setParsedData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Marks Terminal</h1>
          <p className="text-slate-500 font-bold">AI-Augmented Academic Grading</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Control */}
        <div className="space-y-6">
            <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <CardTitle className="text-xl font-black flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-blue-400" />
                        AI Extraction Engine
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-bold">
                        Paste list of marks or unstructured notes to extract data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Scope</label>
                        <Input 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
                            placeholder="e.g. Data Structures"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Raw Content</label>
                        <textarea 
                            rows={8}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            placeholder="Example: USN001 John got 85,USN002 Sarah pulled 90..."
                        />
                    </div>
                    <Button 
                        onClick={handleAIParse}
                        disabled={isParsing || !rawText.trim()}
                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black shadow-xl shadow-blue-500/20"
                    >
                        {isParsing ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Database className="w-5 h-5 mr-3" />}
                        Execute Scan Profile
                    </Button>
                </CardContent>
            </Card>

            <div className="p-6 rounded-[32px] bg-amber-50/50 border border-amber-100">
                <div className="flex gap-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-black text-amber-900">Review AI Output</p>
                        <p className="text-xs text-amber-700 font-bold mt-1 leading-relaxed">
                            The AI might occasionaly misinterpret USNs if hand-written. Always verify Student IDs before committing to the ledger.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Output Grid */}
        <div className="space-y-6">
            <Card className="rounded-[32px] border-none shadow-sm h-full flex flex-col">
                <CardHeader className="border-b border-slate-50 px-8 py-6 flex flex-row items-center justify-between bg-white sticky top-0 z-10 rounded-t-[32px]">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl">
                            <Table className="w-5 h-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg font-black tracking-tight">Extracted Records</CardTitle>
                    </div>
                    {parsedData.length > 0 && (
                        <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-600 border-none font-black text-[10px] py-1">
                            {parsedData.length} Candidates
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
                    <AnimatePresence mode="popLayout">
                        {parsedData.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-center p-10">
                                <FileText className="w-12 h-12 text-slate-100 mb-4" />
                                <p className="text-sm font-black text-slate-400">Terminal Idle</p>
                                <p className="text-xs text-slate-300 font-bold mt-1 uppercase tracking-widest">Waitng for scan results</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {parsedData.map((entry, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={idx} 
                                        className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                                                {entry.studentId.substring(0, 3)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{entry.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.studentId}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Input 
                                                    type="number"
                                                    value={entry.marks}
                                                    onChange={(e) => updateMark(idx, e.target.value)}
                                                    className="w-20 rounded-xl border-slate-100 bg-white font-black text-center h-10"
                                                />
                                                <span className="absolute -top-2 -right-2 px-1 bg-white text-[8px] font-black text-slate-400 border border-slate-100 rounded">MAX 100</span>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => removeItem(idx)}
                                                className="rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </CardContent>
                {parsedData.length > 0 && (
                    <div className="p-8 bg-slate-50/50 border-t border-slate-100 rounded-b-[32px]">
                        <Button 
                            onClick={saveToLedger}
                            disabled={isSaving}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-2xl"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-400" />}
                            Sync to Academic Ledger
                        </Button>
                    </div>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
}
