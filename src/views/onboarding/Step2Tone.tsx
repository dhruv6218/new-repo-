'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '../../layouts/OnboardingLayout';
import { Loader2, Sliders, Eye, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const TONE_OPTIONS = [
  { level: 1, label: 'Friendly', emoji: '??', desc: 'Warm, casual, understanding' },
  { level: 2, label: 'Balanced', emoji: '??', desc: 'Professional & clear' },
  { level: 3, label: 'Firm', emoji: '??', desc: 'Direct, assertive, urgent' },
];

const TONE_PREVIEWS: Record<number, string> = {
  1: `Hey [Client]! ??\n\nHope you're doing well! Just a friendly reminder about Invoice #INV-001 for $2,400 � due Jan 1st.\n\nNo worries, here's a quick link to sort it whenever you get a chance:\n?? pay.astrixai.app/INV-001\n\nThanks so much! Really appreciate working with you.\n\n� [Your Name]`,
  2: `Hi [Client],\n\nI wanted to follow up on Invoice #INV-001 ($2,400) which is now 7 days past due.\n\nCould you please process the payment at your earliest convenience? Here's the direct link:\n\npay.astrixai.app/INV-001\n\nLet me know if you have any questions.\n\nBest regards,\n[Your Name]`,
  3: `[Client],\n\nThis is an important reminder that Invoice #INV-001 for $2,400 is now significantly overdue.\n\nImmediate payment is required to avoid service interruption. Please pay now:\n\npay.astrixai.app/INV-001\n\nIf you believe this is an error, please reply immediately.\n\n[Your Name]`,
};

export const Step2Tone = () => {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const [sampleEmails, setSampleEmails] = useState('');
  const [toneLevel, setToneLevel] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleGeneratePreview = () => {
    if (!sampleEmails.trim()) { addToast('Paste at least one sample email first.', 'warning'); return; }
    setIsGenerating(true);
    setTimeout(() => {
      setPreview(TONE_PREVIEWS[toneLevel]);
      setIsGenerating(false);
    }, 1200);
  };

  const handleContinue = async () => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    await api.tone.save({
      workspace_id: activeWorkspace.id,
      sample_emails: sampleEmails,
      tone_level: toneLevel,
      ai_prompt: `Tone level ${toneLevel}: ${TONE_OPTIONS[toneLevel - 1].label}. Sample: ${sampleEmails.substring(0, 200)}`,
      updated_at: new Date().toISOString(),
    });
    addToast('Tone saved successfully!', 'success');
    setIsSaving(false);
    router.push('/onboarding/step-3');
  };

  const handleSkip = () => router.push('/onboarding/step-3');

  return (
    <OnboardingLayout step={2} totalSteps={3} showSkip onSkip={handleSkip}>
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Set Up Your AI Tone
        </h1>
        <p className="text-gray-500 text-base font-medium max-w-lg mx-auto">
          Paste 2 of your past client emails. Astrix learns your writing style and sends reminders that sound exactly like you.
        </p>
      </div>

      <div className="space-y-6">
        {/* Sample Emails */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-apple">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Your Sample Emails (2 recommended)
          </label>
          <p className="text-xs text-gray-500 mb-3">These are only used to learn your tone � never sent anywhere.</p>
          <textarea value={sampleEmails} onChange={e => setSampleEmails(e.target.value)}
            placeholder={`Paste a typical follow-up email you'd send, for example:\n\n"Hey John, hope you're well! Just following up on the invoice I sent last week..."`}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue resize-none h-36 transition-all" />
        </div>

        {/* Tone Selector */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-apple">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-bold text-gray-900">Starting Tone Level</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {TONE_OPTIONS.map(opt => (
              <button key={opt.level} onClick={() => { setToneLevel(opt.level); setPreview(''); }}
                className={`p-4 rounded-2xl border-2 transition-all text-center ${toneLevel === opt.level ? 'border-brand-blue bg-blue-50/30' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                <div className="text-2xl mb-1">{opt.emoji}</div>
                <div className={`text-sm font-bold ${toneLevel === opt.level ? 'text-brand-blue' : 'text-gray-700'}`}>{opt.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">AI escalates automatically as invoices age unpaid.</p>
        </div>

        {/* Preview Button */}
        <button onClick={handleGeneratePreview} disabled={isGenerating}
          className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Eye className="w-4 h-4" /> Generate AI Preview</>}
        </button>

        {/* Preview Output */}
        {preview && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">AI Preview � Level {toneLevel} ({TONE_OPTIONS[toneLevel - 1].label})</span>
            </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{preview}</pre>
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-blue inline-block"></span>
              1-click checkout link will be embedded automatically
            </div>
          </div>
        )}

        {/* Continue */}
        <button onClick={handleContinue} disabled={isSaving}
          className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-glow-blue text-base">
          {isSaving ? 'Saving...' : 'Save Tone & Continue ?'}
        </button>
      </div>
    </OnboardingLayout>
  );
};

export default Step2Tone;
