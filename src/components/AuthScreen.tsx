import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  GraduationCap, 
  Briefcase, 
  ArrowRight, 
  Fingerprint, 
  Hash, 
  ShieldCheck,
  Github,
  Chrome,
  Check,
  X,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserRole, User } from '../types';
import { api } from '../services/api';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

type AuthStep = 'initial' | 'security' | 'verification';

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>('initial');
  const [role, setRole] = useState<UserRole>('student');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState(''); // Roll Number or Employee ID
  const [pin, setPin] = useState('');
  const [biometric, setBiometric] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = useMemo(() => {
    if (!password) return null;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    const length = password.length >= 8;
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasNonalphas, length].filter(Boolean).length;
    
    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (strength <= 4) return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  }, [password]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return true;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isLogin) {
      setStep('verification');
    } else {
      if (step === 'initial') {
        if (!passwordsMatch) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          return;
        }
        if (pin.length !== 6) {
          setError('Security PIN must be exactly 6 digits');
          return;
        }
        if (biometric.length !== 6) {
          setError('Biometric ID must be exactly 6 digits');
          return;
        }
        setStep('verification');
      }
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const user = await api.auth.login(email, password);
        onLogin(user);
      } else {
        const user = await api.auth.signup({
          email,
          password,
          role,
          name,
          rollNumber: role === 'student' ? idNumber : undefined,
          employeeId: role === 'faculty' ? idNumber : undefined
        });
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setStep('initial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    console.log(`Logging in with ${provider}`);
    const mockEmail = `${provider.toLowerCase()}.${role}@educonnect.com`;
    onLogin({
      id: 'social-' + Math.random().toString(36).substr(2, 9),
      email: mockEmail,
      role: role,
      name: provider + ' User',
      pin: '0000',
      biometricId: 'social'
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-black/5 border border-black/5 overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-indigo-600 italic">EduConnect</h1>
            <p className="text-gray-500 mt-2">
              {isLogin ? 'Welcome back!' : 'Join our academic community'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {/* Role Selection */}
          {step === 'initial' && (
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
              <button
                onClick={() => setRole('student')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
                  role === 'student' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-gray-500'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                <span>Student</span>
              </button>
              <button
                onClick={() => setRole('faculty')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
                  role === 'faculty' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-gray-500'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span>Faculty</span>
              </button>
              <button
                onClick={() => setRole('admin')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
                  role === 'admin' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-gray-500'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </button>
            </div>
          )}

          <form onSubmit={step === 'verification' ? handleFinalSubmit : handleNextStep} className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 'initial' && (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder={role === 'student' ? "Roll Number" : "Employee ID"}
                          required
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    {!isLogin && password && (
                      <div className="px-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold uppercase text-gray-400">Strength: {passwordStrength?.label}</span>
                        </div>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${passwordStrength?.color} ${passwordStrength?.width}`}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isLogin && (
                    <>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          placeholder="Re-enter Password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl focus:ring-2 outline-none transition-all ${
                            !passwordsMatch ? 'border-red-500 focus:ring-red-500' : 'border-black/5 focus:ring-indigo-500'
                          }`}
                        />
                        {!passwordsMatch && (
                          <p className="text-[10px] text-red-500 font-bold mt-1 ml-2 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" /> Passwords do not match
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Security PIN</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="password"
                              maxLength={6}
                              placeholder="••••••"
                              required
                              value={pin}
                              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                              className="w-full pl-10 pr-2 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-lg tracking-widest font-bold"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Biometric ID</label>
                          <div className="relative">
                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="000000"
                              required
                              value={biometric}
                              onChange={(e) => setBiometric(e.target.value.replace(/\D/g, ''))}
                              className="w-full pl-10 pr-2 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-lg tracking-widest font-bold text-indigo-600"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {isLogin && (
                    <div className="flex justify-end">
                      <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">Forgot Password?</button>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'verification' && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 text-center"
                >
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Two-Step Verification</h3>
                    <p className="text-sm text-gray-500 mt-2">We've sent a 6-digit code to your email. Please enter it below to verify your identity.</p>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="0 0 0 0 0 0"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-3xl tracking-[1em] font-black py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">Resend Code</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex space-x-3">
              {step !== 'initial' && (
                <button
                  type="button"
                  onClick={() => setStep(step === 'verification' ? (isLogin ? 'initial' : 'security') : 'initial')}
                  className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={(!isLogin && step === 'initial' && !passwordsMatch) || isLoading}
                className={`flex-1 py-4 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg group ${
                  (!isLogin && step === 'initial' && !passwordsMatch) || isLoading
                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{step === 'verification' ? 'Verify & Complete' : 'Continue'}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {step === 'initial' && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center space-x-2 py-3 border border-black/5 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
                >
                  <Chrome className="w-5 h-5 text-red-500" />
                  <span>Google</span>
                </button>
                <button 
                  onClick={() => handleSocialLogin('GitHub')}
                  className="flex items-center justify-center space-x-2 py-3 border border-black/5 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
                >
                  <Github className="w-5 h-5" />
                  <span>GitHub</span>
                </button>
              </div>
            </>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setStep('initial');
              }}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

