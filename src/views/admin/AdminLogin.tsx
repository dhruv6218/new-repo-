'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, ShieldCheck, Smartphone, ArrowRight, ArrowLeft, QrCode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

export const AdminLogin: React.FC = () => {
  const { signInAsAdmin } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMfa, setHasMfa] = useState(true); // assume MFA until we know otherwise

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Step 1: sign in + verify admin role
    const result = await signInAsAdmin(email, password);
    if (result.error) {
      setIsLoading(false);
      setError(result.error);
      return;
    }

    // Step 2: check MFA assurance level
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      // If already at AAL2 (MFA verified this session), go directly to dashboard
      if (assurance?.currentLevel === 'aal2') {
        router.push('/godview/dashboard');
        return;
      }

      // List enrolled TOTP factors
      const { data: listData } = await supabase.auth.mfa.listFactors();
      const enrolledTotp = listData?.totp?.[0];

      if (!enrolledTotp) {
        // No TOTP factor enrolled — show warning step
        setHasMfa(false);
        setIsLoading(false);
        setStep('mfa');
        return;
      }

      // Challenge the enrolled TOTP factor
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrolledTotp.id });
      if (challengeError || !challenge) {
        setError('Could not initiate MFA challenge. Please try again.');
        setIsLoading(false);
        return;
      }
      setFactorId(enrolledTotp.id);
      setChallengeId(challenge.id);
      setHasMfa(true);
      setStep('mfa');
    } catch {
      setError('Could not check MFA status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasMfa) {
      // No MFA enrolled — redirect with warning (admin should enroll TOTP ASAP)
      router.push('/godview/dashboard');
      return;
    }
    if (!totpCode.trim() || totpCode.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    if (!factorId || !challengeId) {
      setError('MFA session expired. Please sign in again.');
      setStep('credentials');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: totpCode.trim(),
      });
      if (verifyError) {
        setError('Invalid code. Check your authenticator app and try again.');
        setTotpCode('');
        return;
      }
      router.push('/godview/dashboard');
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            {step === 'credentials' ? 'Restricted Operator Access' : 'Two-Factor Authentication'}
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
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <>Continue to 2FA <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-center text-xs text-gray-400 font-medium">Admin access is provisioned via <code>admin_members</code> table in Supabase.</p>
          </form>
        ) : (
          <form className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-4 animate-[fadeIn_0.25s_ease-out]" onSubmit={handleMfaSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-600 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {!hasMfa ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <QrCode className="w-4 h-4" />
                  No Authenticator Enrolled
                </div>
                <p>Your admin account does not have TOTP 2FA set up. Enroll an authenticator app in Supabase Dashboard → Authentication → Users → MFA to secure this account.</p>
                <p className="text-xs font-bold text-amber-700">⚠️ Proceeding without MFA. Set this up immediately after login.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-2">
                  <p className="text-xs text-gray-600 font-medium">
                    Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5 text-center" htmlFor="admin-totp">6-Digit TOTP Code</label>
                  <input
                    type="text"
                    id="admin-totp"
                    maxLength={6}
                    value={totpCode}
                    onChange={event => setTotpCode(event.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={isLoading || (hasMfa && totpCode.length !== 6)}
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : hasMfa ? 'Verify & Open Godview' : 'Proceed to Godview'}
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
