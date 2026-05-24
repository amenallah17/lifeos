'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Sun,
  Moon,
  Zap,
  Command,
  Search,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import type { PageSection } from '@/types';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
};

export default function CommandPalette() {
  const commandPaletteOpen = useStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen);
  const setActiveSection = useStore((s) => s.setActiveSection);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const setQuickCaptureOpen = useStore((s) => s.setQuickCaptureOpen);
  const setPomodoroRunning = useStore((s) => s.setPomodoroRunning);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function navigate(section: PageSection, path: string) {
    setActiveSection(section);
    router.push(path);
    setCommandPaletteOpen(false);
  }

  const commands: Command[] = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard size={16} />, category: 'Navigation', action: () => navigate('dashboard', '/dashboard') },
    { id: 'nav-study', label: 'Go to Study', icon: <BookOpen size={16} />, category: 'Navigation', action: () => navigate('study', '/study') },
    { id: 'nav-flashcards', label: 'Go to Flashcards', icon: <BrainCircuit size={16} />, category: 'Navigation', action: () => navigate('flashcards', '/flashcards') },
    { id: 'nav-productivity', label: 'Go to Productivity', icon: <Timer size={16} />, category: 'Navigation', action: () => navigate('productivity', '/productivity') },
    { id: 'nav-tasks', label: 'Go to Tasks', icon: <CheckSquare size={16} />, category: 'Navigation', action: () => navigate('tasks', '/tasks') },
    { id: 'nav-goals', label: 'Go to Goals', icon: <Target size={16} />, category: 'Navigation', action: () => navigate('goals', '/goals') },
    { id: 'nav-projects', label: 'Go to Projects', icon: <FolderKanban size={16} />, category: 'Navigation', action: () => navigate('projects', '/projects') },
    { id: 'nav-videos', label: 'Go to Videos', icon: <Video size={16} />, category: 'Navigation', action: () => navigate('videos', '/videos') },
    { id: 'nav-pocket', label: 'Go to Pocket', icon: <Bookmark size={16} />, category: 'Navigation', action: () => navigate('pocket', '/pocket') },
    { id: 'nav-books', label: 'Go to Books', icon: <Library size={16} />, category: 'Navigation', action: () => navigate('books', '/books') },
    { id: 'nav-websites', label: 'Go to Websites', icon: <Globe size={16} />, category: 'Navigation', action: () => navigate('websites', '/websites') },
    { id: 'theme-toggle', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`, icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />, category: 'Actions', action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); setCommandPaletteOpen(false); } },
    { id: 'quick-capture', label: 'Quick capture', icon: <Zap size={16} />, category: 'Actions', action: () => { setQuickCaptureOpen(true); setCommandPaletteOpen(false); } },
    { id: 'pomodoro-start', label: 'Start Pomodoro focus session', icon: <Timer size={16} />, category: 'Actions', action: () => { setPomodoroRunning(true); setCommandPaletteOpen(false); } },
  ];

  const filteredCommands = query.trim()
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeSelected = useCallback(() => {
    if (filteredCommands.length === 0) return;
    filteredCommands[selectedIndex]?.action();
  }, [filteredCommands, selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, selectedIndex, executeSelected, setCommandPaletteOpen]);

  // Group by category
  const grouped = filteredCommands.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          key="command-palette-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/10 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Modal */}
          <motion.div
            key="command-palette-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg rounded-2xl backdrop-blur-xl bg-zinc-900/95 border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <Search size={18} className="shrink-0 text-white/40" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
              <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/40">
                <Command size={12} className="inline" /> K
              </kbd>
            </div>

            {/* Commands list */}
            <div className="max-h-[360px] overflow-y-auto p-2">
              {Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/30">
                    {category}
                  </div>
                  {cmds.map((cmd) => {
                    const currentIndex = globalIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <motion.button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-colors ${
                          isSelected
                            ? 'bg-white/10 text-white'
                            : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                        }`}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-white/40'}`}>
                          {cmd.icon}
                        </span>
                        <span className="flex-1">{cmd.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ))}
              {filteredCommands.length === 0 && (
                <div className="py-8 text-center text-sm text-white/30">
                  No commands found
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-white/10 px-5 py-3">
              <div className="flex items-center gap-4 text-[11px] text-white/30">
                <span><kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">↑↓</kbd> Navigate</span>
                <span><kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">↵</kbd> Select</span>
                <span><kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">Esc</kbd> Close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
