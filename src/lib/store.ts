'use client';

import { create } from 'zustand';
import type { PageSection } from '@/types';

interface AppState {
  activeSection: PageSection;
  setActiveSection: (section: PageSection) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  quickCaptureOpen: boolean;
  setQuickCaptureOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  pomodoroRunning: boolean;
  setPomodoroRunning: (running: boolean) => void;
  pomodoroTime: number;
  setPomodoroTime: (time: number) => void;
  pomodoroType: 'focus' | 'short-break' | 'long-break';
  setPomodoroType: (type: 'focus' | 'short-break' | 'long-break') => void;
}

export const useStore = create<AppState>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),
  sidebarExpanded: true,
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  quickCaptureOpen: false,
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  pomodoroRunning: false,
  setPomodoroRunning: (running) => set({ pomodoroRunning: running }),
  pomodoroTime: 25 * 60,
  setPomodoroTime: (time) => set({ pomodoroTime: time }),
  pomodoroType: 'focus',
  setPomodoroType: (type) => set({ pomodoroType: type }),
}));
