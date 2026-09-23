'use client';

import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Check, HelpCircle, Loader2, Sparkles, X } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../contexts/ToastContext';
import { useRouter } from 'next/navigation';

export const Pricing = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollReveal(0.1);

  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: "Hook",
      monthlyPrice: "$0",
      annualPrice: "$0", 
      period: "/month",
      annualBilled: "Free forever",
      desc: "First 3 successful invoice recoveries for free. No credit card required.",
      features: [
        "3 Free Recoveries",
        "Multi-gateway connection",
        "AI Tone Cloning",
        "Basic Dashboard",
        "Email Reminders",
      ],
      comingSoon: [
        "Priority Support"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Solo",
      monthlyPrice: "$29",
      annualPrice: "$24", 
      period: "/month",
      annualBilled: "Billed $288 yearly",
      desc: "For solo freelancers who want unlimited recovery on autopilot.",
      features: [
        "Unlimited Invoices",
        "Unlimited Recoveries",
        "Multi-gateway connection",
        "AI Tone Cloning",
        "Smart Escalation",
        "Payment Tracking",
      ],
      comingSoon: [
        "Priority Support"
      ],
      cta: "Start with Solo",
      popular: true
    },
    {
      name: "Agency",
      monthlyPrice: "$99",
      annualPrice: "$79", 
      period: "/month",
      annualBilled: "Billed $948 yearly",
      desc: "For boutique agencies managing multiple clients and team members.",
      features: [
        "Everything in Solo",
        "5 Team Members",
        "Multi-gateway connection",
        "White-Label Domain",
        "Custom Branding",
        "Priority Support",
      ],
      comingSoon: [
        "Advanced Analytics"
      ],
      cta: "Start with Agency",
      popular: false
    }
  ];

  const faqs = [
    { q: "What counts as a 'recovery'?", a: "A recovery is when an overdue invoice is successfully paid after Astrix sends one or more AI-powered reminders. You're only charged for actual results." },
    { q: "Which payment gateways are supported?", a: "We support Stripe (via OAuth/API keys), Razorpay (API keys), and custom static links (UPI, PayPal, etc.). More gateways are added regularly." },
    { q: "How does AI tone cloning work?", a: "You paste 2-3 of your past emails, and our AI learns your writing style � friendly, firm, or somewhere in between. Every reminder sounds like it came from you." },
    { q: "Can I pause reminders for a specific invoice?", a: "Yes! Every invoice has a 'Pause AI' button. You can also mark invoices as disputed or paid manually at any time." },
    { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption, and your data is never used to train AI models. We're SOC 2 compliant." },
    { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time from the billing settings. You will retain access until the end of your current billing period." }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCheckout = async (tier: { name: string }) => {
    if (!activeWorkspace) {
      addToast("Please log in or create an account to upgrade.", "warning");
      router.push('/signup');
      return;
    }

    if (tier.name.toLowerCase() === 'hook') {
      router.push('/app');
      return;
    }

    setLoadingTier(tier.name);
    try {
      const planCode = tier.name.toLowerCase() === 'solo' ? 'solo' : 'agency';
      const interval = isAnnual ? 'yearly' : 'monthly';
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode, interval, workspaceId: activeWorkspace.id }),
      });
      const data = await response.json() as { checkoutUrl?: string; error?: string };
      if (response.ok && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        addToast(data.error || `Navigating to billing settings for ${tier.name}...`, "warning");
        router.push('/app/settings?tab=billing');
      }
    } catch {
      addToast(`Navigating to billing settings for ${tier.name}...`, "warning");
      router.push('/app/settings?tab=billing');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 pt-20 md:pt-32 pb-24 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center" ref={headerRef}>
          <h1 className={`font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900 mb-6 transition-all duration-700 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Simple pricing. <br/>
            <span className="text-brand-blue">Pay for results.</span>
          </h1>
          <p className={`text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto mb-10 transition-all duration-700 delay-100 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Start free. Only pay when you see results.
          </p>

          {/* Billing Toggle */}
          <div className={`flex items-center justify-center gap-4 transition-all duration-700 delay-200 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <button 
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`text-sm font-bold transition-colors cursor-pointer ${!isAnnual ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </button>

            <button 
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className={`w-14 h-7 rounded-full p-1 relative transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30 shadow-inner ${isAnnual ? 'bg-brand-blue' : 'bg-gray-300'}`}
              aria-label="Toggle annual billing"
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${isAnnual ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Annually <span className="bg-green-100 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Save ~17%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 -mt-12 relative z-10 mb-20" ref={cardsRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
          {tiers.map((tier, i) => (
            <div 
              key={i} 
              className={`relative rounded-3xl p-6 lg:p-8 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${tier.popular ? 'bg-brand-blue text-white shadow-glow-blue xl:scale-105 z-20 border-none' : 'bg-white text-gray-900 shadow-apple border border-gray-200'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-yellow text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-yellow-300/50 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <h3 className={`text-xl font-heading font-bold mb-2 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>{tier.name}</h3>
              <p className={`text-sm mb-6 h-16 font-medium ${tier.popular ? 'text-blue-100' : 'text-gray-500'}`}>{tier.desc}</p>
              
              <div className="mb-2">
                <span className="text-4xl lg:text-5xl font-heading font-black tracking-tighter">
                  {isAnnual ? tier.annualPrice : tier.monthlyPrice}
                </span>
                {tier.period && <span className={`text-sm font-bold ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>{tier.period}</span>}
              </div>
              <div className={`text-xs font-medium mb-8 h-4 ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>
                {isAnnual && tier.annualPrice !== "$0" ? tier.annualBilled : (tier.annualPrice === "$0" ? "Free forever" : "Billed monthly")}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm font-medium">
                    <Check className={`w-5 h-5 shrink-0 ${tier.popular ? 'text-brand-yellow' : 'text-brand-blue'}`} />
                    <span className={tier.popular ? 'text-blue-50' : 'text-gray-600'}>{feat}</span>
                  </li>
                ))}
                
                {/* Coming Soon Features */}
                {tier.comingSoon.map((feat, j) => (
                  <li key={`cs-${j}`} className="flex items-start gap-3 text-sm font-medium opacity-70">
                    <Sparkles className={`w-5 h-5 shrink-0 ${tier.popular ? 'text-blue-300' : 'text-gray-400'}`} />
                    <span className={tier.popular ? 'text-blue-100' : 'text-gray-500'}>
                      {feat} <span className="text-[10px] uppercase tracking-wider font-bold ml-1 opacity-80">(Coming Soon)</span>
                    </span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleCheckout(tier)}
                disabled={loadingTier === tier.name}
                className={`w-full py-3.5 rounded-xl font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 flex items-center justify-center gap-2 ${tier.popular ? 'bg-white text-brand-blue hover:bg-gray-50 focus-visible:ring-white shadow-sm' : 'bg-gray-900 text-white hover:bg-brand-blue focus-visible:ring-brand-blue shadow-sm'} disabled:opacity-70`}
              >
                {loadingTier === tier.name ? <Loader2 className="w-5 h-5 animate-spin" /> : tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 mb-32 hidden md:block">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Compare Plans</h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">Find the perfect set of features for your workflow.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-6 bg-gray-50 border-b border-gray-200 text-gray-900 font-heading font-bold text-lg w-1/3">Features</th>
                <th className="p-6 bg-gray-50 border-b border-gray-200 text-gray-900 font-heading font-bold text-center w-1/5">Hook</th>
                <th className="p-6 bg-brand-blue/5 border-b border-gray-200 text-brand-blue font-heading font-bold text-center w-1/5">Solo</th>
                <th className="p-6 bg-gray-50 border-b border-gray-200 text-gray-900 font-heading font-bold text-center w-1/5">Agency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'Successful Recoveries', hook: '3 Included', solo: 'Unlimited', agency: 'Unlimited' },
                { name: 'AI Tone Cloning', hook: true, solo: true, agency: true },
                { name: 'Multi-gateway connection', hook: true, solo: true, agency: true },
                { name: 'Automated Escalation', hook: false, solo: true, agency: true },
                { name: 'Payment Tracking', hook: false, solo: true, agency: true },
                { name: 'Team Members', hook: '1 User', solo: '1 User', agency: '5 Users' },
                { name: 'Custom Branding', hook: false, solo: false, agency: true },
                { name: 'White-Label Domain', hook: false, solo: false, agency: true },
                { name: 'Priority Support', hook: false, solo: false, agency: true },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 text-sm font-medium text-gray-900">{row.name}</td>
                  
                  {/* Hook */}
                  <td className="p-6 text-center text-sm font-bold text-gray-500">
                    {typeof row.hook === 'boolean' ? (
                      row.hook ? <Check className="w-5 h-5 mx-auto text-green-500" /> : <X className="w-5 h-5 mx-auto text-gray-300" />
                    ) : row.hook}
                  </td>
                  
                  {/* Solo */}
                  <td className="p-6 text-center text-sm font-bold text-brand-blue bg-brand-blue/5">
                    {typeof row.solo === 'boolean' ? (
                      row.solo ? <Check className="w-5 h-5 mx-auto text-brand-blue" /> : <X className="w-5 h-5 mx-auto text-gray-300" />
                    ) : row.solo}
                  </td>
                  
                  {/* Agency */}
                  <td className="p-6 text-center text-sm font-bold text-gray-900">
                    {typeof row.agency === 'boolean' ? (
                      row.agency ? <Check className="w-5 h-5 mx-auto text-green-500" /> : <X className="w-5 h-5 mx-auto text-gray-300" />
                    ) : row.agency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-[800px] mx-auto px-6 md:px-12 mb-32">
        <div className="flex items-center justify-center gap-3 mb-12">
          <HelpCircle className="w-6 h-6 text-brand-blue" />
          <h3 className="text-3xl font-heading font-bold text-center tracking-tight">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-brand-blue/30 transition-colors">
              <button 
                className="w-full p-6 text-left flex justify-between items-center focus-visible:outline-none focus-visible:bg-gray-50 group"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{faq.q}</span>
                <span className={`transform transition-transform duration-300 text-gray-400 group-hover:text-brand-blue ${openFaq === i ? 'rotate-180' : ''}`}>?</span>
              </button>
              <div 
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="text-gray-600 text-sm font-medium leading-relaxed px-6 pb-6 pt-2">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </MainLayout>
  );
};

export default Pricing;
