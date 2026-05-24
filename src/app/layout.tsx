import { ReactNode } from 'react';
import './globals.css';
import MainLayout from '@/components/layout/MainLayout';
import QuickCapture from '@/components/layout/QuickCapture';
import CommandPalette from '@/components/layout/CommandPalette';
import { Toaster } from 'sonner';
import ClientInit from '@/components/layout/ClientInit';
import ClientAuthProvider from '@/components/layout/ClientAuthProvider';
import PwaRegister from '@/components/layout/PwaRegister';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata = {
  title: 'LifeOS',
  description: 'Premium Personal Productivity Desktop Application',
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'LifeOS',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LifeOS" />
      </head>
      <body className="min-h-screen antialiased">
        <ErrorBoundary>
          <ClientAuthProvider>
            <ClientInit />
            <PwaRegister />
            <MainLayout>
              {children}
            </MainLayout>
            <QuickCapture />
            <CommandPalette />
          </ClientAuthProvider>
        </ErrorBoundary>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
