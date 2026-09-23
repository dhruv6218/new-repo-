'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLogin: React.FC = () => {
  const { signInAsAdmin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await signInAsAdmin(email, password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push('/godview/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-brand-blue" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Restricted management access</p>
        </div>
        <form className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-4" onSubmit={handleSubmit}>
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
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</> : 'Access Admin Panel'}
          </button>
          <p className="text-center text-xs text-gray-400 font-medium">Admin access is provisioned by an operator in Supabase.</p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
