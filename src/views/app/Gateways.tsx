import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../lib/api';
import { GatewaySettings } from '../../types';
import { CheckCircle2, Plus, ShieldCheck, Zap, Link as LinkIcon } from 'lucide-react';

export const Gateways = () => {
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const [gateways, setGateways] = useState<GatewaySettings[]>([]);
  const [staticLink, setStaticLink] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);
  useEffect(() => {
    if (!activeWorkspace) return;
    api.gateways.list(activeWorkspace.id)
      .then(setGateways)
      .catch(error => addToast(error instanceof Error ? error.message : 'Could not load gateway connections.', 'error'))
  }, [activeWorkspace, addToast]);

  const isConnected = (type: GatewaySettings['type']) => gateways.some(gateway => gateway.type === type && gateway.is_active);

  const updateGateway = async (name: 'stripe' | 'razorpay' | 'dodo') => {
    const existing = gateways.find(gateway => gateway.type === name && gateway.is_active);
    if (existing) {
      if (!window.confirm(`Disconnect ${name} from this workspace?`)) return;
      await api.gateways.remove(existing.id);
      setGateways(current => current.map(gateway => gateway.id === existing.id ? { ...gateway, is_active: false } : gateway));
      addToast(`${name} disconnected.`, 'success');
      return;
    }
    if (!activeWorkspace) return;
    try {
      const created = await api.gateways.create({ workspace_id: activeWorkspace.id, type: name, label: name === 'dodo' ? 'Dodo Payments' : name[0].toUpperCase() + name.slice(1), is_active: true });
      setGateways(current => [...current.filter(gateway => gateway.type !== name), created]);
      addToast(`${name} connection saved. Secret setup will be completed securely in the next connection step.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : `Could not connect ${name}.`, 'error');
    }
  };

  const saveStaticLink = () => {
    if (!staticLink.trim()) {
      localStorage.removeItem('astrix_demo_static_link');
      addToast('Enter a payment link before saving.', 'warning');
      return;
    }
    try {
      const url = new URL(staticLink.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    } catch {
      addToast('Use a valid http:// or https:// payment link.', 'warning');
      return;
    }
    if (!activeWorkspace) return;
    setIsSavingLink(true);
    api.gateways.create({ workspace_id: activeWorkspace.id, type: 'custom', label: 'Static payment link', static_url: staticLink.trim(), is_active: true })
      .then(created => {
        setGateways(current => [...current.filter(gateway => gateway.type !== 'custom'), created]);
        addToast('Static payment link saved.', 'success');
      })
      .catch(error => addToast(error instanceof Error ? error.message : 'Could not save the payment link.', 'error'))
      .finally(() => setIsSavingLink(false));
  };

  return (
    <AppLayout 
      title="Payment Gateways" 
      subtitle="Configure demo payment connections and checkout links"
    >
      <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {activeWorkspace?.id === 'ws-demo-astrix' ? 'Demo mode: gateway connections are stored only in this browser. No payments are processed.' : 'Connection metadata is stored securely in your workspace. API secrets are never stored in the browser.'}
        </div>
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-brand-blue/20 to-transparent"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Secure Connections</span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-black mb-3">Seamless 1-Click Checkouts</h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
              Configure demo payment gateways and preview where payment links would appear in reminder emails.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-800/50 border border-gray-700 rounded-full px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> No transaction fees added
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-800/50 border border-gray-700 rounded-full px-3 py-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Instant settlements
              </span>
            </div>
          </div>
        </div>

        {/* Gateways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Stripe Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center p-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="w-full h-auto object-contain" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-gray-900">Stripe</h3>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 flex-1">Global payments, Credit cards, Apple Pay, Google Pay.</p>

            <div className="space-y-4 mt-auto">
              {isConnected('stripe') ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</span>
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Active</span>
                  </div>
                </div>
              ) : null}
              
              <button 
                onClick={() => void updateGateway('stripe')}
                aria-label={isConnected('stripe') ? 'Disconnect Stripe' : 'Connect Stripe'}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                  isConnected('stripe')
                    ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50' 
                    : 'bg-[#635BFF] text-white hover:bg-[#5249e5]'
                }`}
              >
                {isConnected('stripe') ? 'Disconnect Stripe' : 'Connect Stripe'}
              </button>
            </div>
          </div>

          {/* Razorpay Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center p-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="w-full h-auto object-contain" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-gray-900">Razorpay</h3>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6 flex-1">Perfect for India. UPI, Netbanking, and domestic cards.</p>

            <div className="space-y-4 mt-auto">
              <button 
                onClick={() => void updateGateway('razorpay')}
                aria-label={isConnected('razorpay') ? 'Disconnect Razorpay' : 'Connect Razorpay'}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  isConnected('razorpay')
                    ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50' 
                    : 'bg-[#02042B] text-white hover:bg-black'
                }`}
              >
                {isConnected('razorpay') ? 'Disconnect Razorpay' : <><Plus className="w-4 h-4" /> Connect Razorpay</>}
              </button>
            </div>
          </div>
          
          {/* Dodo Payments Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center p-1.5 overflow-hidden">
                  <img src="https://avatars.githubusercontent.com/u/173934306?v=4" alt="Dodo Payments" className="w-full h-full object-contain mix-blend-multiply rounded-full" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-gray-900">Dodo Payments</h3>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6 flex-1">Merchant of Record. Sell globally without tax compliance headaches.</p>

            <div className="space-y-4 mt-auto">
              <button 
                onClick={() => void updateGateway('dodo')}
                aria-label={isConnected('dodo') ? 'Disconnect Dodo Payments' : 'Connect Dodo Payments'}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  isConnected('dodo')
                    ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50' 
                    : 'bg-[#18181B] text-[#D4FF46] hover:bg-black'
                }`}
              >
                {isConnected('dodo') ? 'Disconnect Dodo' : <><Plus className="w-4 h-4" /> Connect Dodo</>}
              </button>
            </div>
          </div>

          {/* Custom Link Card (Full Width) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group lg:col-span-3 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center shrink-0">
              <LinkIcon className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">Global Static Payment Link</h3>
              <p className="text-sm text-gray-500 mb-3">
                Don&apos;t want to use an API gateway? Add a static link (like PayPal.me, UPI link, or a custom checkout page) that will be appended to all reminder emails. Note: You can also set specific payment links per invoice when adding them.
              </p>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  placeholder="https://paypal.me/yourbusiness" 
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                  value={staticLink}
                  onChange={(e) => setStaticLink(e.target.value)}
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
