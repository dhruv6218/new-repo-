import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';
import { Analytics } from '../components/Analytics';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://astrixai.app'),
  title: 'Astrix AI — Autonomous B2B Revenue Recovery',
  description: 'Get your late B2B invoices paid automatically without the awkward follow-ups. AI-powered recovery for freelancers and agencies.',
  keywords: ['invoice recovery', 'B2B payments', 'AI invoicing', 'automated follow-up', 'Astrix AI'],
  applicationName: 'Astrix AI',
  generator: 'Next.js',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Astrix AI',
    title: 'Astrix AI — Autonomous B2B Revenue Recovery',
    description: 'Get your late B2B invoices paid automatically without the awkward follow-ups.',
    url: '/',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Astrix AI revenue recovery' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astrix AI — Autonomous B2B Revenue Recovery',
    description: 'Get your late B2B invoices paid automatically without the awkward follow-ups.',
    images: ['/og-image.svg'],
  },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
