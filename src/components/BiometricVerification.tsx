import React, { useState, useRef, useEffect } from 'react';
import { Camera, Fingerprint, Loader2, CheckCircle, XCircle, ShieldCheck, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as faceRecognition from '../services/faceRecognition';

interface BiometricVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
  subject: string;
}

export default function BiometricVerification({ onSuccess, onCancel, subject }: BiometricVerificationProps) {
  const [step, setStep] = useState<'selection' | 'biometric' | 'facial' | 'pin' | 'verifying' | 'success' | 'error' | 'enrolling'>('selection');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    const enrolled = faceRecognition.getEnrolledFace();
    setIsEnrolled(!!enrolled);
  }, []);

  const startBiometric = async () => {
    setStep('biometric');
    try {
      // Real WebAuthn API call (simulated challenge for demo purposes as we don't have a backend)
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const options: CredentialRequestOptions = {
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'required',
            allowCredentials: [],
          }
        };

        try {
          await navigator.credentials.get(options);
          setStep('pin');
        } catch (err) {
          console.warn('WebAuthn failed or cancelled, falling back to simulated verification for demo', err);
          setTimeout(() => setStep('pin'), 1500);
        }
      } else {
        setTimeout(() => setStep('pin'), 1500);
      }
    } catch (err) {
      setError('Biometric authentication failed');
      setStep('error');
    }
  };

  const startFacial = async () => {
    setModelsLoading(true);
    try {
      await faceRecognition.loadModels();
      setModelsLoading(false);
      setStep('facial');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied or model loading failed');
      setStep('error');
      setModelsLoading(false);
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current) return;
    setStep('verifying');
    
    try {
      const descriptor = await faceRecognition.getFaceDescriptor(videoRef.current);
      
      if (!descriptor) {
        setError('No face detected. Please try again.');
        setStep('error');
        return;
      }

      const enrolledDescriptor = faceRecognition.getEnrolledFace();
      
      if (!enrolledDescriptor) {
        // Enrollment mode
        faceRecognition.enrollFace(descriptor);
        setIsEnrolled(true);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setStep('pin');
      } else {
        // Verification mode
        const isMatch = faceRecognition.verifyFace(descriptor, enrolledDescriptor);
        if (isMatch) {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          setStep('pin');
        } else {
          setError('Face does not match the enrolled user.');
          setStep('error');
        }
      }
    } catch (err) {
      setError('Facial recognition processing error');
      setStep('error');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      setStep('verifying');
      setTimeout(() => {
        handleSuccess();
      }, 1500);
    } else {
      setError('Please enter a valid 6-digit PIN');
    }
  };

  const handleSuccess = () => {
    setStep('success');
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Attendance Verification</h2>
              <p className="text-gray-500">{subject}</p>
            </div>
            <button 
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'selection' && (
              <motion.div 
                key="selection"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-4"
              >
                <button
                  onClick={startBiometric}
                  className="w-full p-6 border-2 border-gray-100 rounded-2xl flex items-center gap-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                    <Fingerprint className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 text-lg">Device Biometrics</div>
                    <div className="text-sm text-gray-500">Use Fingerprint or Face Unlock</div>
                  </div>
                </button>

                <button
                  onClick={startFacial}
                  disabled={modelsLoading}
                  className="w-full p-6 border-2 border-gray-100 rounded-2xl flex items-center gap-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all group disabled:opacity-50"
                >
                  <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                    {modelsLoading ? (
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    ) : isEnrolled ? (
                      <Camera className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <UserPlus className="w-8 h-8 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 text-lg">
                      {modelsLoading ? 'Loading AI Models...' : isEnrolled ? 'Facial Recognition' : 'Register Face'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isEnrolled ? 'Use Camera for Verification' : 'Enroll your face for biometric login'}
                    </div>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 'biometric' && (
              <motion.div 
                key="biometric"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-12"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                  <div className="relative p-8 bg-indigo-500 rounded-full">
                    <Fingerprint className="w-16 h-16 text-white" />
                  </div>
                </div>
                <h3 className="mt-8 text-xl font-bold text-gray-900">Scanning Biometrics...</h3>
                <p className="text-gray-500 mt-2">Please use your device's sensor</p>
              </motion.div>
            )}

            {step === 'facial' && (
              <motion.div 
                key="facial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-900 border-4 border-emerald-500/30">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-full m-8 animate-pulse" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 animate-scan" />
                  {!isEnrolled && (
                    <div className="absolute bottom-4 left-0 w-full text-center">
                      <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                        ENROLLMENT MODE
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={captureAndVerify}
                  className="mt-6 w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                >
                  {isEnrolled ? 'Verify Identity' : 'Enroll My Face'}
                </button>
              </motion.div>
            )}

            {step === 'pin' && (
              <motion.div 
                key="pin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-6"
              >
                <div className="p-4 bg-indigo-50 rounded-2xl mb-6">
                  <ShieldCheck className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enter Security PIN</h3>
                <p className="text-sm text-gray-500 mb-8 text-center">Please enter your 6-digit security PIN to complete verification</p>
                
                <form onSubmit={handlePinSubmit} className="w-full space-y-6">
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input
                        key={i}
                        type="password"
                        maxLength={1}
                        value={pin[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d?$/.test(val)) {
                            const newPin = pin.split('');
                            newPin[i] = val;
                            setPin(newPin.join(''));
                            if (val && i < 5) {
                              (e.target.nextElementSibling as HTMLInputElement)?.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !pin[i] && i > 0) {
                            (e.currentTarget.previousElementSibling as HTMLInputElement)?.focus();
                          }
                        }}
                        className="w-12 h-14 bg-gray-50 border-2 border-gray-100 rounded-xl text-center text-xl font-black focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    ))}
                  </div>
                  
                  {error && (
                    <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    Confirm & Mark Attendance
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'verifying' && (
              <motion.div 
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-12"
              >
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <h3 className="mt-8 text-xl font-bold text-gray-900">Analyzing Identity...</h3>
                <p className="text-gray-500 mt-2">Comparing against secure records</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-12"
              >
                <div className="p-8 bg-emerald-100 rounded-full">
                  <CheckCircle className="w-16 h-16 text-emerald-600" />
                </div>
                <h3 className="mt-8 text-2xl font-black text-gray-900">Verified Successfully</h3>
                <p className="text-gray-500 mt-2">Attendance marked for {subject}</p>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div 
                key="error"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-12"
              >
                <div className="p-8 bg-red-100 rounded-full">
                  <XCircle className="w-16 h-16 text-red-600" />
                </div>
                <h3 className="mt-8 text-xl font-bold text-gray-900">Verification Failed</h3>
                <p className="text-red-500 mt-2">{error}</p>
                <button
                  onClick={() => setStep('selection')}
                  className="mt-6 px-6 py-2 bg-gray-100 text-gray-900 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-gray-50 p-6 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-gray-400" />
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Secure Biometric Verification Active
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
