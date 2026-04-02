export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  rollNumber?: string; // For students
  employeeId?: string; // For faculty
  pin: string;
  biometricId: string;
  password?: string; // Added for creation
  theme?: 'light' | 'dark';
  avatarColor?: string;
  avatarIcon?: string;
  phoneNumber?: string;
  location?: string;
  joinedDate?: string;
  status?: string;
  profileImage?: string;
}

export interface Todo {
  id: string;
  userId: string;
  task: string;
  completed: boolean;
  createdAt: number;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  courseCode?: string;
  time: string;
  room: string;
  instructor?: string;
  facultyId?: string; // Added for filtering
  isMarked?: boolean; // Local state to track if marked in current session
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  date: string;
  time: string;
  timestamp: number;
  status: 'present' | 'absent' | 'late';
  subject: string;
  classId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  targetRole?: UserRole;
}
