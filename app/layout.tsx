import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { CompareProvider } from '@/context/CompareContext';
import CompareFloatingBar from '@/components/compare/CompareFloatingBar';

export const metadata: Metadata = {
  title: 'TruthLens',
  description: 'AI-powered product analysis and recommendations',
  // manifest: '/manifest.json', // Temporarily disabled to remove PWA warnings
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TruthLens',
  },
};

export const viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import SpecialWelcome from '@/components/SpecialWelcome';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <CompareProvider>
            <ThemeProvider>
              <SpecialWelcome />
              {children}
              <CompareFloatingBar />
            </ThemeProvider>
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
