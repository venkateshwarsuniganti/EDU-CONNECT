import React, { useState, useMemo } from 'react';
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
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Download, 
  Calendar as CalendarIcon, 
  Filter, 
  FileText, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  Activity,
  UserPlus,
  BookOpen,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ATTENDANCE_DATA = [
  { date: '2024-03-01', attendance: 92, students: 120 },
  { date: '2024-03-02', attendance: 88, students: 118 },
  { date: '2024-03-03', attendance: 95, students: 122 },
  { date: '2024-03-04', attendance: 91, students: 121 },
  { date: '2024-03-05', attendance: 85, students: 115 },
  { date: '2024-03-06', attendance: 93, students: 123 },
  { date: '2024-03-07', attendance: 90, students: 119 },
  { date: '2024-03-08', attendance: 94, students: 124 },
  { date: '2024-03-09', attendance: 89, students: 117 },
  { date: '2024-03-10', attendance: 96, students: 125 },
  { date: '2024-03-11', attendance: 92, students: 122 },
  { date: '2024-03-12', attendance: 91, students: 120 },
];

const REGISTRATION_TREND = [
  { month: 'Oct', students: 120, faculty: 12 },
  { month: 'Nov', students: 145, faculty: 15 },
  { month: 'Dec', students: 110, faculty: 8 },
  { month: 'Jan', students: 280, faculty: 25 },
  { month: 'Feb', students: 190, faculty: 18 },
  { month: 'Mar', students: 210, faculty: 22 },
];

const SYSTEM_USAGE = [
  { time: '00:00', load: 12, users: 45 },
  { time: '04:00', load: 8, users: 20 },
  { time: '08:00', load: 45, users: 450 },
  { time: '12:00', load: 85, users: 1200 },
  { time: '16:00', load: 72, users: 980 },
  { time: '20:00', load: 35, users: 320 },
  { time: '23:59', load: 15, users: 85 },
];

const COURSE_DISTRIBUTION = [
  { name: 'Mathematics', value: 400 },
  { name: 'Computer Science', value: 300 },
  { name: 'Physics', value: 300 },
  { name: 'Literature', value: 200 },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

type AnalyticsTab = 'overview' | 'users' | 'courses' | 'system';

export default function AnalyticsModule() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Attendance report exported as ${format.toUpperCase()} successfully!`);
    }, 1500);
  };

  const stats = useMemo(() => [
    { label: 'Avg. Attendance', value: '91.4%', trend: '+2.4%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Students', value: '1,248', trend: '+12', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'On-Time Rate', value: '88.2%', trend: '+1.1%', icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'System Uptime', value: '99.9%', trend: 'Stable', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
  ], []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'User Growth', icon: UserPlus },
    { id: 'courses', label: 'Course Enrollment', icon: BookOpen },
    { id: 'system', label: 'System Usage', icon: Server },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Reporting & Analytics</h2>
          <p className="text-gray-500 mt-1">Monitor system-wide trends and generate detailed reports.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-10 pr-10 py-3 bg-white border border-black/5 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Semester</option>
              <option>Academic Year</option>
            </select>
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div className="flex bg-white border border-black/5 rounded-2xl p-1 shadow-sm">
            <button 
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <div className="w-px h-4 bg-gray-200 self-center mx-1"></div>
            <button 
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm"
          >
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-500">{stat.label}</p>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                stat.trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 
                stat.trend === 'Stable' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
              }`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900 mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AnalyticsTab)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Attendance Trends</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Daily percentage over time</p>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ATTENDANCE_DATA}>
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                        dy={10}
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                        domain={[0, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                        labelStyle={{ fontWeight: 800, fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorAttendance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-2">Subject Distribution</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Enrollment by department</p>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={COURSE_DISTRIBUTION} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {COURSE_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 space-y-4">
                  {COURSE_DISTRIBUTION.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${COLORS[i % COLORS.length]}`}></div>
                        <span className="text-xs font-bold text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900">User Registration Trends</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Monthly growth of students and faculty</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REGISTRATION_TREND}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#9ca3af' }} />
                    <Tooltip 
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 700 }} />
                    <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students" />
                    <Bar dataKey="faculty" fill="#10b981" radius={[6, 6, 0, 0]} name="Faculty" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Course Enrollment Analysis</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Popularity and capacity utilization</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={COURSE_DISTRIBUTION}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-50 rounded-3xl">
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4">Quick Insights</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center space-x-2 text-sm text-indigo-700 font-bold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Mathematics is the most popular subject</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm text-indigo-700 font-bold">
                        <TrendingUp className="w-4 h-4" />
                        <span>CS enrollment increased by 15% this month</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm text-indigo-700 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Literature courses are at 95% capacity</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900">System Performance & Usage</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time load and active user sessions</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SYSTEM_USAGE}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#9ca3af' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 700 }} />
                    <Line type="monotone" dataKey="load" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="System Load %" />
                    <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Active Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Detailed Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-black/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900">Recent Activity Logs</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Live feed of system events</p>
          </div>
          <button className="text-indigo-600 text-sm font-black hover:underline">View Full Logs</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Event</th>
                <th className="px-8 py-4">User</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[
                { time: '2 mins ago', event: 'New Student Registered', user: 'Sarah Jenkins', status: 'Success' },
                { time: '15 mins ago', event: 'Course Enrollment: CS101', user: 'Michael Chen', status: 'Success' },
                { time: '45 mins ago', event: 'System Backup Completed', user: 'System', status: 'Success' },
                { time: '1 hour ago', event: 'Failed Login Attempt', user: 'Unknown', status: 'Warning' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <span className="text-sm font-bold text-gray-900">{row.time}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm text-gray-600">{row.event}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm font-bold text-gray-900">{row.user}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      row.status === 'Success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
