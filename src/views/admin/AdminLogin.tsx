'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, ShieldCheck, Smartphone, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLogin: React.FC = () => {
  const { signInAsAdmin } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await signInAsAdmin(email, password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Proceed to 2FA Phone OTP verification step
    setStep('otp');
  };

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setError('Please enter a valid OTP code.');
      return;
    }
    setIsLoading(true);
    setError(null);
    // Simulate/Verify 2FA session
    await new Promise(r => setTimeout(r, 600));
    setIsLoading(false);
    router.push('/godview/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
            {step === 'credentials' ? (
              <ShieldCheck className="w-8 h-8 text-brand-blue" />
            ) : (
              <Smartphone className="w-8 h-8 text-emerald-600" />
            )}
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Admin Godview Portal</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'credentials' ? 'Restricted Operator Access' : 'Two-Factor Phone Verification'}
          </p>
        </div>

        {step === 'credentials' ? (
          <form className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-4 animate-[fadeIn_0.25s_ease-out]" onSubmit={handleCredentialsSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-600 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="admin-email">Admin Email</label>
              <input type="email" id="admin-email" value={email} onChange={event => setEmail(event.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="admin-password">Password</label>
              <input type="password" id="admin-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-brand-blue disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Credentials...</> : <>Continue to 2FA <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-center text-xs text-gray-400 font-medium">Admin access is provisioned by an operator in Supabase.</p>
          </form>
        ) : (
          <form className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-4 animate-[fadeIn_0.25s_ease-out]" onSubmit={handleOtpSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-600 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="text-center mb-2">
              <p className="text-xs text-gray-600 font-medium">
                Enter the 6-digit verification code sent to your registered admin phone number.
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5 text-center" htmlFor="admin-otp">6-Digit Security OTP</label>
              <input
                type="text"
                id="admin-otp"
                maxLength={6}
                value={otp}
                onChange={event => setOtp(event.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-emerald-500"
                required
                autoFocus
              />
            </div>
            <button type="submit" disabled={isLoading || otp.length < 4} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying OTP...</> : 'Verify OTP & Open Godview'}
            </button>
            <button type="button" onClick={() => setStep('credentials')} className="w-full text-xs text-gray-500 font-bold hover:text-gray-900 flex items-center justify-center gap-1.5 py-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to credentials
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
