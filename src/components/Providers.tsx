'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import { CookieConsentBanner } from './CookieConsentBanner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WorkspaceProvider>
          {children}
          <CookieConsentBanner />
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
