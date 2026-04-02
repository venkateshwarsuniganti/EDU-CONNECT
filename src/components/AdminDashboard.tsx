import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  TrendingUp, 
  Shield, 
  Plus, 
  Search, 
  MoreVertical, 
  X,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Loader2,
  Trash2,
  Fingerprint,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, Notification } from '../types';
import { api } from '../services/api';
import { ToastType } from './Toast';
import BiometricVerification from './BiometricVerification';

import AnalyticsModule from './AnalyticsModule';
import ConfirmationModal from './ConfirmationModal';

const MOCK_STATS = [
  { label: 'Total Students', value: '1,248', trend: '+12%', isUp: true, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Total Faculty', value: '86', trend: '+4%', isUp: true, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { label: 'Avg. Attendance', value: '92.4%', trend: '-2%', isUp: false, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { label: 'Active Courses', value: '42', trend: '+8%', isUp: true, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-100' },
];

const MOCK_USERS = [
  { id: '1', name: 'Dr. Sarah Smith', email: 'sarah.smith@edu.com', role: 'faculty', status: 'active', joined: '2023-09-12' },
  { id: '2', name: 'Alex Johnson', email: 'alex.j@student.edu.com', role: 'student', status: 'active', joined: '2024-01-15' },
  { id: '3', name: 'Prof. James Wilson', email: 'j.wilson@edu.com', role: 'faculty', status: 'active', joined: '2022-08-20' },
  { id: '4', name: 'Emily Davis', email: 'emily.d@student.edu.com', role: 'student', status: 'inactive', joined: '2024-02-01' },
];

const MOCK_COURSES = [
  { id: '1', name: 'Advanced Mathematics', faculty: 'Dr. Sarah Smith', students: 42, status: 'active' },
  { id: '2', name: 'Cloud Computing', faculty: 'Prof. James Wilson', students: 38, status: 'active' },
  { id: '3', name: 'Software Engineering', faculty: 'Dr. Robert Brown', students: 45, status: 'pending' },
];

interface AdminDashboardProps {
  user: User;
  activeTab: string;
  onSendNotification?: (notif: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    targetRole?: UserRole;
  }) => void;
  onShowToast?: (message: string, type: ToastType) => void;
}

export default function AdminDashboard({ user, activeTab, onSendNotification, onShowToast }: AdminDashboardProps) {
  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You do not have permission to view the admin portal.</p>
        </div>
      </div>
    );
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [pendingAction, setPendingAction] = useState<'addUser' | 'sendAnnouncement' | null>(null);

  // Announcement Form State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState<UserRole | 'all'>('all');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, coursesData] = await Promise.all([
          api.users.getAll(),
          api.schedule.get()
        ]);
        setUsers(usersData);
        setCourses(coursesData);
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifError(null);

    if (notifTitle.trim().length < 5) {
      setNotifError('Title must be at least 5 characters long');
      return;
    }

    if (notifMessage.trim().length < 10) {
      setNotifError('Message must be at least 10 characters long');
      return;
    }

    setIsSendingNotif(true);
    try {
      await api.notifications.send({
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        targetRole: notifTarget === 'all' ? undefined : notifTarget
      });
      setShowNotifModal(false);
      setNotifTitle('');
      setNotifMessage('');
      if (onSendNotification) {
        onSendNotification({
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          targetRole: notifTarget === 'all' ? undefined : notifTarget
        });
      }
      if (onShowToast) onShowToast('Announcement broadcasted successfully!', 'success');
    } catch (error) {
      setNotifError('Failed to send announcement');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      setUserError('Please enter a valid email address');
      return;
    }

    if (newUserName.trim().length < 3) {
      setUserError('Name must be at least 3 characters long');
      return;
    }

    setIsCreatingUser(true);
    try {
      await api.users.add({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        password: 'password123' // Default password
      });
      const updatedUsers = await api.users.getAll();
      setUsers(updatedUsers);
      setShowAddModal(false);
      setNewUserName('');
      setNewUserEmail('');
      if (onShowToast) onShowToast('User account created successfully!', 'success');
    } catch (error) {
      setUserError('Failed to add user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await api.users.delete(deleteUserId);
      setUsers(prev => prev.filter(u => u.id !== deleteUserId));
      setDeleteUserId(null);
      if (onShowToast) onShowToast('User account deleted successfully!', 'success');
    } catch (error) {
      if (onShowToast) onShowToast('Failed to delete user. Please try again.', 'error');
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourseId) return;
    try {
      await api.schedule.delete(deleteCourseId);
      setCourses(prev => prev.filter(c => c.id !== deleteCourseId));
      setDeleteCourseId(null);
      if (onShowToast) onShowToast('Course deleted successfully!', 'success');
    } catch (error) {
      if (onShowToast) onShowToast('Failed to delete course. Please try again.', 'error');
    }
  };

  const handleCheckInSuccess = async () => {
    if (pendingAction === 'addUser') {
      setShowAddModal(true);
      if (onShowToast) onShowToast('Identity verified for user management', 'success');
    } else if (pendingAction === 'sendAnnouncement') {
      setShowNotifModal(true);
      if (onShowToast) onShowToast('Identity verified for broadcast', 'success');
    } else {
      setIsCheckedIn(true);
      if (onShowToast) onShowToast('Admin secure check-in successful!', 'success');
    }
    
    setPendingAction(null);
    setTimeout(() => {
      setShowBiometricModal(false);
    }, 1500);
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* System Status Banner - More Professional */}
      <div className="bg-gray-900 text-white p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center space-x-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">System Core Operational</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">All services performing within normal parameters</p>
          </div>
        </div>
        <div className="flex items-center space-x-8">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Uptime</p>
            <p className="text-sm font-black text-emerald-400">99.998%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Response</p>
            <p className="text-sm font-black text-emerald-400">18ms</p>
          </div>
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className={`${stat.bg} ${stat.color} w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className={`px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center ${
                stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl md:text-4xl font-black text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Trends */}
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-black/5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">System Analytics</h3>
              <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Global Attendance & Engagement Metrics</p>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl self-end sm:self-auto">
              {['7D', '30D', '6M'].map(t => (
                <button key={t} className={`px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-black rounded-lg transition-all ${t === '30D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-72 flex items-end justify-between px-4">
            {[65, 78, 82, 75, 88, 92, 85, 70, 95, 80, 88, 90].map((val, i) => (
              <div key={i} className="w-8 group relative">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  className={`rounded-t-lg transition-all duration-500 ${val > 85 ? 'bg-indigo-600 group-hover:bg-indigo-400' : 'bg-gray-200 group-hover:bg-gray-300'}`}
                />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                  {val}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6 px-4">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
              <span key={m} className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{m}</span>
            ))}
          </div>
        </div>

        {/* System Health & Audit Logs */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-black/5 shadow-sm">
            <h3 className="text-xl font-black mb-8">Infrastructure</h3>
            <div className="space-y-6">
              {[
                { label: 'Database Cluster', status: 'Healthy', load: '12%', color: 'text-emerald-500' },
                { label: 'Auth Service', status: 'Healthy', load: '4%', color: 'text-emerald-500' },
                { label: 'Storage API', status: 'Warning', load: '88%', color: 'text-amber-500' },
              ].map((service, i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{service.label}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${service.color}`}>{service.status}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${service.color.replace('text', 'bg')}`} style={{ width: service.load }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{service.load}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">Audit Trail</h3>
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { user: 'Admin', action: 'Updated Rules', time: '2m ago' },
                { user: 'System', action: 'Backup Complete', time: '15m ago' },
                { user: 'Faculty', action: 'Class Created', time: '1h ago' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-black/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <span className="font-black text-gray-900">{log.user}</span>
                    <span className="text-gray-400 ml-2">{log.action}</span>
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h3 className="text-xl md:text-2xl font-black">User Management</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 md:-mx-8">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="text-left text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-black/5">
              <th className="px-6 md:px-8 pb-4">Name</th>
              <th className="px-6 md:px-8 pb-4">Role</th>
              <th className="px-6 md:px-8 pb-4">Status</th>
              <th className="px-6 md:px-8 pb-4">Joined</th>
              <th className="px-6 md:px-8 pb-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 md:px-8 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs md:text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-bold text-gray-900">{u.name}</p>
                      <p className="text-[10px] md:text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 md:px-8 py-4">
                  <span className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                    u.role === 'faculty' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 md:px-8 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500`}></div>
                    <span className="text-xs md:text-sm text-gray-600 capitalize">Active</span>
                  </div>
                </td>
                <td className="px-6 md:px-8 py-4">
                  <span className="text-xs md:text-sm text-gray-500">2024-01-01</span>
                </td>
                <td className="px-6 md:px-8 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteUserId(u.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black">Course Catalog</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="p-6 rounded-3xl bg-gray-50 border border-black/5 hover:border-indigo-200 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl border border-black/5 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600`}>
                Active
              </span>
            </div>
            <h4 className="text-lg font-black text-gray-900 mb-2">{course.subject}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Instructor: {course.instructor}</p>
            <div className="flex items-center justify-between pt-4 border-t border-black/5">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">42 Students</span>
              </div>
              <div className="flex items-center space-x-3">
                <button className="text-indigo-600 text-xs font-bold hover:underline">Edit</button>
                <button 
                  onClick={() => setDeleteCourseId(course.id)}
                  className="text-red-600 text-xs font-bold hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <AnalyticsModule />
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Admin Control Center</h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">System Administrator: <span className="font-bold text-indigo-600">{user.name}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => {
              setPendingAction(null);
              setShowBiometricModal(true);
            }}
            disabled={isCheckedIn}
            className={`flex-1 sm:flex-none px-4 md:px-6 py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm transition-all shadow-sm flex items-center justify-center space-x-2 ${
              isCheckedIn 
                ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100 cursor-default' 
                : 'bg-white text-indigo-600 border border-black/5 hover:bg-indigo-50 shadow-indigo-100'
            }`}
          >
            {isCheckedIn ? <ShieldCheck className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
            <span>{isCheckedIn ? 'Securely Checked In' : 'Secure Check-in'}</span>
          </button>
          <button 
            onClick={() => {
              setPendingAction('sendAnnouncement');
              setShowBiometricModal(true);
            }}
            className="flex-1 sm:flex-none px-4 md:px-6 py-3 md:py-4 bg-white border border-black/5 rounded-2xl font-black text-xs md:text-sm text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm flex items-center justify-center space-x-2"
          >
            <Bell className="w-4 h-4" />
            <span>Send Announcement</span>
          </button>
          <button 
            onClick={() => alert('Generating system report...')}
            className="flex-1 sm:flex-none px-4 md:px-6 py-3 md:py-4 bg-white border border-black/5 rounded-2xl font-black text-xs md:text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            Export Report
          </button>
          <button 
            onClick={() => {
              setPendingAction('addUser');
              setShowBiometricModal(true);
            }}
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && renderOverview()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'courses' && renderCourses()}
      {activeTab === 'analytics' && renderAnalytics()}

      {/* Biometric Verification Modal */}
      <AnimatePresence>
        {showBiometricModal && (
          <BiometricVerification 
            subject={
              pendingAction === 'addUser' ? 'User Management' :
              pendingAction === 'sendAnnouncement' ? 'Broadcast Announcement' :
              'Admin Secure Access'
            }
            onSuccess={handleCheckInSuccess}
            onCancel={() => {
              setShowBiometricModal(false);
              setPendingAction(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete User"
        type="danger"
      />

      <ConfirmationModal 
        isOpen={!!deleteCourseId}
        onClose={() => setDeleteCourseId(null)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        message="Are you sure you want to delete this course? This will remove the course from the catalog and all student schedules."
        confirmText="Delete Course"
        type="danger"
      />

      {/* Send Announcement Modal */}
      <AnimatePresence>
        {showNotifModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-gray-900">Send Announcement</h3>
                  <button onClick={() => setShowNotifModal(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                <form onSubmit={handleSendAnnouncement} className="space-y-6">
                  {notifError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-bold">{notifError}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Announcement Title"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Message</label>
                    <textarea 
                      required
                      placeholder="Enter announcement details..."
                      rows={3}
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Target Audience</label>
                      <select 
                        value={notifTarget}
                        onChange={(e) => setNotifTarget(e.target.value as any)}
                        className="w-full px-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      >
                        <option value="all">Everyone</option>
                        <option value="student">Students Only</option>
                        <option value="faculty">Faculty Only</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Alert Type</label>
                      <select 
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value as any)}
                        className="w-full px-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      >
                        <option value="info">Information</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Critical</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSendingNotif}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    {isSendingNotif ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Bell className="w-5 h-5" />
                        <span>Broadcast Now</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-gray-900">Add New User</h3>
                  <button onClick={() => setShowAddModal(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                <form onSubmit={handleCreateUser} className="space-y-6">
                  {userError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-bold">{userError}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-6 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="john@edu.com"
                      className="w-full px-6 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Role</label>
                    <select 
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    disabled={isCreatingUser}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    {isCreatingUser ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
