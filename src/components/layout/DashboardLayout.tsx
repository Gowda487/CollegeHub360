import React from 'react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCheck, 
  ScanLine, 
  BarChart3, 
  Bell, 
  BookOpen, 
  Trophy,
  Users,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/overview' },
    { icon: ScanLine, label: 'Camera Attendance', href: '/attendance' },
    { icon: FileText, label: 'Marks Terminal', href: '/marks-entry' },
    { icon: BarChart3, label: 'Performance', href: '/performance' },
    { icon: Users, label: 'Students', href: '/students' },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A]">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[#E5E7EB]"
      >
        <div className="flex items-center h-16 px-6 border-bottom border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Hub360</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-[#F3F4F6] text-[#4B5563]",
                location.pathname === item.href && "bg-blue-50 text-blue-600",
                "group relative"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-[#1A1A1A] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB]">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 px-3 hover:bg-[#FEE2E2] hover:text-[#EF4444]"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sign Out</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isSidebarOpen ? "pl-[280px]" : "pl-[80px]"
        )}
      >
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-40">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <button className="relative p-2 text-[#4B5563] hover:bg-[#F3F4F6] rounded-full transition-colors focus:outline-none" />
                }
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white"></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl border-slate-100 shadow-2xl p-2">
                <DropdownMenuLabel className="font-black text-slate-900 px-4 py-3">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-50" />
                <div className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem className="p-4 rounded-xl focus:bg-slate-50 cursor-pointer">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <UserCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Attendance Alert</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">5 students flagged for low attendance this week.</p>
                                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">2 mins ago</p>
                            </div>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-4 rounded-xl focus:bg-slate-50 cursor-pointer">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Performance Report</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">Monthly academic summary for Batch 2024 is ready.</p>
                                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">1 hour ago</p>
                            </div>
                        </div>
                    </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem className="justify-center text-xs font-black text-blue-600 py-3 cursor-pointer hover:text-blue-700">
                    View All Notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center gap-3 pl-6 border-l border-[#E5E7EB]">
              <div className="text-right">
                <p className="text-sm font-semibold">Dr. Sarah Wilson</p>
                <p className="text-xs text-[#6B7280]">Academic Head</p>
              </div>
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
                <AvatarFallback>SW</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <section className="p-8">
          {children}
        </section>
      </main>
    </div>
  );
}
