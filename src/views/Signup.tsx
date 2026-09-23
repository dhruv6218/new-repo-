'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '../layouts/AuthLayout';
import { Loader2, AlertCircle, Sparkles, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const { signUp, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (googleError) setError(googleError);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      setError('Please agree to the Terms and Privacy Policy.');
      return;
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const { error: signUpError, needsConfirmation } = await signUp(email, 'password', name, password);

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError);
    } else if (needsConfirmation) {
      setSent(true);
    } else {
      router.push('/onboarding/step-1');
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">

        {sent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Check your inbox!</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">
              We sent a magic link to <strong className="text-gray-900">{email}</strong>.<br />
              Click the link in your email to activate your account and log in.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => setSent(false)} 
                className="text-xs text-gray-500 font-bold hover:underline"
              >
                ← Use a different email
              </button>
            </div>
          </div>
        ) : (
          <>
            {isDemo && !error && (
              <div className="mb-8 p-4 bg-blue-50 border border-brand-blue/20 rounded-xl flex items-start gap-3 text-sm text-brand-blue font-medium animate-[fadeIn_0.3s_ease-out]">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-1 text-gray-900">Welcome to your interactive demo!</strong>
                  The Free plan gives you 3 successful recoveries. Create an account to get started.
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-tight">Create your account.</h1>
              <p className="text-gray-500 text-sm font-medium">First 3 recoveries are free. No credit card required.</p>
            </div>

            <button
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isLoading}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 hover:border-brand-blue transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/20 mb-6 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Sign up with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] bg-gray-200 flex-1"></div>
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest font-bold">or email registration</span>
              <div className="h-[1px] bg-gray-200 flex-1"></div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all duration-300 outline-none placeholder-gray-400"
                  placeholder="Jane Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all duration-300 outline-none placeholder-gray-400"
                  placeholder="jane@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 pr-11 transition-all duration-300 outline-none placeholder-gray-400"
                    placeholder="Create a strong password (min 6 chars)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start pt-2">
                <div className="flex items-center h-5">
                  <input 
                    id="terms" 
                    type="checkbox" 
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-brand-blue accent-brand-blue cursor-pointer transition-all" 
                    required 
                  />
                </div>
                <label htmlFor="terms" className="ml-2 text-xs font-medium text-gray-500">
                  I agree to the <Link href="/terms" className="text-brand-blue hover:underline font-bold">Terms</Link> and <Link href="/privacy" className="text-brand-blue hover:underline font-bold">Privacy Policy</Link>.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none mt-4 h-[52px]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account ✨'}
              </button>
            </form>
          </>
        )}

        <p className="text-sm text-gray-500 font-medium text-center mt-6">
          Already have an account? <Link href="/login" className="text-brand-blue font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-sm">Sign in →</Link>
        </p>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center items-center gap-2 text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">
          <span>Privacy-first</span>
          <span>•</span>
          <span>No credit card required</span>
        </div>
      </div>
    </AuthLayout>
  );
}

export const Signup = () => (
  <Suspense fallback={
    <AuthLayout>
      <div className="bg-white p-12 rounded-3xl shadow-apple border border-gray-200 w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    </AuthLayout>
  }>
    <SignupForm />
  </Suspense>
);

export default Signup;
