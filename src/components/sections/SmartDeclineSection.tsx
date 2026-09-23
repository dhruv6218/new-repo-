import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export const SmartDeclineSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section className="py-24 md:py-40 bg-white relative border-t border-gray-100" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        <div className="mb-12 md:mb-20">
          <div className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-6 flex items-center gap-4 font-bold">
            <span className="w-8 h-[2px] bg-brand-blue"></span> Feature 02: Smart Decline
          </div>
          <h2 className="font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900">
            Payments fail. <br/>
            <span className="text-gray-300 text-stroke">Recovery shouldn&apos;t.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 font-medium mt-6 md:mt-8 max-w-2xl">
            If a client&apos;s card fails, Astrix instantly recognizes soft vs. hard declines and automatically sends a polite &quot;Fix your card&quot; link without you lifting a finger.
          </p>
        </div>

        {/* Horizontal Comparison Table Mockup - More Realistic UI */}
        <div className={`overflow-x-auto pb-10 hide-scrollbar transition-all duration-700 delay-150 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex gap-6 min-w-max">
            
            {/* Column 1 */}
            <div className="w-[320px] md:w-[400px] bg-white shadow-xl shadow-gray-200/50 rounded-2xl p-6 md:p-8 border border-brand-blue/30 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue"></div>
              <div className="flex justify-between items-start mb-6 mt-2">
                <h3 className="font-heading text-lg md:text-xl font-bold text-gray-900">Acme Corp</h3>
                <span className="bg-brand-blue/10 text-brand-blue text-xs font-mono px-3 py-1 rounded-full font-bold">Score: 92%</span>
              </div>
              <div className="space-y-4 font-mono text-xs md:text-sm text-gray-500 mb-8 font-medium flex-1">
                <div className="flex justify-between border-b border-gray-50 pb-2"><span>Amount</span> <span className="text-gray-900 font-bold">$2,400</span></div>
                <div className="flex justify-between border-b border-gray-50 pb-2"><span>Days Overdue</span> <span className="text-gray-900 font-bold">14 days</span></div>
                <div className="flex justify-between border-b border-gray-50 pb-2"><span>Reminders Sent</span> <span className="text-brand-blue font-bold">2</span></div>
              </div>
              <button className="w-full py-3 rounded-lg bg-brand-blue text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
                <CheckCircle2 className="w-4 h-4" /> Send Reminder
              </button>
            </div>

            {/* Column 2 */}
            <div className="w-[320px] md:w-[400px] bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-200 flex flex-col">
              <div className="flex justify-between items-start mb-6 mt-2">
                <h3 className="font-heading text-lg md:text-xl font-bold text-gray-900">TechStart GmbH</h3>
                <span className="bg-gray-200 text-gray-600 text-xs font-mono px-3 py-1 rounded-full font-bold">Score: 41%</span>
              </div>
              <div className="space-y-4 font-mono text-xs md:text-sm text-gray-500 mb-8 font-medium flex-1">
                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Amount</span> <span className="text-gray-900 font-bold">€1,800</span></div>
                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Days Overdue</span> <span className="text-gray-900 font-bold">7 days</span></div>
                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Reminders Sent</span> <span className="text-gray-900 font-bold">1</span></div>
              </div>
              <button className="w-full py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-300 focus-visible:ring-offset-2">
                <Clock className="w-4 h-4" /> Wait
              </button>
            </div>

            {/* Column 3 */}
            <div className="w-[320px] md:w-[400px] bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-200 flex flex-col">
              <div className="flex justify-between items-start mb-6 mt-2">
                <h3 className="font-heading text-lg md:text-xl font-bold text-gray-900">DataFlow Ltd</h3>
                <span className="bg-brand-yellow/20 text-yellow-700 text-xs font-mono px-3 py-1 rounded-full font-bold">Score: 76%</span>
              </div>
              <div className="space-y-4 font-mono text-xs md:text-sm text-gray-500 mb-8 font-medium flex-1">
                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Amount</span> <span className="text-gray-900 font-bold">$890</span></div>
                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Days Overdue</span> <span className="text-gray-900 font-bold">3 days</span></div>
                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Reminders Sent</span> <span className="text-gray-900 font-bold">0</span></div>
              </div>
              <button className="w-full py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-300 focus-visible:ring-offset-2">
                <XCircle className="w-4 h-4" /> Pause AI
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
