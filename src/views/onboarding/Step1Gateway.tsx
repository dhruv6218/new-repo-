'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '../../layouts/OnboardingLayout';
import { AlertCircle, CreditCard, Zap, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../lib/api';
import { GatewayType } from '../../types';

interface GatewayOption {
  type: GatewayType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  hint: string;
}

const GATEWAYS: GatewayOption[] = [
  { type: 'stripe', label: 'Stripe', icon: CreditCard, placeholder: 'sk_live_... or sk_test_...', hint: 'API key from Stripe Dashboard -> Developers -> API Keys' },
  { type: 'razorpay', label: 'Razorpay', icon: Zap, placeholder: 'rzp_live_... or rzp_test_...', hint: 'API key from Razorpay Dashboard -> Settings -> API Keys' },
  { type: 'upi', label: 'UPI / Static Link', icon: LinkIcon, placeholder: 'https://pay.example.com/you or upi://pay?pa=...', hint: 'Paste any payment link, UPI deeplink, or hosted checkout URL' },
];

export const Step1Gateway = () => {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const [selectedGateway, setSelectedGateway] = useState<GatewayType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const selected = GATEWAYS.find(g => g.type === selectedGateway);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !selectedGateway || !apiKey.trim()) return;
    setIsLoading(true); setError(null);
    try {
      await api.gateways.create({
        workspace_id: activeWorkspace.id,
        type: selectedGateway,
        label: selected?.label || selectedGateway,
        api_key: selectedGateway !== 'upi' ? apiKey.trim() : undefined,
        static_url: selectedGateway === 'upi' ? apiKey.trim() : undefined,
        is_active: true,
      });
      setConnected(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect gateway');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => router.push('/onboarding/step-2');
  const handleSkip = () => router.push('/onboarding/step-2');

  return (
    <OnboardingLayout step={1} totalSteps={3} showSkip onSkip={handleSkip}>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Connect Your Payment Gateway
        </h1>
        <p className="text-gray-500 text-base font-medium max-w-lg mx-auto">
          Astrix embeds a 1-click checkout link in every reminder. Connect where your clients pay you.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {connected ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-apple text-center animate-[fadeIn_0.3s_ease-out]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">{selected?.label} Connected!</h3>
          <p className="text-gray-500 font-medium mb-8">
            Great! Astrix will now embed a live payment link from {selected?.label} in every reminder email.
          </p>
          <button onClick={handleContinue}
            className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-glow-blue text-base">
            Continue to Tone Setup &rarr;
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Gateway Selection */}
          <div className="grid grid-cols-3 gap-3">
            {GATEWAYS.map(gw => (
              <button key={gw.type} onClick={() => { setSelectedGateway(gw.type); setApiKey(''); setError(null); }}
                className={`p-4 rounded-2xl border-2 transition-all text-center relative ${selectedGateway === gw.type ? 'border-brand-blue bg-blue-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                {selectedGateway === gw.type && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-brand-blue" />}
                <gw.icon className={`w-6 h-6 mx-auto mb-2 ${selectedGateway === gw.type ? 'text-brand-blue' : 'text-gray-500'}`} />
                <div className={`text-sm font-bold ${selectedGateway === gw.type ? 'text-brand-blue' : 'text-gray-700'}`}>{gw.label}</div>
              </button>
            ))}
          </div>

          {/* API Key Input */}
          {selectedGateway && selected && (
            <form onSubmit={handleConnect} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-apple animate-[fadeIn_0.25s_ease-out]">
              <label className="block text-sm font-bold text-gray-900 mb-1">
                {selectedGateway === 'upi' ? 'Payment Link / UPI URL' : `${selected.label} API Key`}
              </label>
              <p className="text-xs text-gray-500 mb-3">{selected.hint}</p>
              <input type={selectedGateway === 'upi' ? 'url' : 'text'} required value={apiKey} onChange={e => setApiKey(e.target.value)}
                placeholder={selected.placeholder}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue font-mono transition-all mb-4" />
              <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-800 font-medium">Demo mode: Keys are stored locally and never sent to a server.</p>
              </div>
              <button type="submit" disabled={isLoading || !apiKey.trim()}
                className="w-full bg-brand-blue text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {isLoading ? 'Connecting...' : `Connect ${selected.label}`}
              </button>
            </form>
          )}

          <div className="text-center">
            <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors">
              Skip for now &mdash; I&apos;ll connect later in Settings
            </button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
};

export default Step1Gateway;
