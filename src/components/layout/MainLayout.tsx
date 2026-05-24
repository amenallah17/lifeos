'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';
import AuthGuard from './AuthGuard';
import { useStore } from '@/lib/store';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const sidebarExpanded = useStore((s) => s.sidebarExpanded);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  const isPublic = pathname === '/' || pathname.startsWith('/auth/');

  useEffect(() => {
    const saved = localStorage.getItem('lifeos-theme') as 'dark' | 'light' | null;
    if (saved && saved !== theme) setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('lifeos-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <div className="flex h-screen w-full overflow-hidden m-0 p-0 text-black">
        <Sidebar />
        <main
          className={`flex min-w-0 flex-1 flex-col ${
            sidebarExpanded ? 'ml-[260px] md:ml-[260px]' : 'ml-0 md:ml-[68px]'
          }`}
        >
          <TitleBar />
          <div className="min-w-0 flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
