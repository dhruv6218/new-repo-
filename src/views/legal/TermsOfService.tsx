import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { FileText } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const TermsOfService = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();

  return (
    <MainLayout>
      <div className="bg-gray-50 pt-24 md:pt-32 pb-16 border-b border-gray-200 overflow-hidden relative">
        <div className="absolute inset-0 bg-noise"></div>
        <div className="max-w-[800px] mx-auto px-6 text-center relative z-10" ref={headerRef}>
          <div className={`inline-flex items-center justify-center gap-2 bg-brand-blue/10 text-brand-blue px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest mb-6 border border-brand-blue/20 transition-all duration-700 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <FileText className="w-4 h-4" /> Legal & Compliance
          </div>
          <h1 className={`font-heading text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight transition-all duration-700 delay-100 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Terms of Service
          </h1>
          <p className={`text-lg text-gray-500 font-medium transition-all duration-700 delay-200 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Last updated: January 2025
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
        <div className="prose prose-lg prose-blue max-w-none text-gray-600 font-medium">
          <p className="lead text-xl text-gray-900 font-bold mb-8">
            Welcome to Astrix AI. By accessing or using our autonomous revenue recovery platform, you agree to be bound by these Terms of Service.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-8">
            By creating an account, accessing, or using the Astrix AI platform (&quot;Service&quot;), you agree to comply with and be bound by these Terms. If you do not agree to these Terms, you may not use the Service.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">2. Description of Service</h2>
          <p className="mb-8">
            Astrix AI is an autonomous revenue recovery agent for freelancers and small agencies. It tracks overdue invoices, generates AI-powered payment reminders in your voice, sends follow-up emails, and provides 1-click checkout links for instant payment collection.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">3. User Accounts and Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for safeguarding your password and for all activities that occur under your account.</li>
            <li>You represent that you have the legal right to collect payments for the invoices you track through Astrix.</li>
            <li>You agree not to use Astrix for harassing, threatening, or illegal communication with clients.</li>
            <li>You are responsible for ensuring your reminder emails comply with applicable laws (CAN-SPAM, GDPR, etc.).</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">4. Payment Gateway Integration</h2>
          <p className="mb-4">
            When you connect payment gateways:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>You grant Astrix limited permission to generate payment links on your behalf.</li>
            <li>All payment processing is handled directly by your connected gateway (Stripe, Razorpay, etc.).</li>
            <li>Astrix does not process, hold, or have access to actual payment funds.</li>
            <li>You are responsible for maintaining your gateway API keys and ensuring they remain active.</li>
            <li>You must comply with the terms of service of each connected payment gateway.</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">5. Subscription & Billing</h2>
          <p className="mb-4">
            Astrix offers tiered subscription plans:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li><strong>Hook (Free):</strong> First 3 successful invoice recoveries at no cost.</li>
            <li><strong>Solo ($29/mo):</strong> Unlimited invoice tracking and AI reminders for individual freelancers.</li>
            <li><strong>Agency ($99/mo):</strong> Multi-user access, white-label sending domain, and multiple gateway connections.</li>
          </ul>
          <p className="mb-8">
            Subscriptions are billed monthly or annually in advance. You can cancel anytime — access continues until the end of your current billing period. Refunds are not provided for partial months.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">6. AI-Generated Content</h2>
          <p className="mb-8">
            Astrix uses AI to generate reminder emails based on your tone training data. You are responsible for reviewing and approving AI-generated content before it is sent. Astrix is not liable for any issues arising from AI-generated communications sent on your behalf.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">7. Acceptable Use Policy</h2>
          <p className="mb-4">
            You agree NOT to use Astrix to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>Send spam or unsolicited commercial emails.</li>
            <li>Harass, threaten, or intimidate clients or third parties.</li>
            <li>Collect payments for illegal goods or services.</li>
            <li>Misrepresent invoice amounts or payment status.</li>
            <li>Violate any applicable local, state, national, or international law.</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">8. Disclaimer of Warranties</h2>
          <p className="mb-8">
            Astrix AI is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that you will recover any specific amount of overdue invoices. Payment recovery depends on many factors outside our control, including client responsiveness and payment gateway functionality.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">9. Limitation of Liability</h2>
          <p className="mb-8">
            In no event shall Astrix AI Inc. be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">10. Termination</h2>
          <p className="mb-8">
            We may suspend or terminate your account if you violate these Terms. Upon termination, your access to the Service will cease immediately. You may delete your account at any time from Settings.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">11. Governing Law</h2>
          <p className="mb-8">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Astrix AI Inc. is incorporated, without regard to its conflict of law provisions.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">12. Contact</h2>
          <p>
            For any legal inquiries regarding these terms, please contact:
            <br />
            <a href="mailto:help.astrix@gmail.com" className="text-brand-blue font-bold hover:underline">help.astrix@gmail.com</a>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfService;
