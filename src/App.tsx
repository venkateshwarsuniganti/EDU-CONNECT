import React, { useState, useEffect } from 'react';
import { User, UserRole, Notification } from './types';
import { api } from './services/api';
import AuthScreen from './components/AuthScreen';
import DashboardLayout from './components/DashboardLayout';
import StudentDashboard from './components/StudentDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import Toast, { ToastType } from './components/Toast';
import { ROLE_PERMISSIONS, DEFAULT_TAB } from './constants';
import { AnimatePresence } from 'motion/react';

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Welcome!', message: 'Welcome to the new EduConnect portal.', time: '2 mins ago', type: 'info', read: false },
  { id: '2', title: 'Attendance Alert', message: 'Your attendance for Mathematics is below 75%.', time: '1 hour ago', type: 'warning', read: false, targetRole: 'student' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    if (currentUser) {
      api.notifications.get(currentUser.role).then(setNotifications);
    }
  }, [currentUser]);

  // Enforce RBAC
  useEffect(() => {
    if (currentUser) {
      const allowedTabs = ROLE_PERMISSIONS[currentUser.role];
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab(DEFAULT_TAB);
      }
    }
  }, [currentUser, activeTab]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    setActiveTab('dashboard');
    showToast(`Welcome back, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    setActiveTab('dashboard');
    showToast('Logged out successfully', 'info');
  };

  const addNotification = async (notif: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    targetRole?: UserRole;
  }) => {
    try {
      await api.notifications.send(notif);
      const updatedNotifs = await api.notifications.get(currentUser?.role || '');
      setNotifications(updatedNotifs);
    } catch (error) {
      console.error('Failed to send notification', error);
    }
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await api.users.updateProfile(updatedUser);
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update profile', error);
      showToast('Failed to update profile', 'error');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = async () => {
    try {
      await api.notifications.clearAll(currentUser?.role || '');
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    if (currentUser) {
      const updatedUser = { ...currentUser, theme };
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const filteredNotifications = notifications.filter(n => !n.targetRole || n.targetRole === currentUser.role);

  return (
    <>
      <DashboardLayout 
        user={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={filteredNotifications}
        onMarkRead={markAsRead}
        onClearAll={clearNotifications}
        onThemeChange={handleThemeChange}
      >
        {currentUser.role === 'student' && activeTab !== 'profile' && (
          <StudentDashboard user={currentUser} activeTab={activeTab} onShowToast={showToast} />
        )}
        {currentUser.role === 'faculty' && activeTab !== 'profile' && (
          <FacultyDashboard user={currentUser} activeTab={activeTab} onShowToast={showToast} />
        )}
        {currentUser.role === 'admin' && activeTab !== 'profile' && (
          <AdminDashboard user={currentUser} activeTab={activeTab} onSendNotification={addNotification} onShowToast={showToast} />
        )}
        {activeTab === 'profile' && (
          <UserProfile user={currentUser} onUpdate={handleUpdateUser} />
        )}
      </DashboardLayout>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

