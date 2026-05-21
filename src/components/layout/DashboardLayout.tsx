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

import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { AlertTriangle, Info } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Dynamic alerts generator from live collections
    const unsub = onSnapshot(collection(db, 'students'), (snapshot) => {
      const alerts: any[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.attendanceRate && parseFloat(data.attendanceRate) < 75) {
          alerts.push({
            id: `low-att-${doc.id}`,
            title: 'Low Attendance warning',
            desc: `${data.name} has dropped below the threshold to ${data.attendanceRate}%.`,
            time: 'Academic Alert',
            type: 'critical'
          });
        }
        if (data.gpa && parseFloat(data.gpa) > 3.8) {
          alerts.push({
            id: `gpa-${doc.id}`,
            title: 'High Achiever recognized',
            desc: `${data.name} is excelling with a outstanding GPA of ${data.gpa}!`,
            time: 'Excellence Alert',
            type: 'excellence'
          });
        }
      });

      if (alerts.length === 0) {
        alerts.push({
          id: 'clean-slate',
          title: 'System nominal',
          desc: 'No students are currently flagged. Campus metrics are in excellent standing.',
          time: 'Active Feed',
          type: 'info'
        });
      }
      setNotifications(alerts.slice(0, 10));
    }, (error) => {
      console.error("Layout notifications listener failed:", error);
    });

    return () => unsub();
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      const mobileStatus = window.innerWidth < 1024;
      setIsMobile(mobileStatus);
      if (mobileStatus) {
        setSidebarOpen(false);
      } else {
        setIsMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setSidebarOpen(!isSidebarOpen);
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
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={isMobile ? { x: isMobileOpen ? 0 : -280, width: 280 } : { x: 0, width: isSidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[#E5E7EB]"
      >
        <div className="flex items-center h-16 px-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            {(isSidebarOpen || isMobile) && <span className="font-bold text-xl tracking-tight">Hub360</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => {
                if (isMobile) setIsMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-[#F3F4F6] text-[#4B5563]",
                location.pathname === item.href && "bg-blue-50 text-blue-600",
                "group relative"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(isSidebarOpen || isMobile) && <span className="font-medium">{item.label}</span>}
              {!(isSidebarOpen || isMobile) && (
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
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(isSidebarOpen || isMobile) && <span>Sign Out</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out h-screen overflow-y-auto",
          isMobile ? "pl-0" : (isSidebarOpen ? "pl-[280px]" : "pl-[80px]")
        )}
      >
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-4 md:gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger className="relative p-2 text-[#4B5563] hover:bg-[#F3F4F6] rounded-full transition-colors focus:outline-none cursor-pointer">
                <Bell className="w-5 h-5" />
                {notifications.some(n => n.id !== 'clean-slate') && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white animate-pulse"></span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl border-slate-100 shadow-2xl p-2">
                <DropdownMenuLabel className="font-black text-slate-900 px-4 py-3 flex items-center justify-between text-sm">
                  <span>Notifications</span>
                  {notifications.some(n => n.id !== 'clean-slate') && (
                    <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      {notifications.filter(n => n.id !== 'clean-slate').length} Alerts
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-50" />
                <div className="max-h-[300px] overflow-y-auto space-y-1 p-1">
                    {notifications.map((notif) => (
                      <DropdownMenuItem key={notif.id} className="p-3 rounded-xl focus:bg-slate-100 cursor-pointer">
                        <div className="flex gap-3">
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                              notif.type === 'critical' ? "bg-rose-50 text-rose-600" :
                              notif.type === 'excellence' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>
                                {notif.type === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                                 notif.type === 'excellence' ? <Trophy className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-800 truncate leading-tight">{notif.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal break-all line-clamp-2">{notif.desc}</p>
                                <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none">{notif.time}</p>
                            </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem className="justify-center text-xs font-black text-blue-600 py-3 cursor-pointer hover:text-blue-700">
                    View All Notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-[#E5E7EB]">
              <div className="text-right hidden sm:block">
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

        <section className="p-4 md:p-8">
          {children}
        </section>
      </main>
    </div>
  );
}
