'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../lib/api';
import { GatewaySettings } from '../../types';
import { CheckCircle2, Plus, ShieldCheck, Zap, Link as LinkIcon, Key, X, Eye, EyeOff, Loader2 } from 'lucide-react';

type Provider = 'stripe' | 'razorpay' | 'dodo';

interface KeyModalProps {
  provider: Provider;
  onClose: () => void;
  onSave: (key: string, secret: string) => Promise<void>;
}

const KEY_FIELDS: Record<Provider, { keyLabel: string; secretLabel: string; keyPlaceholder: string; secretPlaceholder: string; hasSecret: boolean }> = {
  stripe: { keyLabel: 'Publishable Key', secretLabel: 'Secret Key', keyPlaceholder: 'pk_live_...', secretPlaceholder: 'sk_live_...', hasSecret: true },
  razorpay: { keyLabel: 'Key ID', secretLabel: 'Key Secret', keyPlaceholder: 'rzp_live_...', secretPlaceholder: 'Your Razorpay secret', hasSecret: true },
  dodo: { keyLabel: 'API Key', secretLabel: '', keyPlaceholder: 'dodo_live_...', secretPlaceholder: '', hasSecret: false },
};

const KeyModal: React.FC<KeyModalProps> = ({ provider, onClose, onSave }) => {
  const fields = KEY_FIELDS[provider];
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setIsSaving(true);
    try {
      await onSave(apiKey.trim(), apiSecret.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-900">Connect {provider.charAt(0).toUpperCase() + provider.slice(1)}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Keys are encrypted with AES-256-GCM before storage</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-5 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>Keys are encrypted server-side before storage. Never stored in plain text. Only the first 8 characters are kept as a visible prefix for identification.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">{fields.keyLabel} <span className="text-red-500">*</span></label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={fields.keyPlaceholder}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-blue"
                required
              />
              <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {fields.hasSecret && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">{fields.secretLabel} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={e => setApiSecret(e.target.value)}
                  placeholder={fields.secretPlaceholder}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-blue"
                  required={fields.hasSecret}
                />
                <button type="button" onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || !apiKey.trim()}
            className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Encrypting & Saving...</> : 'Connect Securely'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const Gateways = () => {
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const [gateways, setGateways] = useState<GatewaySettings[]>([]);
  const [staticLink, setStaticLink] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [activeModal, setActiveModal] = useState<Provider | null>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    api.gateways.list(activeWorkspace.id)
      .then(setGateways)
      .catch(error => addToast(error instanceof Error ? error.message : 'Could not load gateway connections.', 'error'));
  }, [activeWorkspace, addToast]);

  const isConnected = (type: GatewaySettings['type']) => gateways.some(gw => gw.type === type && gw.is_active);
  const getGateway = (type: GatewaySettings['type']) => gateways.find(gw => gw.type === type && gw.is_active);

  const handleConnect = async (provider: Provider, apiKey: string, apiSecret: string) => {
    if (!activeWorkspace) return;
    if (activeWorkspace.id === 'ws-demo-astrix') {
      // Demo mode: save locally without server call
      const created = await api.gateways.create({ workspace_id: activeWorkspace.id, type: provider, label: provider, is_active: true });
      setGateways(current => [...current.filter(gw => gw.type !== provider), created]);
      addToast(`${provider} connected (demo mode).`, 'success');
      setActiveModal(null);
      return;
    }
    const response = await fetch('/api/gateways/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: activeWorkspace.id, provider, api_key: apiKey, api_secret: apiSecret }),
    });
    if (!response.ok) {
      const { error } = await response.json() as { error?: string };
      addToast(error || `Could not connect ${provider}.`, 'error');
      return;
    }
    // Refresh gateways from server
    const fresh = await api.gateways.list(activeWorkspace.id);
    setGateways(fresh);
    addToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully! Keys encrypted & stored.`, 'success');
    setActiveModal(null);
  };

  const handleDisconnect = async (provider: Provider) => {
    const existing = getGateway(provider);
    if (!existing) return;
    if (!window.confirm(`Disconnect ${provider} from this workspace?`)) return;
    await api.gateways.remove(existing.id);
    setGateways(current => current.map(gw => gw.id === existing.id ? { ...gw, is_active: false } : gw));
    addToast(`${provider} disconnected.`, 'success');
  };

  const saveStaticLink = () => {
    if (!staticLink.trim()) { addToast('Enter a payment link before saving.', 'warning'); return; }
    try {
      const url = new URL(staticLink.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    } catch { addToast('Use a valid http:// or https:// payment link.', 'warning'); return; }
    if (!activeWorkspace) return;
    setIsSavingLink(true);
    api.gateways.create({ workspace_id: activeWorkspace.id, type: 'custom', label: 'Static payment link', static_url: staticLink.trim(), is_active: true })
      .then(created => { setGateways(current => [...current.filter(gw => gw.type !== 'custom'), created]); addToast('Static payment link saved.', 'success'); })
      .catch(error => addToast(error instanceof Error ? error.message : 'Could not save the payment link.', 'error'))
      .finally(() => setIsSavingLink(false));
  };

  const PROVIDERS: Array<{ name: Provider; label: string; desc: string; logo: string; btnColor: string }> = [
    { name: 'stripe', label: 'Stripe', desc: 'Global payments, Credit cards, Apple Pay, Google Pay.', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg', btnColor: 'bg-[#635BFF] hover:bg-[#5249e5]' },
    { name: 'razorpay', label: 'Razorpay', desc: 'Perfect for India. UPI, Netbanking, and domestic cards.', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg', btnColor: 'bg-[#02042B] hover:bg-black' },
    { name: 'dodo', label: 'Dodo Payments', desc: 'Merchant of Record. Sell globally without tax compliance headaches.', logo: 'https://avatars.githubusercontent.com/u/173934306?v=4', btnColor: 'bg-[#18181B] hover:bg-black text-[#D4FF46]' },
  ];

  return (
    <AppLayout title="Payment Gateways" subtitle="Configure payment connections and checkout links">
      {activeModal && (
        <KeyModal
          provider={activeModal}
          onClose={() => setActiveModal(null)}
          onSave={(key, secret) => handleConnect(activeModal, key, secret)}
        />
      )}

      <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {activeWorkspace?.id === 'ws-demo-astrix'
            ? 'Demo mode: gateway connections are stored only in this browser. No payments are processed.'
            : 'API keys are encrypted with AES-256-GCM before storage. Plaintext keys are never persisted.'}
        </div>

        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-brand-blue/20 to-transparent" />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Secure Connections</span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-black mb-3">Seamless 1-Click Checkouts</h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
              Connect your payment gateway. Your keys are encrypted server-side with AES-256-GCM and only the key prefix is stored visibly.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-800/50 border border-gray-700 rounded-full px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> No transaction fees added
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-800/50 border border-gray-700 rounded-full px-3 py-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> AES-256-GCM encrypted keys
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROVIDERS.map(({ name, label, desc, logo, btnColor }) => {
            const connected = isConnected(name);
            const gw = getGateway(name);
            return (
              <div key={name} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center p-2 overflow-hidden">
                      <img src={logo} alt={label} className="w-full h-auto object-contain" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-gray-900">{label}</h3>
                      {connected && gw?.label && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{gw.label}</p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6 flex-1">{desc}</p>

                <div className="space-y-3 mt-auto">
                  {connected && (
                    <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-xs font-bold text-green-700">Connected & encrypted</span>
                    </div>
                  )}
                  {connected ? (
                    <button
                      onClick={() => void handleDisconnect(name)}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-white border-2 border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-600 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveModal(name)}
                      className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors ${btnColor}`}
                    >
                      <Plus className="w-4 h-4" /> Connect {label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Custom Static Link */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all lg:col-span-3 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center shrink-0">
              <LinkIcon className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">Global Static Payment Link</h3>
              <p className="text-sm text-gray-500 mb-3">
                Don&apos;t want to use an API gateway? Add a static link (PayPal.me, UPI link, custom checkout) appended to all reminder emails.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://paypal.me/yourbusiness"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                  value={staticLink}
                  onChange={e => setStaticLink(e.target.value)}
                />
                <button onClick={saveStaticLink} disabled={isSavingLink} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors whitespace-nowrap disabled:opacity-60">
                  {isSavingLink ? 'Saving…' : 'Save Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Gateways;
