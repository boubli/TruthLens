/**
 * TruthLens Application
 * Developed by Youssef Boubli
 */
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { CompareProvider } from '@/context/CompareContext';
import CompareFloatingBar from '@/components/compare/CompareFloatingBar';

import { getSystemSettings } from '@/services/systemService';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  const branding = settings.branding || {};

  return {
    title: 'TruthLens',
    description: 'AI-powered product analysis and recommendations',
    manifest: '/manifest.webmanifest', // Next.js automatically serves manifest.ts here
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <CompareProvider>
            <ThemeProvider>
              <SpecialWelcome />
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
