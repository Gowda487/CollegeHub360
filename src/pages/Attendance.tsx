import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'motion/react';
import { Camera, Scan, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AttendancePage() {
  const webcamRef = useRef<Webcam>(null);
  const [isCapping, setIsCapping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setIsProcessing(true);
      try {
        // Remove data:image/jpeg;base64, prefix
        const base64Content = imageSrc.split(',')[1];
        
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Content }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        setResult(data);
        toast.success("ID Card Scanned Successfully");
      } catch (error) {
        console.error("OCR Error:", error);
        toast.error("Failed to recognize ID card. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }
  }, [webcamRef]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Camera Attendance</h1>
        <p className="text-[#6B7280]">Scan student ID cards for instant automated attendance marking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
        {/* Camera Feed */}
        <Card className="rounded-[32px] border-none shadow-sm overflow-hidden flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Live Feed
              </CardTitle>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 animate-pulse">
                System Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-black relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode: "environment" }}
            />
            {/* HUD Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-dashed border-blue-400/50 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
              </div>
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
              <Button 
                onClick={capture} 
                className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : (
                  <Scan className="w-8 h-8" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scan Results */}
        <Card className="rounded-[32px] border-none shadow-sm flex flex-col bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Verification Results</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8">
            {!result ? (
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                    <Scan className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-600">Waiting for Scan...</p>
                  <p className="text-sm text-slate-400">Position the ID card within the frame and click capture.</p>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-[#1A1A1A]">{result.name}</h3>
                  <p className="text-blue-600 font-semibold">{result.studentId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="p-4 rounded-2xl bg-[#F9FAFB]">
                        <p className="text-xs text-[#6B7280] font-medium uppercase mb-1">Course</p>
                        <p className="font-bold text-sm tracking-tight">{result.course}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F9FAFB]">
                        <p className="text-xs text-[#6B7280] font-medium uppercase mb-1">Expiry</p>
                        <p className="font-bold text-sm tracking-tight">{result.expiryDate}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] w-full flex flex-col gap-3">
                    <Button className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold">Mark as Present</Button>
                    <Button variant="outline" className="w-full h-12 rounded-full font-bold" onClick={() => setResult(null)}>Retry Scan</Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recents list */}
      <Card className="rounded-[32px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Today's Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    ID
                  </div>
                  <div>
                    <p className="text-sm font-bold">Student Record #{1000 + i}</p>
                    <p className="text-xs text-[#6B7280]">Verified at 10:24 AM</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Verified</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
