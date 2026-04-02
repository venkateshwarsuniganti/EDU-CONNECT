import { UserRole } from './types';
import { Sparkles, Shield, GraduationCap, Briefcase, Palette } from 'lucide-react';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  student: ['dashboard', 'schedule', 'attendance', 'courses', 'advisor', 'profile'],
  faculty: ['dashboard', 'students', 'planner', 'tracker', 'analytics', 'profile'],
  admin: ['dashboard', 'users', 'courses', 'analytics', 'profile'],
};

export const DEFAULT_TAB = 'dashboard';

export const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 
  'bg-violet-600', 'bg-sky-600', 'bg-fuchsia-600', 'bg-orange-600'
];

export const AVATAR_ICONS = [
  { id: 'default', icon: null },
  { id: 'sparkles', icon: Sparkles },
  { id: 'shield', icon: Shield },
  { id: 'grad', icon: GraduationCap },
  { id: 'briefcase', icon: Briefcase },
  { id: 'palette', icon: Palette },
];
