import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Fingerprint, 
  ArrowRight,
  Check,
  Loader2,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClassSchedule, AttendanceRecord, User } from '../types';
import BiometricVerification from './BiometricVerification';
import { api } from '../services/api';
import { ToastType } from './Toast';

const MOCK_SCHEDULE: ClassSchedule[] = [
  { id: '1', subject: 'Advanced Mathematics', time: '09:00 AM - 10:30 AM', room: 'Room 302', instructor: 'Dr. Sarah Smith', isMarked: false },
  { id: '2', subject: 'Cloud Computing', time: '11:00 AM - 12:30 PM', room: 'Lab 104', instructor: 'Prof. James Wilson', isMarked: false },
  { id: '3', subject: 'Software Engineering', time: '02:00 PM - 03:30 PM', room: 'Room 201', instructor: 'Dr. Robert Brown', isMarked: false },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { studentId: '1', date: '2024-03-12', time: '09:15 AM', timestamp: 1710234900000, status: 'present', subject: 'Mathematics', classId: 'm1' },
  { studentId: '1', date: '2024-03-11', time: '11:05 AM', timestamp: 1710155100000, status: 'absent', subject: 'Cloud Computing', classId: 'c1' },
  { studentId: '1', date: '2024-03-10', time: '02:10 PM', timestamp: 1710079800000, status: 'present', subject: 'Software Engineering', classId: 's1' },
  { studentId: '1', date: '2024-03-09', time: '09:20 AM', timestamp: 1709976000000, status: 'late', subject: 'Mathematics', classId: 'm2' },
];

interface StudentDashboardProps {
  user: User;
  activeTab: string;
  onShowToast?: (message: string, type: ToastType) => void;
}

export default function StudentDashboard({ user, activeTab, onShowToast }: StudentDashboardProps) {
  if (user.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You do not have permission to view the student portal.</p>
        </div>
      </div>
    );
  }

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [advisor, setAdvisor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceData, scheduleData, advisorData] = await Promise.all([
          api.attendance.get(user.id),
          api.schedule.get(),
          api.advisors.get(user.id)
        ]);
        setAttendance(attendanceData);
        setSchedule(scheduleData);
        setAdvisor(advisorData);
      } catch (error) {
        console.error('Failed to fetch student data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const handleMarkAttendance = (cls: ClassSchedule) => {
    if (cls.isMarked) return;
    setSelectedClass(cls);
    setShowBiometricModal(true);
  };

  const handleVerificationSuccess = async () => {
    if (!selectedClass) return;

    const now = new Date();
    const newRecord: AttendanceRecord = {
      studentId: user.id,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
      status: 'present',
      subject: selectedClass.subject,
      classId: selectedClass.id
    };

    try {
      await api.attendance.mark(newRecord);
      setAttendance(prev => [newRecord, ...prev]);
      setSchedule(prev => prev.map(s => s.id === selectedClass.id ? { ...s, isMarked: true } : s));
      
      if (onShowToast) onShowToast(`Attendance marked for ${selectedClass.subject}`, 'success');
      
      setTimeout(() => {
        setShowBiometricModal(false);
        setSelectedClass(null);
      }, 1500);
    } catch (error) {
      if (onShowToast) onShowToast('Failed to mark attendance. Please try again.', 'error');
    }
  };

  // Generate mock history for the past month
  const pastMonthHistory = useMemo(() => {
    const history: AttendanceRecord[] = [...attendance];
    const subjects = ['Mathematics', 'Cloud Computing', 'Software Engineering', 'Database Systems'];
    const statuses: ('present' | 'absent' | 'late')[] = ['present', 'present', 'present', 'absent', 'late'];
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Don't duplicate if already in attendance state
      if (!history.some(r => r.date === dateStr)) {
        history.push({
          studentId: user.id,
          date: dateStr,
          time: '09:00 AM',
          timestamp: date.getTime(),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          classId: `mock-${i}`
        });
      }
    }
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, user.id]);

  // Filter schedule for today only for the main dashboard view
  const todaysSchedule = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    // In a real app, schedule items would have a 'day' property. 
    // For this demo, we'll assume the mock schedule is for today or filter if day exists.
    return schedule; 
  }, [schedule]);

  const attendanceStats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const relevantRecords = pastMonthHistory.filter(r => new Date(r.date) >= thirtyDaysAgo);
    const attended = relevantRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const total = relevantRecords.length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    return { attended, total, percentage };
  }, [pastMonthHistory]);

  const handleContactAdvisor = async () => {
    // Simulate API call
    const btn = document.activeElement as HTMLButtonElement;
    if (btn) btn.disabled = true;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (onShowToast) onShowToast('A request has been sent to your Academic Advisor. They will contact you shortly.', 'success');
    
    if (btn) btn.disabled = false;
  };

  const renderDashboard = () => (
    <div className="space-y-10">
      {/* Essential Attendance Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-gray-900">Attendance Overview</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Last 30 Days Performance</p>
          </div>
          
          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 sm:gap-0">
            <div className="space-y-1">
              <p className="text-5xl md:text-6xl font-black text-indigo-600">{attendanceStats.percentage}%</p>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Overall Attendance</p>
            </div>
            <div className="flex space-x-6 md:space-x-8">
              <div className="text-left sm:text-right">
                <p className="text-xl md:text-2xl font-black text-gray-900">{attendanceStats.attended}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attended</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xl md:text-2xl font-black text-gray-900">{attendanceStats.total - attendanceStats.attended}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Missed</p>
              </div>
            </div>
          </div>

          <div className="mt-8 h-2 md:h-3 w-full bg-gray-50 rounded-full overflow-hidden flex">
            <div className="h-full bg-indigo-600" style={{ width: `${attendanceStats.percentage}%` }}></div>
            <div className="h-full bg-red-400" style={{ width: `${100 - attendanceStats.percentage}%` }}></div>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="mb-6 md:mb-0">
            <h4 className="text-lg font-black">Quick Action</h4>
            <p className="text-xs text-indigo-100 mt-2 leading-relaxed">Mark your attendance for the current session instantly.</p>
          </div>
          <button 
            onClick={() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const nextClass = todaysSchedule.find(c => !attendance.some(r => r.classId === c.id && r.date === todayStr));
              if (nextClass) {
                setSelectedClass(nextClass);
                setShowBiometricModal(true);
              } else if (todaysSchedule.length > 0) {
                setSelectedClass(todaysSchedule[0]);
                setShowBiometricModal(true);
              } else {
                if (onShowToast) onShowToast('No classes scheduled for today', 'info');
              }
            }}
            className="w-full py-4 md:py-5 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
          >
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Today's Schedule - The Core Focus */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xl font-black text-gray-900">Today's Schedule</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {todaysSchedule.length > 0 ? (
            todaysSchedule.map((cls, i) => {
              const isMarked = attendance.some(r => r.classId === cls.id && r.date === new Date().toISOString().split('T')[0]);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={cls.id} 
                  className="group bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    {isMarked ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-widest flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Marked
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Upcoming</span>
                    )}
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-1">{cls.subject}</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{cls.courseCode || 'CS101'}</p>
                  
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center text-xs text-gray-500 font-bold uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                      {cls.time.split('|')[1]?.trim() || cls.time}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 font-bold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                      {cls.room}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No classes scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
      <h3 className="text-xl md:text-2xl font-black mb-8">Weekly Class Schedule</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <div key={day} className="space-y-4">
            <div className="py-2 px-4 bg-indigo-50 text-indigo-600 rounded-xl font-black text-center text-xs md:text-sm uppercase tracking-widest">
              {day}
            </div>
            <div className="space-y-3">
              {schedule.map((cls, idx) => (
                <div key={`${day}-${idx}`} className="p-4 bg-gray-50 rounded-2xl border border-black/5 hover:border-indigo-200 transition-colors">
                  <p className="font-black text-gray-900 text-xs md:text-sm leading-tight">{cls.subject}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{cls.time.split(' - ')[0]}</p>
                  <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{cls.room}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const filteredAttendance = useMemo(() => {
    if (attendanceFilter === 'All') return pastMonthHistory;
    return pastMonthHistory.filter(r => r.status.toLowerCase() === attendanceFilter.toLowerCase());
  }, [pastMonthHistory, attendanceFilter]);

  const renderAttendance = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Classes</p>
          <p className="text-2xl md:text-3xl font-black text-gray-900">{pastMonthHistory.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Present</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-600">{pastMonthHistory.filter(r => r.status === 'present').length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Absent</p>
          <p className="text-2xl md:text-3xl font-black text-red-600">{pastMonthHistory.filter(r => r.status === 'absent').length}</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h3 className="text-xl font-black">Detailed Attendance Log</h3>
          <div className="flex flex-wrap gap-2">
            {['All', 'Present', 'Absent', 'Late'].map((filter) => (
              <button 
                key={filter} 
                onClick={() => setAttendanceFilter(filter)}
                className={`px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-colors ${
                  attendanceFilter === filter 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredAttendance.length > 0 ? (
            filteredAttendance.map((record, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-black/5 hover:bg-white transition-colors">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                    record.status === 'present' ? 'bg-emerald-100 text-emerald-600' :
                    record.status === 'absent' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {record.status === 'present' ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : 
                     record.status === 'absent' ? <XCircle className="w-4 h-4 md:w-5 md:h-5" /> : 
                     <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm md:text-base">{record.subject}</p>
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium">{record.date}</p>
                  </div>
                </div>
                <span className={`px-2 md:px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider ${
                  record.status === 'present' ? 'bg-emerald-100 text-emerald-600' :
                  record.status === 'absent' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {record.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest text-xs">
              No records found for this filter
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {['Advanced Mathematics', 'Cloud Computing', 'Software Engineering', 'Database Systems', 'Artificial Intelligence', 'Network Security'].map((course) => (
        <div key={course} className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm hover:border-indigo-200 transition-all group">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-black text-gray-900 mb-2">{course}</h4>
          <p className="text-sm text-gray-500 mb-6">Explore the fundamentals and advanced concepts of {course.toLowerCase()}.</p>
          <button 
            onClick={() => setSelectedCourse(course)}
            className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all"
          >
            View Course Details
          </button>
        </div>
      ))}
    </div>
  );

  const renderAdvisor = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-100 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-3xl md:text-4xl font-black text-indigo-600">
            {advisor?.name.charAt(0) || 'A'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-gray-900">{advisor?.name || 'Assigned Advisor'}</h3>
            <p className="text-indigo-600 font-bold mt-1 text-sm md:text-base">Academic Advisor - Computer Science</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 mt-6">
              <div className="flex items-center space-x-2 text-[10px] md:text-sm text-gray-500 bg-gray-50 px-3 md:px-4 py-2 rounded-xl">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-400" />
                <span>Available: Mon-Fri, 2PM - 5PM</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] md:text-sm text-gray-500 bg-gray-50 px-3 md:px-4 py-2 rounded-xl">
                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-400" />
                <span>Office: Block B, Room 405</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
          <h4 className="text-lg md:text-xl font-black mb-6">Send a Message</h4>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent to advisor!'); }}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Subject</label>
              <input type="text" placeholder="e.g. Course Registration Query" className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Message</label>
              <textarea rows={4} placeholder="Type your message here..." className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm"></textarea>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95">
              Send Message
            </button>
          </form>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm">
          <h4 className="text-lg md:text-xl font-black mb-6">Schedule a Meeting</h4>
          <div className="space-y-4">
            {[
              { day: 'Monday', time: '02:30 PM', status: 'Available' },
              { day: 'Wednesday', time: '03:00 PM', status: 'Available' },
              { day: 'Friday', time: '10:00 AM', status: 'Booked' },
            ].map((slot, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-black/5">
                <div>
                  <p className="font-bold text-gray-900 text-sm md:text-base">{slot.day}</p>
                  <p className="text-[10px] md:text-xs text-gray-400">{slot.time}</p>
                </div>
                <button 
                  disabled={slot.status === 'Booked'}
                  onClick={() => {
                    if (onShowToast) onShowToast(`Meeting booked for ${slot.day} at ${slot.time}`, 'success');
                  }}
                  className={`px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    slot.status === 'Available' 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {slot.status === 'Available' ? 'Book Slot' : 'Full'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Welcome back, {user.name}!</h2>
          <p className="text-sm md:text-base text-gray-500">Roll Number: <span className="font-bold text-indigo-600">{user.rollNumber || 'N/A'}</span></p>
        </div>
        <div className="bg-white px-5 md:px-6 py-3 rounded-2xl border border-black/5 shadow-sm flex items-center space-x-4 self-start md:self-auto">
          <div className="text-right">
            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Semester</p>
            <p className="text-sm md:text-base font-bold text-indigo-600">Spring 2024</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'schedule' && renderSchedule()}
      {activeTab === 'attendance' && renderAttendance()}
      {activeTab === 'courses' && renderCourses()}
      {activeTab === 'advisor' && renderAdvisor()}

      {/* Course Details Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCourse(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-gray-900">{selectedCourse}</h3>
                  <button onClick={() => setSelectedCourse(null)}>
                    <XCircle className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-50 rounded-2xl">
                    <p className="text-sm text-indigo-900 leading-relaxed">
                      This course covers the comprehensive study of {selectedCourse.toLowerCase()}, focusing on both theoretical foundations and practical applications in modern industry.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Credits</p>
                      <p className="font-black text-gray-900">4.0 Units</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                      <p className="font-black text-gray-900">16 Weeks</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCourse(null)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Biometric Verification Modal */}
      <AnimatePresence>
        {showBiometricModal && selectedClass && (
          <BiometricVerification 
            subject={selectedClass.subject}
            onSuccess={handleVerificationSuccess}
            onCancel={() => setShowBiometricModal(false)}
          />
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900">Attendance History</h3>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto">
                <div className="space-y-3">
                  {pastMonthHistory.map((record, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-black/5">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          record.status === 'present' ? 'bg-emerald-100 text-emerald-600' :
                          record.status === 'absent' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {record.status === 'present' ? <Check className="w-5 h-5" /> : 
                           record.status === 'absent' ? <XCircle className="w-5 h-5" /> : 
                           <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{record.subject}</p>
                          <p className="text-xs text-gray-400 font-medium">{record.date}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        record.status === 'present' ? 'bg-emerald-100 text-emerald-600' :
                        record.status === 'absent' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8 bg-gray-50 border-t border-black/5">
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

