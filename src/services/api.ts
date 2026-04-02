import { User, AttendanceRecord, ClassSchedule, Notification, Todo } from '../types';

const API_BASE = '/api';

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      return res.json();
    },
    signup: async (data: any): Promise<User> => {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Signup failed');
      return res.json();
    }
  },
  attendance: {
    get: async (studentId: string): Promise<AttendanceRecord[]> => {
      const res = await fetch(`${API_BASE}/attendance?studentId=${studentId}`);
      return res.json();
    },
    mark: async (record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error('Failed to mark attendance');
      return res.json();
    },
    update: async (id: string, status: string): Promise<AttendanceRecord> => {
      const res = await fetch(`${API_BASE}/attendance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update attendance');
      return res.json();
    }
  },
  schedule: {
    get: async (): Promise<ClassSchedule[]> => {
      const res = await fetch(`${API_BASE}/schedule`);
      return res.json();
    },
    add: async (data: { subject: string, courseCode?: string, time: string, room: string, instructor: string, facultyId: string }): Promise<void> => {
      const res = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add schedule');
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/schedule/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete schedule');
    }
  },
  notifications: {
    get: async (role: string): Promise<Notification[]> => {
      const res = await fetch(`${API_BASE}/notifications?role=${role}`);
      return res.json();
    },
    send: async (data: any): Promise<void> => {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to send notification');
    },
    clearAll: async (role: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/notifications/clear?role=${role}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to clear notifications');
    }
  },
  users: {
    getAll: async (): Promise<User[]> => {
      const res = await fetch(`${API_BASE}/users`);
      return res.json();
    },
    add: async (user: Partial<User>): Promise<User> => {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Failed to add user');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete user');
    },
    updateTheme: async (userId: string, theme: 'light' | 'dark'): Promise<void> => {
      const res = await fetch(`${API_BASE}/users/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, theme }),
      });
      if (!res.ok) throw new Error('Failed to update theme');
    },
    updateProfile: async (user: User): Promise<void> => {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Failed to update profile');
    }
  },
  todos: {
    get: async (userId: string): Promise<Todo[]> => {
      const res = await fetch(`${API_BASE}/todos?userId=${userId}`);
      return res.json();
    },
    add: async (userId: string, task: string): Promise<Todo> => {
      const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, task }),
      });
      if (!res.ok) throw new Error('Failed to add todo');
      return res.json();
    },
    update: async (id: string, completed: boolean): Promise<void> => {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete todo');
    }
  },
  advisors: {
    get: async (studentId: string): Promise<User | null> => {
      const res = await fetch(`${API_BASE}/advisors?studentId=${studentId}`);
      return res.json();
    }
  }
};
