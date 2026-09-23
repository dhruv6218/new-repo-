'use client';

import React from 'react';
import { ArrowRight, Sparkles, Activity } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useMouseTilt } from '../../hooks/use3DEffects';
import { useMouseParallax } from '../../hooks/useMouseParallax';
import { MagneticButton } from '../ui/MagneticButton';
import Link from 'next/link';

export const HeroSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const tiltRef = useMouseTilt(10, 1.02);
  const parallaxRef = useMouseParallax(3);

  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-28 md:pt-32 pb-16 md:pb-20 overflow-hidden bg-white" ref={ref} suppressHydrationWarning>
      
      {/* Ultra-Subtle Background Grid & Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-blue rounded-full mix-blend-multiply filter blur-[180px] opacity-[0.07] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-brand-yellow rounded-full mix-blend-multiply filter blur-[180px] opacity-[0.05] animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_10%,transparent_100%)]"></div>
      </div>

      <div className="w-full px-4 sm:px-6 md:px-12 relative z-10 flex flex-col items-center text-center mt-10">
        
        {/* Massive Editorial Typography */}
        <div className="relative w-full max-w-[1000px] mx-auto flex flex-col items-center justify-center mb-12 md:mb-16">
          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.1] sm:leading-none tracking-tighter font-black text-gray-900 m-0 p-0 relative z-20 w-full">
            <span className="block overflow-hidden pb-1 sm:pb-2">
              <span className={`block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'translate-y-0' : 'translate-y-[120%]'}`}>
                Get paid for
              </span>
            </span>
            <span className="block overflow-hidden pb-2 sm:pb-4">
              <span className={`block text-brand-blue transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 ${isVisible ? 'translate-y-0' : 'translate-y-[120%]'}`}>
                work you&apos;ve
              </span>
            </span>
            <span className="block overflow-hidden pb-2 sm:pb-4">
              <span className={`block text-gray-900 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-150 ${isVisible ? 'translate-y-0' : 'translate-y-[120%]'}`}>
                already done.
              </span>
            </span>
          </h1>
          
          <p className={`mt-6 md:mt-8 text-lg md:text-xl lg:text-2xl text-gray-500 font-medium max-w-3xl px-4 sm:px-0 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            ASTRIX AI is your autonomous revenue recovery agent: a calm workspace that tracks invoices, clones your voice, sends reminders, and gets you paid — on autopilot.
          </p>
        </div>

        {/* The Living Engine - Realistic SaaS UI Mockup */}
        <div 
          ref={tiltRef}
          className={`w-full max-w-[1100px] preserve-3d relative z-10 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
        >
          <div ref={parallaxRef as React.RefObject<HTMLDivElement>} className="relative w-full aspect-[4/3] md:aspect-[21/9] glass-panel-light rounded-[2rem] overflow-hidden flex flex-col border border-white shadow-apple">
            
            {/* macOS Style Window Header */}
            <div className="h-10 md:h-12 border-b border-gray-200/50 bg-white/40 flex items-center px-4 md:px-6 gap-2 shrink-0">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-300"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-300"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-300"></div>
              <div className="mx-auto font-mono text-[10px] md:text-xs text-gray-400 font-bold tracking-widest uppercase hidden md:block">Astrix Dashboard</div>
            </div>

            {/* Application Body */}
            <div className="flex-1 flex p-4 md:p-6 gap-6 preserve-3d bg-gray-50/30">
              
              {/* Sidebar (Hidden on Mobile) */}
              <div className="hidden md:flex w-48 flex-col gap-3 border-r border-gray-200/50 pr-6 shrink-0">
                <div className="h-8 bg-brand-blue/10 rounded-lg w-full flex items-center px-3 border border-brand-blue/20">
                  <div className="w-3 h-3 rounded-full bg-brand-blue mr-2"></div>
                  <div className="h-2 bg-brand-blue/40 rounded w-16"></div>
                </div>
                <div className="h-8 bg-white/60 rounded-lg w-full flex items-center px-3">
                  <div className="h-2 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="h-8 bg-white/60 rounded-lg w-full flex items-center px-3">
                  <div className="h-2 bg-gray-300 rounded w-14"></div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col gap-4 md:gap-6 preserve-3d w-full">
                
                {/* The AI Insight Row (Pops out in 3D) */}
                <div className="w-full bg-gray-900 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between transform md:translate-z-50 shadow-2xl shadow-gray-900/30 border border-gray-800 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-0 relative z-10">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-blue/20 flex items-center justify-center border border-brand-blue/30 shrink-0">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-brand-blue" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm md:text-base flex items-center gap-2">
                        Reminder Sent <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-yellow"></span></span>
                      </div>
                      <div className="text-gray-400 font-mono text-[10px] md:text-xs mt-1">AI sent a friendly nudge to Acme Corp for Invoice #1042.</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 border border-white/10 px-4 py-2 rounded-lg relative z-10 w-full md:w-auto flex justify-between md:block mt-2 md:mt-0">
                    <span className="text-gray-400 text-xs md:text-sm mr-2">Invoice Amount:</span>
                    <span className="text-brand-yellow font-bold text-sm md:text-base">$2,400</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="flex flex-col sm:flex-row gap-4 flex-1 preserve-3d">
                  <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-200 transform md:translate-z-30 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="text-gray-500 font-mono text-[10px] md:text-xs font-bold uppercase mb-2">Recovery Rate</div>
                    <div className="text-4xl md:text-6xl font-heading font-black text-brand-blue tracking-tighter">94%</div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100"><div className="h-full bg-brand-blue w-[94%]"></div></div>
                  </div>
                  
                  <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-200 transform md:translate-z-20 shadow-sm flex flex-col justify-center">
                    <div className="text-gray-500 font-mono text-[10px] md:text-xs font-bold uppercase mb-2">Total Recovered</div>
                    <div className="text-4xl md:text-6xl font-heading font-black text-gray-900 tracking-tighter">$47.2k</div>
                    <div className="text-green-500 text-xs font-bold mt-2 flex items-center gap-1"><Activity className="w-3 h-3" /> +$3.2k this week</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Floating Badges (Outside the window) */}
            <div className="absolute -right-2 md:-right-8 top-1/4 bg-white border border-gray-200 text-gray-900 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-mono text-[10px] md:text-xs font-bold shadow-xl transform translate-z-50 animate-float flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse"></div> Sending reminder...
            </div>
            <div className="absolute -left-2 md:-left-6 bottom-1/4 bg-gray-900 text-white border border-gray-700 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-mono text-[10px] md:text-xs font-bold shadow-xl transform translate-z-50 animate-float flex items-center gap-2" style={{ animationDelay: '1s' }}>
              ✓ Invoice Paid
            </div>

          </div>
        </div>

        {/* CTA Area */}
        <div className={`mt-16 md:mt-20 flex flex-col items-center transition-all duration-700 delay-500 w-full ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full px-4 sm:px-0">
            <MagneticButton strength={0.2} className="w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto bg-brand-blue text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-3 group shadow-glow-blue btn-shine focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
                Start Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.1} className="w-full sm:w-auto">
              <a href="#features" className="w-full sm:w-auto bg-white text-gray-900 border border-gray-200 px-8 md:px-10 py-3.5 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200 focus-visible:ring-offset-2">
                See How It Works
              </a>
            </MagneticButton>
          </div>
          <span className="text-xs md:text-sm text-gray-400 font-medium mt-6 text-center">First 3 successful recoveries are free. No credit card required.</span>
        </div>

      </div>
    </section>
  );
};
