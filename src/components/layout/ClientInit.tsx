'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

// Handles client-only initialization that can't be in the root Server Component layout
export default function ClientInit() {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    document.title = 'LifeOS';
  }, []);

  // Periodically persist localStorage to disk (Electron only)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    const interval = setInterval(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) data[key] = localStorage.getItem(key) || '';
      }
      window.electronAPI?.storageSave(data);
    }, 5000);

    const handleUnload = () => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) data[key] = localStorage.getItem(key) || '';
      }
      window.electronAPI?.storageSave(data);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  useEffect(() => {
    // Register Electron keyboard shortcuts
    if (typeof window !== 'undefined' && window.electronAPI) {
      const unsubCmd = window.electronAPI.onToggleCommandPalette(() => {
        useStore.getState().setCommandPaletteOpen(true);
      });
      const unsubCapture = window.electronAPI.onToggleQuickCapture(() => {
        useStore.getState().setQuickCaptureOpen(true);
      });
      return () => {
        unsubCmd?.();
        unsubCapture?.();
      };
    }
  }, []);

  useEffect(() => {
    // Apply theme class to body
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}
