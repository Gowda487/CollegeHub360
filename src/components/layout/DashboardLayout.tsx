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
  X
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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/overview' },
    { icon: ScanLine, label: 'Camera Attendance', href: '/attendance' },
    { icon: BarChart3, label: 'Performance', href: '/performance' },
    { icon: Users, label: 'Students', href: '/students' },
    { icon: Calendar, label: 'Schedule', href: '/schedule' },
    { icon: Bell, label: 'Alerts', href: '/alerts' },
    { icon: BookOpen, label: 'Recommendations', href: '/recommendations' },
    { icon: Trophy, label: 'Career Intelligence', href: '/career' },
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
            onClick={() => window.location.href = '/'}
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
            <button className="relative p-2 text-[#4B5563] hover:bg-[#F3F4F6] rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white"></span>
            </button>
            
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
