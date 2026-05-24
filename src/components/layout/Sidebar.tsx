'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  Timer,
  CheckSquare,
  Target,
  FolderKanban,
  Video,
  Bookmark,
  Library,
  Globe,
  ChevronLeft,
  ChevronRight,
  Settings,
  Moon,
  Sun,
  Sparkles,
  Monitor,
  GraduationCap,
  FolderTree,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import type { PageSection } from '@/types';

interface NavItem {
  id: PageSection;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, shortcut: '⌘1', path: '/dashboard' },
  { id: 'study', label: 'Study', icon: <BookOpen size={20} />, shortcut: '⌘2', path: '/study' },
  { id: 'flashcards', label: 'Flashcards', icon: <BrainCircuit size={20} />, shortcut: '⌘3', path: '/flashcards' },
  { id: 'courses', label: 'Courses', icon: <GraduationCap size={20} />, shortcut: '⌘⇧1', path: '/courses' },
  { id: 'files', label: 'Files', icon: <FolderTree size={20} />, shortcut: '⌘⇧2', path: '/files' },
  { id: 'productivity', label: 'Productivity', icon: <Timer size={20} />, shortcut: '⌘4', path: '/productivity' },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} />, shortcut: '⌘5', path: '/tasks' },
  { id: 'goals', label: 'Goals', icon: <Target size={20} />, shortcut: '⌘6', path: '/goals' },
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={20} />, shortcut: '⌘7', path: '/projects' },
  { id: 'apps', label: 'Apps & Websites', icon: <Monitor size={20} />, shortcut: '⌘⇧3', path: '/apps' },
  { id: 'videos', label: 'Videos', icon: <Video size={20} />, shortcut: '⌘8', path: '/videos' },
  { id: 'pocket', label: 'Pocket', icon: <Bookmark size={20} />, shortcut: '⌘9', path: '/pocket' },
  { id: 'books', label: 'Books', icon: <Library size={20} />, shortcut: '⌘0', path: '/books' },
  { id: 'websites', label: 'Links', icon: <Globe size={20} />, shortcut: '⌘-', path: '/websites' },
  { id: 'admin', label: 'Admin', icon: <Shield size={20} />, shortcut: '', path: '/admin' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, shortcut: '⌘,', path: '/settings' },
];

const sidebarVariants = {
  expanded: { width: 260, transition: { duration: 0.3, ease: 'easeInOut' } },
  collapsed: { width: 68, transition: { duration: 0.3, ease: 'easeInOut' } },
};

const itemVariants = {
  expanded: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  collapsed: { opacity: 0, x: -10, transition: { duration: 0.15, ease: 'easeIn' } },
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const setActiveSection = useStore((s) => s.setActiveSection);
  const sidebarExpanded = useStore((s) => s.sidebarExpanded);
  const setSidebarExpanded = useStore((s) => s.setSidebarExpanded);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  // Determine active section from URL
  const activeSection = navItems.find((item) => item.path === pathname)?.id ?? 'dashboard';

  function handleNavigate(item: NavItem) {
    setActiveSection(item.id);
    router.push(item.path);
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarExpanded(false)}
          />
        )}
      </AnimatePresence>

    <motion.aside
      variants={sidebarVariants}
      animate={sidebarExpanded ? 'expanded' : 'collapsed'}
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col backdrop-blur-xl bg-black/60 border-r border-white/10 ${
        sidebarExpanded ? '' : 'md:block hidden'
      }`}
    >
      {/* Logo */}
      <div className="flex h-12 items-center justify-center gap-3 border-b border-white/10 px-4">
        <motion.div
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles size={18} />
        </motion.div>
        <AnimatePresence>
          {sidebarExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="text-lg font-bold tracking-tight text-white"
            >
              LifeOS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin scrollbar-thumb-white/10">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <motion.button
                  onClick={() => handleNavigate(item)}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-white/10 border border-white/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute -inset-1 rounded-xl bg-white/5 blur-md" />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <span className={`shrink-0 ${isActive ? 'text-white' : ''}`}>
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {sidebarExpanded && (
                        <motion.span
                          variants={itemVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          className="relative z-10 flex-1 text-left"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  {sidebarExpanded && isActive && (
                    <span className="relative z-10 ml-auto text-[10px] font-medium text-white/30">
                      {item.shortcut}
                    </span>
                  )}
                  {sidebarExpanded && !isActive && (
                    <span className="relative z-10 ml-auto text-[10px] font-medium text-white/20">
                      {item.shortcut}
                    </span>
                  )}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-white/10 p-3">
        <div className="flex flex-col gap-2">
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </motion.button>
        </div>
      </div>
    </motion.aside>
    </>
  );
}
