import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  UserCheck, 
  LogOut, 
  Bell, 
  Search,
  BookOpen,
  Users,
  TrendingUp,
  X,
  Check,
  Info,
  AlertTriangle,
  AlertCircle,
  Sun,
  Moon,
  ChevronRight,
  Shield,
  User as UserIcon,
  Menu
} from 'lucide-react';
import { UserRole, Notification, User, ClassSchedule } from '../types';
import { ROLE_PERMISSIONS, AVATAR_ICONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from './ConfirmationModal';
import { api } from '../services/api';

interface SidebarItem {
  icon: any;
  label: string;
  id: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications?: Notification[];
  onMarkRead?: (id: string) => void;
  onClearAll?: () => void;
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function DashboardLayout({ 
  children, 
  user, 
  onLogout, 
  activeTab, 
  setActiveTab,
  notifications = [],
  onMarkRead,
  onClearAll,
  onThemeChange
}: DashboardLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<{ type: string, label: string, id: string }[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(user.theme || 'light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const role = user.role;
  const userName = user.name;

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    if (onThemeChange) onThemeChange(newTheme);
    try {
      await api.users.updateTheme(user.id, newTheme);
    } catch (e) {
      console.error('Failed to persist theme', e);
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    try {
      const [users, schedule] = await Promise.all([
        api.users.getAll(),
        api.schedule.get()
      ]);

      const suggestions: { type: string, label: string, id: string }[] = [];

      users.filter(u => u.name.toLowerCase().includes(query.toLowerCase())).forEach(u => {
        suggestions.push({ type: 'User', label: u.name, id: u.id });
      });

      schedule.filter(s => s.subject.toLowerCase().includes(query.toLowerCase())).forEach(s => {
        suggestions.push({ type: 'Class', label: s.subject, id: s.id });
      });

      setSearchSuggestions(suggestions.slice(0, 5));
      setShowSearchSuggestions(suggestions.length > 0);
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  const menuItems = useMemo(() => {
    const allItems: Record<string, SidebarItem> = {
      dashboard: { icon: LayoutDashboard, label: role === 'admin' ? 'Overview' : 'Dashboard', id: 'dashboard' },
      schedule: { icon: Calendar, label: 'Schedule', id: 'schedule' },
      attendance: { icon: UserCheck, label: 'Attendance', id: 'attendance' },
      courses: { icon: BookOpen, label: role === 'admin' ? 'Course Catalog' : 'Courses', id: 'courses' },
      students: { icon: Users, label: 'My Students', id: 'students' },
      planner: { icon: Calendar, label: 'Class Planner', id: 'planner' },
      tracker: { icon: UserCheck, label: 'Attendance Tracker', id: 'tracker' },
      analytics: { icon: TrendingUp, label: role === 'faculty' ? 'Reports' : 'Analytics', id: 'analytics' },
      users: { icon: Users, label: 'User Management', id: 'users' },
      advisor: { icon: Shield, label: 'My Advisor', id: 'advisor' },
      profile: { icon: UserIcon, label: 'My Profile', id: 'profile' },
    };

    const allowedIds = ROLE_PERMISSIONS[role] || [];
    return allowedIds.map(id => allItems[id]).filter(Boolean);
  }, [role]);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-[#F5F5F5]'}`}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col transition-all duration-300 transform lg:relative lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5'
      }`}>
        <div className={`p-6 border-b flex items-center justify-between transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-black/5'
        }`}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-indigo-500">EduConnect</h1>
            <p className={`text-xs mt-1 uppercase tracking-widest font-medium ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {role} Portal
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-black/5'
        }`}>
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors mb-2 ${
              theme === 'dark' ? 'text-amber-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`h-16 border-b flex items-center justify-between px-4 lg:px-8 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5'
        }`}>
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search for classes, users..." 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchSuggestions(true)}
                className={`w-full pl-10 pr-4 py-2 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              />
              
              <AnimatePresence>
                {showSearchSuggestions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSearchSuggestions(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5'
                      }`}
                    >
                      <div className="p-2">
                        {searchSuggestions.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSearchQuery('');
                              setSearchSuggestions([]);
                              setShowSearchSuggestions(false);
                              if (s.type === 'User') {
                                setActiveTab('students');
                              } else if (s.type === 'Class') {
                                setActiveTab('tracker');
                              }
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-left ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div>
                              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.label}</p>
                              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{s.type}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-6">
            <button 
              className="md:hidden p-2 text-gray-400 hover:text-indigo-600"
              onClick={() => {/* Toggle mobile search if needed */}}
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 transition-all rounded-xl ${
                  showNotifications 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-80 rounded-3xl shadow-2xl border z-50 overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5'
                      }`}
                    >
                      <div className={`p-4 border-b flex items-center justify-between ${
                        theme === 'dark' ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50/50 border-black/5'
                      }`}>
                        <h3 className={`font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => setShowClearConfirm(true)}
                            className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                            }`}>
                              <Bell className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No new notifications</p>
                          </div>
                        ) : (
                          <div className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-black/5'}`}>
                            {notifications.map((n) => (
                              <div 
                                key={n.id} 
                                className={`p-4 transition-colors cursor-pointer relative group ${
                                  !n.read 
                                    ? theme === 'dark' ? 'bg-indigo-900/20' : 'bg-indigo-50/30' 
                                    : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => {
                                  onMarkRead?.(n.id);
                                }}
                              >
                                <div className="flex space-x-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                    n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                    n.type === 'error' ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {n.type === 'success' ? <Check className="w-4 h-4" /> :
                                     n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                     n.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                                     <Info className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${
                                      !n.read 
                                        ? theme === 'dark' ? 'text-white' : 'text-gray-900' 
                                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {n.title}
                                    </p>
                                    <p className={`text-xs line-clamp-2 mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{n.message}</p>
                                    <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">{n.time}</p>
                                  </div>
                                  {!n.read && (
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className={`p-3 border-t text-center ${
                          theme === 'dark' ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-black/5'
                        }`}>
                          <button className="text-xs font-bold text-gray-500 hover:text-indigo-500">View All Activity</button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center space-x-3 hover:bg-black/5 dark:hover:bg-white/5 p-1.5 rounded-2xl transition-all group"
            >
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{userName}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{role}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${user.avatarColor || 'bg-indigo-100 dark:bg-indigo-900/30'} flex items-center justify-center ${user.avatarColor ? 'text-white' : 'text-indigo-600'} font-bold shadow-sm transition-transform group-hover:scale-105 overflow-hidden`}>
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : user.avatarIcon && user.avatarIcon !== 'default' ? (
                  (() => {
                    const Icon = AVATAR_ICONS.find(i => i.id === user.avatarIcon)?.icon;
                    return Icon ? <Icon className="w-5 h-5" /> : userName.charAt(0);
                  })()
                ) : (
                  userName.charAt(0)
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 overflow-y-auto flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => onClearAll?.()}
        title="Clear All Notifications?"
        message="This will permanently remove all notifications from your history. This action cannot be undone."
        confirmText="Clear All"
      />
    </div>
  );
}
