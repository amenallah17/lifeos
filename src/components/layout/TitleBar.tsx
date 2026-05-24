'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { PageSection } from '@/types';

const sectionTitles: Record<PageSection, string> = {
  dashboard: 'Dashboard',
  study: 'Study',
  flashcards: 'Flashcards',
  courses: 'Courses',
  files: 'Files',
  productivity: 'Productivity',
  tasks: 'Tasks',
  goals: 'Goals',
  projects: 'Projects',
  apps: 'Apps & Websites',
  videos: 'Videos',
  pocket: 'Pocket',
  books: 'Books',
  websites: 'Links',
  settings: 'Settings',
  admin: 'Administration',
};

export default function TitleBar() {
  const pathname = usePathname();
  const toggleSidebar = useStore((s) => s.setSidebarExpanded);
  const sidebarExpanded = useStore((s) => s.sidebarExpanded);
  const section = (pathname?.replace('/', '') || 'dashboard') as PageSection;
  const title = sectionTitles[section] ?? 'LifeOS';

  return (
    <header className="flex h-12 shrink-0 items-center backdrop-blur-xl bg-black/20 border-b border-white/10">
      {/* Mobile hamburger */}
      <button
        onClick={() => toggleSidebar(!sidebarExpanded)}
        className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Section title */}
      <div className="flex-1 text-center">
        <span className="text-sm font-medium tracking-wide text-white/70">
          {title}
        </span>
      </div>
    </header>
  );
}
