'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Send, Sparkles, User, Loader2, Bot } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../lib/api';
import type { Invoice, GatewaySettings, ToneSettings, ActivityItem } from '../../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
}

export const Assistant = () => {
  const { activeWorkspace } = useWorkspace();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: (
        <div className="space-y-2">
          <p>Hello! I&apos;m your Astrix AI Autonomous Recovery Assistant.</p>
          <p className="text-sm text-gray-500">Ask me anything about overdue invoices, chase statuses, recovery metrics, or connected payment gateways.</p>
        </div>
      )
    }
  ]);

  const suggestions = [
    "Show pending & overdue invoices",
    "What is our total recovered revenue?",
    "Which payment gateways are active?",
    "What is our current chase tone setting?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    let responseContent: React.ReactNode =
      "I couldn't find specific invoice data for that query in your workspace.";

    if (!activeWorkspace?.id) {
      responseContent = 'Please select a workspace first.';
    } else {
      await new Promise(r => setTimeout(r, 600));
      const lower = text.toLowerCase();
      let innerContent: React.ReactNode = 'No matching data found in workspace.';

      if (lower.includes('gateway') || lower.includes('stripe') || lower.includes('razorpay')) {
        const gateways: GatewaySettings[] = await api.gateways.list(activeWorkspace.id);
        const active = gateways.filter(g => g.is_active);
        innerContent = (
          <div className="space-y-2">
            <p className="font-bold text-gray-900 mb-1">Payment Gateways ({gateways.length} total, {active.length} active):</p>
            {gateways.length === 0 ? (
              <p className="text-xs text-gray-500">No payment gateways connected yet. Connect Stripe or Razorpay in Integrations.</p>
            ) : (
              gateways.map((g, idx) => (
                <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-900 capitalize">{g.label || g.type}</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${g.is_active ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                    {g.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))
            )}
          </div>
        );
      } else if (lower.includes('tone') || lower.includes('voice') || lower.includes('nudge')) {
        const tone: ToneSettings | null = await api.tone.get(activeWorkspace.id);
        const levelName = tone?.tone_level === 1 ? 'Friendly Nudge' : tone?.tone_level === 3 ? 'Firm Escalation' : 'Professional Diplomatic';
        innerContent = (
          <div className="space-y-2 text-xs">
            <p className="font-bold text-gray-900">Current AI Chasing Configuration:</p>
            <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
              <p><span className="font-bold text-gray-700">Tone Level:</span> {tone?.tone_level ?? 2} ({levelName})</p>
              {tone?.ai_prompt && <p><span className="font-bold text-gray-700">Custom Directives:</span> {tone.ai_prompt}</p>}
            </div>
          </div>
        );
      } else if (lower.includes('recover') || lower.includes('metric') || lower.includes('stat') || lower.includes('total')) {
        const dashboardData = await api.dashboard.get(activeWorkspace.id);
        const { metrics } = dashboardData;
        innerContent = (
          <div className="space-y-2 text-xs">
            <p className="font-bold text-gray-900">Workspace Recovery Summary:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Total Recovered</span>
                <span className="text-base font-bold text-emerald-900">${metrics.total_recovered.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">Outstanding</span>
                <span className="text-base font-bold text-amber-900">${metrics.currently_outstanding.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">Recovery Rate</span>
                <span className="text-base font-bold text-blue-900">{metrics.recovery_rate}%</span>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-[10px] text-purple-700 uppercase font-bold block">Active Chases</span>
                <span className="text-base font-bold text-purple-900">{metrics.active_chases}</span>
              </div>
            </div>
          </div>
        );
      } else {
        const invoices: Invoice[] = await api.invoices.list(activeWorkspace.id);
        const pending = invoices.filter((i: Invoice) => i.status === 'pending');
        const paid = invoices.filter((i: Invoice) => i.status === 'paid');
        const overdue = pending.filter((i: Invoice) => i.days_overdue > 0);
        innerContent = (
          <div className="space-y-2 text-xs">
            <p className="font-bold text-gray-900">Invoice Overview:</p>
            <p className="text-gray-700">
              You have <span className="font-bold text-amber-600">{pending.length} pending invoices</span> totaling <span className="font-bold">${pending.reduce((s, i) => s + i.amount, 0).toLocaleString()}</span>, of which <span className="font-bold text-red-600">{overdue.length} are overdue</span>.
            </p>
            {pending.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {pending.slice(0, 4).map((inv, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-gray-200 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{inv.client_name}</p>
                      <p className="text-[10px] text-gray-500">{inv.days_overdue} days overdue &bull; {inv.reminder_count} reminders sent</p>
                    </div>
                    <span className="font-mono font-bold text-gray-900">${inv.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      responseContent = innerContent;
    }

    const assistantMsg: Message = { id: Date.now().toString(), role: 'assistant', content: responseContent };
    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  return (
    <AppLayout 
      title="Ask Assistant" 
      subtitle="Query your workspace data using natural language."
    >
      <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-astrix-teal text-white shadow-sm'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-astrix-teal text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-astrix-teal" />
                <span className="text-sm text-gray-500 font-medium">Searching workspace...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {/* Suggestions */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                className="whitespace-nowrap px-3 py-1.5 bg-gray-50 border border-gray-200 hover:border-astrix-teal hover:text-astrix-teal text-gray-600 text-xs font-bold rounded-lg transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <div className="absolute left-4 text-astrix-teal">
              <Sparkles className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about opportunities, accounts, or decisions..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-14 text-sm outline-none focus:ring-2 focus:ring-astrix-teal focus:bg-white transition-all"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 bg-astrix-teal text-white rounded-lg hover:bg-astrix-darkTeal disabled:opacity-50 disabled:bg-gray-300 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Assistant retrieves data strictly from your workspace</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Assistant;
