'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function getTimeString(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ClockWidget() {
  const [time, setTime] = useState(getTimeString);
  const [date, setDate] = useState(getDateString);

  useEffect(() => {
    setTime(getTimeString());
    setDate(getDateString());
    const id = setInterval(() => {
      setTime(getTimeString());
      setDate(getDateString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <GlassCard className="p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <span className="font-mono text-5xl font-light tracking-[0.15em] text-gray-900">
          {time}
        </span>
        <span className="mt-2 text-sm text-gray-500">{date}</span>
      </motion.div>
    </GlassCard>
  );
}
