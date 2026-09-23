'use client';

import React, { useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = Number(password.length > 7)
    + Number(/[A-Z]/.test(password) && /[0-9]/.test(password))
    + Number(/[^A-Za-z0-9]/.test(password));

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-200';
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const { error: updateError } = await updatePassword(password);

    setIsLoading(false);

    if (updateError) {
      setError(updateError);
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">
        
        {!isSuccess ? (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-tight">Create new password.</h1>
              <p className="text-gray-500 text-sm font-medium">Please enter a strong password for your account.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span>{error}</span>
                  {error.includes('expired') && (
                    <Link href="/forgot-password" className="block mt-2 font-bold hover:underline">Request new link</Link>
                  )}
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="password">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 pr-10 transition-all duration-300 outline-none placeholder-gray-400" 
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:text-brand-blue"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Strength Indicator */}
                <div className="mt-3 flex gap-1 h-1.5 w-full">
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${password.length > 0 ? getStrengthColor() : 'bg-gray-100'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${strength >= 2 ? getStrengthColor() : 'bg-gray-100'}`}></div>
                  <div className={`flex-1 rounded-full transition-colors duration-300 ${strength === 3 ? getStrengthColor() : 'bg-gray-100'}`}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Must be at least 8 characters, include a number and a symbol.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="confirm">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirm"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all duration-300 outline-none placeholder-gray-400" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={strength < 2 || password !== confirmPassword || isLoading || !!error}
                className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none mt-2 h-[52px]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Password Updated</h2>
            <p className="text-gray-500 text-sm font-medium mb-8">
              Your password has been successfully reset.
            </p>
            <Link href="/login" className="w-full inline-block text-white bg-gray-900 hover:bg-brand-blue focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-sm px-5 py-4 text-center transition-all shadow-apple outline-none">
              Continue to Login
            </Link>
          </div>
        )}

      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
