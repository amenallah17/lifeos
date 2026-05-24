'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('lifeos-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('lifeos-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <motion.button
      onClick={toggle}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      animate={{ rotate: theme === 'dark' ? 0 : 180 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </motion.button>
  );
}
