import React, { useEffect, useRef } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const ChaosSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { ref } = useScrollReveal(0.1);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollY = window.scrollY;
      const containerTop = containerRef.current.offsetTop;
      
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        const offset = index * 200; 
        if (scrollY > containerTop + offset - window.innerHeight / 2) {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
          card.style.filter = 'blur(0px)';
        } else {
          card.style.opacity = '0.3';
          card.style.transform = 'translateY(50px) scale(0.95)';
          card.style.filter = 'blur(4px)';
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const problems = [
    { num: "01", title: "Awkward Follow-ups", desc: "You did the work, but asking for payment feels uncomfortable." },
    { num: "02", title: "Inconsistent Tracking", desc: "Invoices scattered across emails, spreadsheets, and tools." },
    { num: "03", title: "No Paper Trail", desc: "Clients ghost you, and you have no record of reminders sent." },
    { num: "04", title: "Manual Brutality", desc: "Writing the same follow-up emails over and over steals your time." }
  ];

  return (
    <section className="relative bg-gray-50 py-24 md:py-32 border-t border-gray-200" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col lg:flex-row gap-12 md:gap-20">
        
        {/* Left Sticky Header */}
        <div className="lg:w-1/2 lg:sticky lg:top-40 h-fit">
          <div className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-6 flex items-center gap-4 font-bold">
            <span className="w-8 h-[2px] bg-brand-blue"></span> The Chaos
          </div>
          <h2 className="font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900 mb-8">
            Invoices <br/><span className="text-gray-400">Everywhere.</span><br/>
            Payment <br/><span className="text-gray-300 text-stroke">Nowhere.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-md font-medium">
            Without a system, overdue invoices pile up. You&apos;re too busy doing great work to chase payments — and that&apos;s exactly why they slip through.
          </p>
        </div>

        {/* Right Scrollable Cards */}
        <div className="lg:w-1/2 py-10 lg:py-40 flex flex-col gap-16 md:gap-32" ref={containerRef}>
          {problems.map((prob, i) => (
            <div 
              key={i} 
              ref={(el: HTMLDivElement | null) => { cardsRef.current[i] = el; }}
              className="transition-all duration-500 ease-out opacity-30 transform translate-y-12 scale-95 blur-sm bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <div className="text-5xl md:text-6xl font-heading font-black text-gray-100 mb-4">{prob.num}</div>
              <h3 className="text-3xl md:text-5xl font-heading font-bold text-gray-900 mb-4 tracking-tight">{prob.title}</h3>
              <p className="text-lg md:text-xl text-gray-600 font-medium border-l-4 border-brand-blue pl-6">{prob.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
