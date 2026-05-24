'use client';

import { useLocalStorage } from '@/lib/usePersistence';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Timer } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { PomodoroSession } from '@/types';

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DailyFocusWidget() {
  const [sessions] = useLocalStorage<PomodoroSession[]>('pomodoro-sessions', []);
  const goal = 60;

  const todayMinutes = sessions
    .filter((s) => isToday(s.date) && s.type === 'focus')
    .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);

  const current = Math.min(todayMinutes, goal);
  const progress = current / goal;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <GlassCard className="p-5">
      <div ref={ref}>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Daily Focus
        </h3>
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <svg width="140" height="140" className="-rotate-90">
              <circle
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke="rgba(229,231,235,0.6)"
                strokeWidth="8"
              />
              <motion.circle
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke="url(#focusGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={inView ? { strokeDashoffset: CIRCUMFERENCE * (1 - progress) } : {}}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <Timer size={20} className="text-emerald-500" />
              <span className="mt-1 text-xl font-bold text-gray-900">
                {Math.floor(current / 60)}h {current % 60}m
              </span>
              <span className="text-xs text-gray-400">of {Math.floor(goal / 60)}h</span>
            </div>
          </div>
          <span className="mt-2 text-sm text-gray-500">
            {Math.round(progress * 100)}% complete
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
