import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Sparkles, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export default function AIChatbox({ studentData }: { studentData?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      parts: [{ text: input }]
    };

    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: history,
          studentData: studentData
        })
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      const botMessage: Message = {
        role: 'model',
        parts: [{ text: data.text }]
      };

      setHistory(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('MindBolt is offline. Try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-16 w-16 rounded-3xl shadow-2xl transition-all duration-500",
            isOpen ? "bg-slate-900 border-white/10" : "bg-blue-600 border-transparent hover:bg-blue-700"
          )}
        >
          {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] z-50 flex flex-col"
          >
            <Card className="flex-1 flex flex-col rounded-[40px] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black tracking-tighter">MindBolt AI</CardTitle>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Core</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/10 text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
              >
                {history.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900">How can I help you, {studentData?.name?.split(' ')[0] || 'friend'}?</p>
                        <p className="text-xs text-slate-400 font-medium px-8 mt-1 italic">"Ask me about your GPA, attendance, or campus events."</p>
                    </div>
                  </div>
                )}

                {history.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={cn(
                      "flex items-end gap-3",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                        msg.role === 'user' ? "bg-slate-100" : "bg-blue-50"
                    )}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-slate-500" /> : <Bot className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-[24px] px-5 py-3 text-sm font-medium leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? "bg-slate-900 text-white rounded-br-none" 
                        : "bg-slate-50 text-slate-700 rounded-bl-none border border-slate-100"
                    )}>
                      <div className="prose prose-sm prose-slate max-w-none prose-headings:font-black prose-p:leading-relaxed">
                        <ReactMarkdown>
                            {msg.parts[0].text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="flex items-end gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-[24px] rounded-bl-none px-5 py-3 flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-6 pt-2">
                <div className="relative w-full">
                  <Input 
                    placeholder="Type your question..." 
                    className="h-14 rounded-2xl pr-14 pl-6 border-slate-100 bg-slate-50 focus-visible:ring-blue-600 font-bold placeholder:text-slate-400 placeholder:font-medium"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    size="icon"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
