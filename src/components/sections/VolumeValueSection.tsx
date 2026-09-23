import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const VolumeValueSection = () => {
  const { ref, isVisible } = useScrollReveal(0.3);

  const valueDots = Array.from({ length: 3 });

  return (
    <section className="py-24 md:py-40 bg-white relative overflow-hidden border-t border-gray-100" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
        
        {/* Left: Narrative */}
        <div className={`relative z-10 transition-all duration-700 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
          <div className="text-brand-red font-mono text-sm tracking-widest uppercase mb-6 flex items-center gap-4 font-bold">
            <span className="w-8 h-[2px] bg-brand-red"></span> The Difference
          </div>
          <h2 className="font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900 mb-6 md:mb-8">
            Your Voice. <br/>
            <span className="text-gray-300 text-stroke">Not a Bot.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 font-medium mb-6 md:mb-8">
            Generic payment reminders feel cold and get ignored. Astrix clones your actual writing style — friendly, firm, or somewhere in between — so clients respond like it&apos;s you.
          </p>
          <p className="text-lg md:text-xl text-gray-900 font-bold">
            Plus, every reminder includes a 1-click checkout link for instant payment.
          </p>
        </div>

        {/* Right: Interactive Visual (Optimized) */}
        <div className={`relative h-[350px] md:h-[500px] glass-panel-light rounded-3xl p-8 overflow-hidden transition-all duration-700 delay-150 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
            
            {/* The Noise (Generic Emails) - Optimized SVG Background */}
            <div className="absolute inset-0 opacity-20" style={{ 
              backgroundImage: 'radial-gradient(circle at 2px 2px, #9CA3AF 2px, transparent 0)', 
              backgroundSize: '24px 24px' 
            }}></div>

            {/* The Value (Personalized) */}
            <div className="relative z-10 flex gap-6 md:gap-8">
              {valueDots.map((_, i) => (
                <div key={`value-${i}`} className="relative group cursor-pointer" tabIndex={0} aria-label="Personalized AI reminder">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-brand-yellow shadow-[0_10px_30px_rgba(245,200,66,0.4)] flex items-center justify-center text-gray-900 font-black text-lg md:text-xl group-hover:scale-125 group-focus-visible:scale-125 transition-transform duration-300 border-2 border-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
                    AI
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -top-14 md:-top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-mono px-3 md:px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                    Your tone, cloned
                  </div>
                  {/* Ripple */}
                  <div className="absolute inset-0 rounded-full border-2 border-brand-yellow animate-ping"></div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
