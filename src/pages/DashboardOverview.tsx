import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Mon', attendance: 85, performance: 78 },
  { name: 'Tue', attendance: 88, performance: 82 },
  { name: 'Wed', attendance: 92, performance: 80 },
  { name: 'Thu', attendance: 90, performance: 85 },
  { name: 'Fri', attendance: 87, performance: 88 },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Academic Overview</h1>
        <p className="text-[#6B7280]">Welcome back, Dr. Wilson. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Total Students" 
          value="1,248" 
          trend="+12% from last month"
          color="bg-blue-500" 
        />
        <StatCard 
          icon={UserCheck} 
          label="Today's Attendance" 
          value="92.4%" 
          trend="+3.1% from yesterday"
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={Clock} 
          label="Late Entries" 
          value="42" 
          trend="-5% from average"
          color="bg-amber-500" 
        />
        <StatCard 
          icon={AlertTriangle} 
          label="At-Risk Students" 
          value="18" 
          trend="Action required"
          color="bg-rose-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Chart */}
        <Card className="rounded-[32px] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="rounded-[32px] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Academic Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="performance" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="col-span-1 rounded-[32px] border-none shadow-sm md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Recent Alerts</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {[
                        { title: 'Low Attendance Warning', student: 'James Miller', score: '62%', status: 'Critical' },
                        { title: 'Assignment Due', student: 'Sarah Chen', score: 'Physics 101', status: 'Pending' },
                        { title: 'High Performance Alert', student: 'Alex Rivera', score: '98%', status: 'Excellence' }
                    ].map((alert, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    alert.status === 'Critical' ? "bg-rose-100 text-rose-600" : 
                                    alert.status === 'Excellence' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {alert.status === 'Critical' ? <AlertTriangle className="w-5 h-5" /> : 
                                     alert.status === 'Excellence' ? <Trophy className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{alert.title}</p>
                                    <p className="text-xs text-[#6B7280]">{alert.student}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-[#1A1A1A]">{alert.score}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm flex flex-col justify-center items-center p-8 bg-blue-600 text-white text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Career Insights</h3>
            <p className="text-blue-100 text-sm mb-6">Explore personalized career pathways based on your department's performance trends.</p>
            <Button variant="secondary" className="w-full rounded-full font-bold">Generate Report</Button>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }: any) {
  return (
    <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-2xl text-white", color)}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend.split(' ').slice(0, 1)}</span>
        </div>
        <p className="text-sm font-medium text-[#6B7280] mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-[#1A1A1A]">{value}</h3>
      </CardContent>
    </Card>
  );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
