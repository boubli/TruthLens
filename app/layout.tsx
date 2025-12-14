/**
 * TruthLens Application
 * Developed by Youssef Boubli
 */
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { CompareProvider } from '@/context/CompareContext';
import CompareFloatingBar from '@/components/compare/CompareFloatingBar';

import { getSystemSettings } from '@/services/systemService';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit'
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  const branding = settings.branding || {};

  return {
    title: 'TruthLens',
    description: 'AI-powered product analysis and recommendations',
    // manifest: '/manifest.webmanifest', // Next.js automatically adds this for app/manifest.ts
    icons: {
      icon: branding.faviconUrl || '/favicon.ico',
      apple: branding.appleTouchIconUrl || '/apple-touch-icon.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'TruthLens',
    },
  };
}

export const viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import SpecialWelcome from '@/components/SpecialWelcome';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import SeasonalEventManager from '@/components/events/SeasonalEventManager';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <CompareProvider>
            <ThemeProvider>
              <SpecialWelcome />
              <SeasonalEventManager />
              <InstallPrompt />
              {children}
              <CompareFloatingBar />
            </ThemeProvider>
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
