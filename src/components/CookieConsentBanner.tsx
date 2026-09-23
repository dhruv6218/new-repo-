'use client';

import { useEffect, useState } from 'react';

type ConsentChoice = 'analytics' | 'marketing';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/consent', { credentials: 'same-origin' })
      .then((response) => response.json())
      .then((data: { consent?: unknown }) => setVisible(!data.consent))
      .catch(() => setVisible(true));
  }, []);

  const save = async (choice: ConsentChoice, granted: boolean) => {
    const response = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ consentType: choice, granted }),
    });
    if (response.ok) setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[200] mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl" role="dialog" aria-label="Cookie preferences">
      <h2 className="font-heading text-base font-bold text-gray-900">Your privacy matters</h2>
      <p className="mt-1 text-sm text-gray-600">We use optional analytics and marketing cookies to improve Astrix. Essential cookies are always on.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={() => save('analytics', false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Reject optional</button>
        <button onClick={() => save('analytics', true)} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue">Accept analytics</button>
        <button onClick={async () => { await save('analytics', true); await save('marketing', true); }} className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Accept all</button>
      </div>
    </aside>
  );
}
