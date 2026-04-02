import React, { useState } from 'react';
import { User, Mail, Shield, Hash, Briefcase, GraduationCap, Calendar, MapPin, Phone, Camera, Check, X, Palette, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';
import { AVATAR_COLORS, AVATAR_ICONS } from '../constants';

interface UserProfileProps {
  user: UserType;
  onUpdate?: (updatedUser: UserType) => void;
}

export default function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserType>({ ...user });
  const [selectedColor, setSelectedColor] = useState(user.avatarColor || AVATAR_COLORS[0]);
  const [selectedIconId, setSelectedIconId] = useState(user.avatarIcon || 'default');

  const getRoleIcon = () => {
    switch (user.role) {
      case 'admin': return <Shield className="w-6 h-6 text-indigo-600" />;
      case 'faculty': return <Briefcase className="w-6 h-6 text-indigo-600" />;
      default: return <GraduationCap className="w-6 h-6 text-indigo-600" />;
    }
  };

  const handleSave = () => {
    const finalUser = {
      ...editedUser,
      avatarColor: selectedColor,
      avatarIcon: selectedIconId
    };
    if (onUpdate) {
      onUpdate(finalUser);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedUser({ ...editedUser, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const SelectedIcon = AVATAR_ICONS.find(i => i.id === selectedIconId)?.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl shadow-black/5 border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
          {isEditing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <label className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors cursor-pointer">
                <Camera className="w-6 h-6" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          )}
        </div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="relative group">
              <div className={`w-24 h-24 rounded-3xl ${isEditing ? selectedColor : (user.avatarColor || 'bg-white dark:bg-gray-700')} p-1 shadow-lg transition-all duration-500 overflow-hidden`}>
                <div className={`w-full h-full rounded-2xl ${isEditing || user.avatarColor || user.profileImage ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/30'} flex items-center justify-center text-3xl font-black ${isEditing || user.avatarColor || user.profileImage ? 'text-white' : 'text-indigo-600'}`}>
                  {isEditing ? (
                    editedUser.profileImage ? (
                      <img src={editedUser.profileImage} alt="Profile" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                    ) : SelectedIcon ? <SelectedIcon className="w-12 h-12 animate-pulse" /> : editedUser.name.charAt(0)
                  ) : (
                    user.profileImage ? (
                      <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                    ) : user.avatarIcon && user.avatarIcon !== 'default' ? (
                      (() => {
                        const Icon = AVATAR_ICONS.find(i => i.id === user.avatarIcon)?.icon;
                        return Icon ? <Icon className="w-12 h-12" /> : user.name.charAt(0);
                      })()
                    ) : (
                      user.name.charAt(0)
                    )
                  )}
                </div>
              </div>
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-gray-800 cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
            
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="text"
                      value={editedUser.phoneNumber || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Campus Location</label>
                    <input 
                      type="text"
                      value={editedUser.location || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
                      placeholder="Main Campus, Block A"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Joined Date</label>
                    <input 
                      type="text"
                      value={editedUser.joinedDate || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, joinedDate: e.target.value })}
                      placeholder="Sept 2023"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      value={editedUser.status || 'Active'}
                      onChange={(e) => setEditedUser({ ...editedUser, status: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Graduated">Graduated</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Customize Avatar</h3>
                  <div className="flex flex-wrap gap-3">
                    {AVATAR_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          setEditedUser({ ...editedUser, profileImage: undefined });
                        }}
                        className={`w-10 h-10 rounded-xl ${color} transition-all ${selectedColor === color && !editedUser.profileImage ? 'ring-4 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800 scale-110' : 'hover:scale-105'}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {AVATAR_ICONS.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedIconId(item.id);
                          setEditedUser({ ...editedUser, profileImage: undefined });
                        }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selectedIconId === item.id && !editedUser.profileImage ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        {item.icon ? <item.icon className="w-6 h-6" /> : <span className="text-xs font-bold">None</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1"
              >
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{user.name}</h2>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  {getRoleIcon()}
                  <span className="font-bold uppercase tracking-widest text-xs">{user.role}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Account Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                    <p className="font-bold text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {user.role === 'student' ? 'Roll Number' : 'Employee ID'}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {user.role === 'student' ? user.rollNumber : user.employeeId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Personal Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                    <p className="font-bold text-gray-900 dark:text-white">{user.phoneNumber || '+1 (555) 000-0000'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-indigo-600 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campus Location</p>
                    <p className="font-bold text-gray-900 dark:text-white">{user.location || 'Main Campus, Block A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h4 className="font-black text-gray-900 dark:text-white">Joined</h4>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{user.joinedDate || 'Sept 2023'}</p>
          <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">Member Since</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-gray-900 dark:text-white">Security</h4>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">Verified</p>
          <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">2FA Active</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h4 className="font-black text-gray-900 dark:text-white">Status</h4>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{user.status || 'Active'}</p>
          <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">Account Status</p>
        </div>
      </div>
    </div>
  );
}
