'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/lib/usePersistence';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function GreetingWidget() {
  const [userName] = useLocalStorage<string>('user-name', '');
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const greeting = getGreeting();
  const fullText = userName
    ? `${greeting}, ${userName}.`
    : `${greeting}.`;
  const dateStr = getFormattedDate();

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
        setShowCursor(false);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <GlassCard className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {displayedText}
          {showCursor && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="ml-0.5 inline-block h-8 w-[3px] bg-emerald-500 align-text-bottom"
            />
          )}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{dateStr}</p>
        <div className="pointer-events-none absolute -inset-x-4 -inset-y-2 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 blur-2xl" />
      </motion.div>
    </GlassCard>
  );
}
