'use client';

import { useLocalStorage } from '@/lib/usePersistence';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Calendar } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { StudySession } from '@/types';

function isThisWeek(dateStr: string): boolean {
  const now = new Date();
  const d = new Date(dateStr);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

interface SubjectSummary {
  name: string;
  minutes: number;
}

export default function StudyTrackerWidget() {
  const [sessions] = useLocalStorage<StudySession[]>('study-sessions', []);

  const weeklySessions = sessions.filter((s) => isThisWeek(s.date));
  const todaySessions = sessions.filter((s) => isToday(s.date));
  const totalMinutes = weeklySessions.reduce((sum, s) => sum + s.duration, 0);
  const weeklyCount = weeklySessions.length;

  const subjectMap = new Map<string, number>();
  weeklySessions.forEach((s) => {
    const name = s.subject_id || 'General';
    subjectMap.set(name, (subjectMap.get(name) || 0) + s.duration);
  });
  const subjects: SubjectSummary[] = Array.from(subjectMap.entries())
    .map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  const maxMinutes = Math.max(...subjects.map((s) => s.minutes), 1);

  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Study Tracker
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-lg bg-white/60 p-3">
          <Calendar size={16} className="mb-1 text-amber-400" />
          <span className="text-lg font-bold text-gray-900">{weeklyCount}</span>
          <span className="text-xs text-gray-400">This Week</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-white/60 p-3">
          <Clock size={16} className="mb-1 text-cyan-400" />
          <span className="text-lg font-bold text-gray-900">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </span>
          <span className="text-xs text-gray-400">Total</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-white/60 p-3">
          <BookOpen size={16} className="mb-1 text-emerald-400" />
          <span className="text-lg font-bold text-gray-900">{todaySessions.length}</span>
          <span className="text-xs text-gray-400">Today</span>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            By Subject
          </p>
          {subjects.map((sub) => (
            <div key={sub.name} className="flex items-center gap-3">
              <span className="w-24 truncate text-xs text-gray-500">{sub.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200/60">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(sub.minutes / maxMinutes) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <span className="w-10 text-right text-xs text-gray-400">{sub.minutes}m</span>
            </div>
          ))}
        </div>
      )}

      {subjects.length === 0 && (
        <p className="mt-4 text-center text-xs text-gray-400">No study sessions this week.</p>
      )}
    </GlassCard>
  );
}
