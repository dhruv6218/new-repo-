import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Mail, MessageCircle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const Contact = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: contentRef, isVisible: contentVisible } = useScrollReveal(0.1);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/maqppylo", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (response.ok) {
        setIsSuccess(true);
        form.reset(); // Clear the form fields
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        setError("We couldn't send your message. Please try again.");
      }
    } catch (submitError) {
      console.error("Error submitting form", submitError);
      setError("We couldn't send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      {/* Header Section */}
      <div className="bg-gray-50 pt-24 md:pt-32 pb-24 border-b border-gray-200 overflow-hidden relative">
        <div className="absolute inset-0 bg-noise"></div>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center relative z-10" ref={headerRef}>
          <div className={`inline-flex items-center justify-center gap-2 bg-brand-blue/10 text-brand-blue px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest mb-6 border border-brand-blue/20 transition-all duration-700 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <MessageCircle className="w-4 h-4" /> Get in touch
          </div>
          <h1 className={`font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900 mb-6 transition-all duration-700 delay-100 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            We&apos;re here to <br/>
            <span className="text-brand-blue">help you build.</span>
          </h1>
          <p className={`text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto mb-12 transition-all duration-700 delay-200 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Have a question about Astrix? Need help setting up your workspace? Our team is ready to assist you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24" ref={contentRef}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20">
          
          {/* Left: Contact Info Cards */}
          <div className={`lg:col-span-2 space-y-6 transition-all duration-700 ${contentVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <h3 className="font-heading text-2xl font-bold text-gray-900 mb-8">Direct Contact</h3>
            
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-apple hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6 text-brand-blue" />
              </div>
              <h4 className="text-sm font-mono text-gray-500 uppercase tracking-widest font-bold mb-2">Email Us</h4>
              <a href="mailto:help.astrix@gmail.com" className="text-xl font-bold text-gray-900 hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-sm">
                help.astrix@gmail.com
              </a>
              <p className="text-sm text-gray-500 font-medium mt-3">We aim to respond to all inquiries within 2 hours during business days.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-apple hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-sm font-mono text-gray-500 uppercase tracking-widest font-bold mb-2">WhatsApp Only</h4>
              <a href="https://wa.me/919034950792" target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-gray-900 hover:text-green-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 rounded-sm">
                +91 90349 50792
              </a>
              <p className="text-sm text-gray-500 font-medium mt-3">Available Mon-Fri, 9am to 6pm for urgent support and sales inquiries. Click to chat directly.</p>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className={`lg:col-span-3 transition-all duration-700 delay-200 ${contentVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-apple relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none"></div>
              
              <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2 relative z-10">Send a Message</h3>
              <p className="text-gray-500 font-medium mb-8 relative z-10">Fill out the form below and we&apos;ll get back to you shortly.</p>

              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-[fadeIn_0.5s_ease-out]">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="font-heading text-2xl font-bold text-gray-900 mb-2">Message Sent!</h4>
                  <p className="text-gray-500 font-medium">Thank you for reaching out. Our team will contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="firstName">First Name</label>
                      <input 
                        type="text" 
                        id="firstName"
                        name="firstName"
                        required
                        minLength={2}
                        autoComplete="given-name"
                        className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none placeholder-gray-400" 
                        placeholder="Jane" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="lastName">Last Name</label>
                      <input 
                        type="text" 
                        id="lastName"
                        name="lastName"
                        required
                        minLength={2}
                        autoComplete="family-name"
                        className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none placeholder-gray-400" 
                        placeholder="Doe" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="email">Work Email</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      required
                      autoComplete="email"
                      className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none placeholder-gray-400" 
                      placeholder="jane@company.com" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="subject">Subject</label>
                    <select 
                      id="subject"
                      name="subject"
                      required
                      className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select a topic...</option>
                      <option value="sales">Sales & Enterprise Pricing</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnerships</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="message">Message</label>
                    <textarea 
                      id="message"
                      name="message"
                      required
                      minLength={10}
                      rows={4}
                      className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 transition-all duration-300 outline-none placeholder-gray-400 resize-none" 
                      placeholder="How can we help you?" 
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-base px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none h-[56px]"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="w-5 h-5" /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;
