import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { ShieldCheck } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const PrivacyPolicy = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();

  return (
    <MainLayout>
      <div className="bg-gray-50 pt-24 md:pt-32 pb-16 border-b border-gray-200 overflow-hidden relative">
        <div className="absolute inset-0 bg-noise"></div>
        <div className="max-w-[800px] mx-auto px-6 text-center relative z-10" ref={headerRef}>
          <div className={`inline-flex items-center justify-center gap-2 bg-brand-blue/10 text-brand-blue px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest mb-6 border border-brand-blue/20 transition-all duration-700 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <ShieldCheck className="w-4 h-4" /> Legal & Compliance
          </div>
          <h1 className={`font-heading text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight transition-all duration-700 delay-100 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Privacy Policy
          </h1>
          <p className={`text-lg text-gray-500 font-medium transition-all duration-700 delay-200 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Last updated: January 2025
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
        <div className="prose prose-lg prose-blue max-w-none text-gray-600 font-medium">
          <p className="lead text-xl text-gray-900 font-bold mb-8">
            At Astrix AI, we take your privacy seriously. This policy describes how we collect, use, and protect your data when you use our autonomous revenue recovery platform.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
            <li><strong>Invoice Data:</strong> Client names, email addresses, invoice amounts, due dates, and payment status that you upload or sync to Astrix.</li>
            <li><strong>Payment Gateway Credentials:</strong> API keys for Stripe, Razorpay, or other connected payment gateways (stored encrypted and never exposed in plain text).</li>
            <li><strong>AI Tone Data:</strong> Sample emails you provide to train the AI on your writing style.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our application, including log data, device information, and IP addresses.</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">2. How We Use Your Data</h2>
          <p>We use the collected data to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>Send automated payment reminders to your clients on your behalf.</li>
            <li>Generate AI-powered email drafts that match your personal writing style.</li>
            <li>Track invoice payment status and provide recovery analytics.</li>
            <li>Create 1-click checkout links for instant payment collection.</li>
            <li>Send you technical notices, updates, security alerts, and support messages.</li>
          </ul>

          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl my-8">
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">AI Tone Cloning</h3>
            <p className="text-sm text-gray-700 m-0">
              Your sample emails are used solely to generate reminders in your voice. <strong>Your tone data is never used to train third-party AI models or shared with external parties.</strong> You can delete your tone training data at any time from Settings.
            </p>
          </div>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">3. Payment Gateway Security</h2>
          <p className="mb-4">
            When you connect payment gateways (Stripe, Razorpay, etc.), we store only the minimum required credentials:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>API keys are encrypted using industry-standard AES-256 encryption.</li>
            <li>We never store full banking credentials or passwords.</li>
            <li>Payment processing happens directly through your connected gateway — we never touch or hold your clients&apos; payment data.</li>
            <li>You can revoke gateway access at any time from Settings.</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share data only in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li><strong>With Service Providers:</strong> Third-party vendors who perform services on our behalf (e.g., email delivery via Resend, hosting via Vercel).</li>
            <li><strong>With Your Clients:</strong> We send reminder emails to your clients on your behalf — these emails include your name, invoice details, and payment links.</li>
            <li><strong>For Legal Reasons:</strong> If required to do so by law or in response to valid requests by public authorities.</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">5. Client Communication</h2>
          <p className="mb-4">
            When you use Astrix to send reminders:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>Emails are sent from your connected email or our sending domain (if on Agency plan with white-label).</li>
            <li>Clients can opt out of further reminders by clicking &quot;Already Paid&quot; or replying to the email.</li>
            <li>We include an unsubscribe link in every reminder email as required by CAN-SPAM and GDPR regulations.</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">6. Security</h2>
          <p className="mb-8">
            We implement industry-standard security measures to protect your data, including encryption in transit and at rest, role-based access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">7. Data Retention & Deletion</h2>
          <p className="mb-8">
            You can delete your account and all associated data at any time from Settings. Upon deletion request, we remove your personal data within 30 days. Invoice history and client communication logs are retained for 90 days for dispute resolution purposes.
          </p>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact our Data Protection Officer at:
            <br />
            <a href="mailto:help.astrix@gmail.com" className="text-brand-blue font-bold hover:underline">help.astrix@gmail.com</a>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy;
