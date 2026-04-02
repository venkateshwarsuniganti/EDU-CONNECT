import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, CheckSquare, TrendingUp, MoreVertical, X, Plus, Search, ChevronRight, UserCheck, UserX, Clock, Loader2, Trash2, CheckCircle2, Circle, ShieldCheck, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ClassSchedule, AttendanceRecord, Todo } from '../types';
import { api } from '../services/api';
import { ToastType } from './Toast';
import BiometricVerification from './BiometricVerification';

import { AlertCircle } from 'lucide-react';
import AnalyticsModule from './AnalyticsModule';
import ConfirmationModal from './ConfirmationModal';

const MOCK_CLASSES = [
  { id: '1', name: 'Advanced Mathematics', students: 42, attendance: '95%', nextClass: 'Tomorrow, 09:00 AM' },
  { id: '2', name: 'Cloud Computing', students: 38, attendance: '88%', nextClass: 'Today, 11:00 AM' },
  { id: '3', name: 'Software Engineering', students: 45, attendance: '92%', nextClass: 'Friday, 02:00 PM' },
];

const MOCK_STUDENTS = [
  { id: 'STU001', name: 'Alex Johnson', roll: 'STU2024001', attendance: 94, status: 'Present' },
  { id: 'STU002', name: 'Sarah Williams', roll: 'STU2024002', attendance: 88, status: 'Absent' },
  { id: 'STU003', name: 'Michael Chen', roll: 'STU2024003', attendance: 91, status: 'Late' },
  { id: 'STU004', name: 'Emily Davis', roll: 'STU2024004', attendance: 96, status: 'Present' },
  { id: 'STU005', name: 'James Wilson', roll: 'STU2024005', attendance: 82, status: 'Present' },
  { id: 'STU006', name: 'Olivia Brown', roll: 'STU2024006', attendance: 89, status: 'Present' },
];

const MOCK_HISTORY = [
  { date: '2024-03-12', status: 'Present', subject: 'Advanced Mathematics' },
  { date: '2024-03-11', status: 'Present', subject: 'Cloud Computing' },
  { date: '2024-03-10', status: 'Late', subject: 'Software Engineering' },
  { date: '2024-03-09', status: 'Present', subject: 'Advanced Mathematics' },
  { date: '2024-03-08', status: 'Absent', subject: 'Cloud Computing' },
  { date: '2024-03-07', status: 'Present', subject: 'Software Engineering' },
];

interface FacultyDashboardProps {
  user: User;
  activeTab: string;
  onShowToast?: (message: string, type: ToastType) => void;
}

export default function FacultyDashboard({ user, activeTab, onShowToast }: FacultyDashboardProps) {
  if (user.role !== 'faculty') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You do not have permission to view the faculty portal.</p>
        </div>
      </div>
    );
  }

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newClassSchedule, setNewClassSchedule] = useState('Mon/Wed/Fri');
  const [newClassTime, setNewClassTime] = useState('09:00 AM');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    const newRelativePathQuery = window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleData, usersData, todosData] = await Promise.all([
          api.schedule.get(),
          api.users.getAll(),
          api.todos.get(user.id)
        ]);
        setSchedule(scheduleData.filter(s => s.facultyId === user.id || (s.instructor && s.instructor.includes(user.name.split(' ').pop() || ''))));
        setAllStudents(usersData.filter(u => u.role === 'student'));
        setTodos(todosData);
      } catch (error) {
        console.error('Failed to fetch faculty data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.id, user.name]);

  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (newClassName.trim().length < 3) {
      setCreateError('Class name must be at least 3 characters long');
      return;
    }

    if (!newCourseCode.trim()) {
      setCreateError('Course code is required');
      return;
    }

    setIsCreatingClass(true);
    try {
      await api.schedule.add({
        subject: newClassName,
        courseCode: newCourseCode,
        time: `${newClassSchedule} | ${newClassTime}`,
        room: 'Room ' + (Math.floor(Math.random() * 500) + 100),
        instructor: `Dr. ${user.name.split(' ').pop()}`,
        facultyId: user.id
      });
      const updatedSchedule = await api.schedule.get();
      setSchedule(updatedSchedule.filter(s => s.facultyId === user.id));
      setShowCreateModal(false);
      setNewClassName('');
      setNewCourseCode('');
      setNewClassSchedule('Mon/Wed/Fri');
      setNewClassTime('09:00 AM');
      if (onShowToast) onShowToast('Class created successfully!', 'success');
    } catch (error) {
      setCreateError('Failed to create class. Please try again.');
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteClassId) return;
    try {
      await api.schedule.delete(deleteClassId);
      setSchedule(prev => prev.filter(s => s.id !== deleteClassId));
      setDeleteClassId(null);
      if (onShowToast) onShowToast('Class deleted successfully!', 'success');
    } catch (error) {
      if (onShowToast) onShowToast('Failed to delete class. Please try again.', 'error');
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setIsAddingTodo(true);
    try {
      const todo = await api.todos.add(user.id, newTodo);
      setTodos(prev => [todo, ...prev]);
      setNewTodo('');
    } catch (error) {
      console.error('Failed to add todo', error);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await api.todos.update(todo.id, !todo.completed);
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
    } catch (error) {
      console.error('Failed to toggle todo', error);
    }
  };

  const handleCheckInSuccess = async () => {
    if (selectedClass) {
      // If we were trying to mark attendance for a class
      setSelectedClassId(selectedClass.id);
      if (onShowToast) onShowToast(`Verified for ${selectedClass.subject} attendance`, 'success');
      setSelectedClass(null);
    } else {
      // General faculty check-in
      setIsCheckedIn(true);
      if (onShowToast) onShowToast('Faculty check-in successful!', 'success');
    }
    
    setTimeout(() => {
      setShowBiometricModal(false);
    }, 1500);
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await api.todos.delete(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo', error);
    }
  };

  const handleAdjustAttendance = async (studentId: string, newStatus: string) => {
    try {
      // Find the existing record for this student and class if it exists
      // For simplicity in this demo, we'll just mark a new one or update if we had the ID
      // In a real app, we'd fetch the specific attendance ID first
      await api.attendance.mark({
        studentId,
        subject: schedule.find(c => c.id === selectedClassId)?.subject || 'Unknown',
        status: newStatus as any,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        classId: selectedClassId || 'manual'
      });
      alert(`Attendance for student marked as ${newStatus}`);
    } catch (error) {
      alert('Failed to update attendance');
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Top Header Stats - More Detailed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: '125', trend: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', detail: 'Across 3 courses' },
          { label: 'Active Courses', value: '3', trend: 'Stable', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', detail: '12 sessions/week' },
          { label: 'Avg. Attendance', value: '91.6%', trend: '+2.4%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', detail: 'Above dept. avg' },
          { label: 'Pending Tasks', value: '12', trend: '-3', icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-50', detail: '5 due today' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.trend}</span>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
            <p className="text-[9px] md:text-[10px] text-gray-400 mt-2 font-medium">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed Class Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Class Management</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Advanced Controls & Performance</p>
              </div>
              <div className="flex space-x-2 self-end sm:self-auto">
                <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Search className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {schedule.map((cls) => (
                <div key={cls.id} className="group p-5 md:p-6 rounded-3xl bg-gray-50 border border-transparent hover:border-indigo-100 hover:bg-white transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4 md:space-x-6">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white border border-black/5 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h4 className="text-base md:text-lg font-black text-gray-900">{cls.subject}</h4>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] md:text-[10px] font-black rounded-md uppercase tracking-widest">
                            {cls.courseCode || 'CS101'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">
                          <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> 42 Students</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {cls.time.split('|')[1]?.trim() || cls.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 md:gap-8">
                      <div className="text-left md:text-right">
                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Attendance</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 md:w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: '92%' }}></div>
                          </div>
                          <span className="text-[10px] md:text-xs font-black text-emerald-600">92%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedClass(cls);
                            setShowBiometricModal(true);
                          }}
                          className="px-3 md:px-4 py-2 bg-white border border-black/5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          Manage
                        </button>
                        <button 
                          onClick={() => setDeleteClassId(cls.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Performance & Tasks */}
        <div className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm">
            <h3 className="text-lg md:text-xl font-black mb-6">Class Performance</h3>
            <div className="space-y-6">
              {[
                { label: 'Participation', value: 88, color: 'bg-blue-500' },
                { label: 'Assignment Completion', value: 94, color: 'bg-indigo-500' },
                { label: 'Exam Readiness', value: 76, color: 'bg-amber-500' },
              ].map((metric, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">{metric.label}</span>
                    <span className="text-gray-900">{metric.value}%</span>
                  </div>
                  <div className="h-1.5 md:h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      className={`h-full ${metric.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-gray-50 text-gray-900 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
              View Detailed Analytics
            </button>
          </div>

          <div className="bg-indigo-600 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <h4 className="text-base md:text-lg font-black mb-4">Quick Announcement</h4>
            <p className="text-[11px] md:text-xs text-indigo-100 mb-6 leading-relaxed">Broadcast a message to all your active classes instantly.</p>
            <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] md:text-xs hover:bg-indigo-50 transition-all shadow-lg">
              Create Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h3 className="text-2xl font-black">Student Directory</h3>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allStudents.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
        ).map((student) => (
          <div key={student.id} className="p-6 rounded-2xl bg-gray-50 border border-black/5 hover:border-indigo-200 transition-all group">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black">
                {student.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{student.name}</p>
                <p className="text-xs text-gray-400">Roll: {student.rollNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance</span>
                <span className={`text-xs font-black text-emerald-600`}>
                  92%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-emerald-500`}
                  style={{ width: `92%` }}
                />
              </div>
              <div className="flex justify-between pt-2">
                <button 
                  onClick={() => setSelectedStudent(student)}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center"
                >
                  View History <ChevronRight className="w-3 h-3 ml-1" />
                </button>
                <button 
                  onClick={() => alert(`Opening profile for ${student.name}`)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Full Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlanner = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
        <h3 className="text-2xl font-black mb-8 dark:text-white">Academic Planner</h3>
        <div className="space-y-6">
          {[
            { date: 'March 15, 2024', event: 'Mid-term Examination', type: 'exam' },
            { date: 'March 20, 2024', event: 'Project Submission Deadline', type: 'deadline' },
            { date: 'March 25, 2024', event: 'Guest Lecture: AI in Education', type: 'event' },
          ].map((item, i) => (
            <div key={i} className="flex items-center p-6 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
              <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-indigo-600 mr-6">
                <span className="text-[10px] font-bold uppercase">{item.date.split(' ')[0].substring(0, 3)}</span>
                <span className="text-lg font-black leading-none">{item.date.split(' ')[1].replace(',', '')}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{item.event}</p>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mt-1">{item.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black dark:text-white">To-Do List</h3>
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-full">
            {todos.filter(t => !t.completed).length} Pending
          </span>
        </div>

        <form onSubmit={handleAddTodo} className="mb-6 flex gap-2">
          <input 
            type="text" 
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
          />
          <button 
            type="submit"
            disabled={isAddingTodo || !newTodo.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {todos.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No tasks for today!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={todo.id} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  todo.completed 
                    ? 'bg-gray-50 dark:bg-zinc-800/30 border-transparent opacity-60' 
                    : 'bg-white dark:bg-zinc-800 border-black/5 dark:border-white/5 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => handleToggleTodo(todo)}
                    className={`transition-colors ${todo.completed ? 'text-emerald-500' : 'text-gray-300 hover:text-indigo-500'}`}
                  >
                    {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <span className={`text-sm font-bold ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-zinc-200'}`}>
                    {todo.title}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderTracker = () => {
    if (selectedClassId) {
      const selectedClass = schedule.find(c => c.id === selectedClassId);
      return (
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setSelectedClassId(null)}
              className="text-sm font-bold text-gray-400 hover:text-indigo-600 flex items-center"
            >
              <X className="w-4 h-4 mr-2" /> Back to Classes
            </button>
            <h3 className="text-xl font-black">{selectedClass?.subject} - Attendance</h3>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Today: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-black/5">
                  <th className="pb-4">Student Name</th>
                  <th className="pb-4">Roll Number</th>
                  <th className="pb-4">Current Status</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {allStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <span className="font-bold text-gray-900">{student.name}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-gray-500">{student.rollNumber || 'N/A'}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600`}>
                        Pending
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleAdjustAttendance(student.id, 'Present')}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          title="Mark Present"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAdjustAttendance(student.id, 'Late')}
                          className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all"
                          title="Mark Late"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAdjustAttendance(student.id, 'Absent')}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                          title="Mark Absent"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => {
                alert('Attendance saved successfully!');
                setSelectedClassId(null);
              }}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg"
            >
              Save Attendance
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
        <h3 className="text-2xl font-black mb-8">Attendance Tracker</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schedule.map((cls) => (
            <div key={cls.id} className="p-6 rounded-2xl bg-gray-50 border border-black/5 hover:border-indigo-200 transition-all flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900">{cls.subject}</h4>
                <span className="text-xs font-black text-indigo-600">92% Avg.</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex mb-6">
                <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                <div className="h-full bg-amber-400" style={{ width: '10%' }}></div>
                <div className="h-full bg-red-500" style={{ width: '5%' }}></div>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <button 
                  onClick={() => {
                    const clsToMark = schedule.find(c => c.id === cls.id);
                    if (clsToMark) {
                      setSelectedClass(clsToMark as any);
                      setShowBiometricModal(true);
                      // We'll use a temporary state or check the subject in handleCheckInSuccess
                      // to distinguish between general check-in and class attendance
                    }
                  }}
                  className="bg-white px-4 py-2 border border-black/5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Mark Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Welcome, Prof. {user.name.split(' ').pop()}</h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">Faculty ID: <span className="font-bold text-indigo-600">{user.employeeId || 'N/A'}</span></p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowBiometricModal(true)}
            disabled={isCheckedIn}
            className={`w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2 ${
              isCheckedIn 
                ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100 cursor-default' 
                : 'bg-white text-indigo-600 border border-black/5 hover:bg-indigo-50 shadow-indigo-100'
            }`}
          >
            {isCheckedIn ? <ShieldCheck className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
            <span>{isCheckedIn ? 'Checked In' : 'Faculty Check-in'}</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        </div>
      </div>


      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'students' && renderStudents()}
      {activeTab === 'planner' && renderPlanner()}
      {activeTab === 'tracker' && renderTracker()}
      {activeTab === 'analytics' && <AnalyticsModule />}

      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={!!deleteClassId}
        onClose={() => setDeleteClassId(null)}
        onConfirm={handleDeleteClass}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone and all associated attendance data will be lost."
        confirmText="Delete Class"
        type="danger"
      />

      {/* Modals */}
      <AnimatePresence>
        {/* Biometric Verification Modal */}
        {showBiometricModal && (
          <BiometricVerification 
            subject={selectedClass ? `${selectedClass.subject} Attendance` : "Faculty Check-in"}
            onSuccess={handleCheckInSuccess}
            onCancel={() => {
              setShowBiometricModal(false);
              setSelectedClass(null);
            }}
          />
        )}

        {/* Create Class Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
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
                  <h3 className="text-2xl font-black text-gray-900">Create New Class</h3>
                  <button onClick={() => setShowCreateModal(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                <form onSubmit={handleCreateClass} className="space-y-6">
                  {createError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-bold">{createError}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Class Name</label>
                      <input 
                        type="text" 
                        required
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="e.g. Advanced Math"
                        className="w-full px-6 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Course Code</label>
                      <input 
                        type="text" 
                        required
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        placeholder="e.g. CS101"
                        className="w-full px-6 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Schedule</label>
                        <select 
                          value={newClassSchedule}
                          onChange={(e) => setNewClassSchedule(e.target.value)}
                          className="w-full px-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                        >
                          <option value="Mon/Wed/Fri">Mon/Wed/Fri</option>
                          <option value="Tue/Thu">Tue/Thu</option>
                          <option value="Weekends">Weekends</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Time Slot</label>
                        <select 
                          value={newClassTime}
                          onChange={(e) => setNewClassTime(e.target.value)}
                          className="w-full px-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                        >
                          <option value="09:00 AM">09:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="02:00 PM">02:00 PM</option>
                        </select>
                      </div>
                    </div>
                  <button 
                    type="submit"
                    disabled={isCreatingClass}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    {isCreatingClass ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      'Create Class'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Student History Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-sm text-gray-400">Attendance History - Past Month</p>
                  </div>
                  <button onClick={() => setSelectedStudent(null)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Present</p>
                    <p className="text-2xl font-black text-emerald-700">22</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Late</p>
                    <p className="text-2xl font-black text-amber-700">3</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Absent</p>
                    <p className="text-2xl font-black text-red-700">1</p>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {MOCK_HISTORY.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-black/5">
                      <div>
                        <p className="font-bold text-gray-900">{log.subject}</p>
                        <p className="text-xs text-gray-400">{log.date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        log.status === 'Present' ? 'bg-emerald-100 text-emerald-600' :
                        log.status === 'Absent' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
