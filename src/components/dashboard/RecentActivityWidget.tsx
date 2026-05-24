'use client';

import { useLocalStorage } from '@/lib/usePersistence';
import { motion } from 'framer-motion';
import { CheckCircle, FileText, BookOpen, Inbox } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { Task, StudySession } from '@/types';

interface Activity {
  id: string;
  type: 'task' | 'note' | 'study';
  title: string;
  timestamp: Date;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const iconMap = {
  task: <CheckCircle size={14} className="text-emerald-400" />,
  note: <FileText size={14} className="text-sky-400" />,
  study: <BookOpen size={14} className="text-amber-400" />,
};

const dotColors = {
  task: 'bg-emerald-400',
  note: 'bg-sky-400',
  study: 'bg-amber-400',
};

export default function RecentActivityWidget() {
  const [tasks] = useLocalStorage<Task[]>('kanban-tasks', []);
  const [sessions] = useLocalStorage<StudySession[]>('study-sessions', []);

  const activities: Activity[] = [
    ...tasks.map((t) => ({
      id: t.id,
      type: 'task' as const,
      title: t.title,
      timestamp: new Date(t.created_at),
    })),
    ...sessions.map((s) => ({
      id: s.id,
      type: 'study' as const,
      title: `Study session (${Math.floor(s.duration / 60)}h ${s.duration % 60}m)`,
      timestamp: new Date(s.date),
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Recent Activity
      </h3>
      {activities.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
          <Inbox size={32} />
          <p className="text-sm">No recent activity yet.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-h-64 space-y-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200/60"
        >
          {activities.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="group relative flex items-start gap-3 border-l-2 border-gray-200/60 pb-4 pl-4 last:pb-0"
            >
              <span
                className={`absolute left-[-5px] mt-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-gray-100 ${dotColors[act.type]}`}
              />
              <div className="flex flex-1 items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="mt-0.5 shrink-0">{iconMap[act.type]}</span>
                  <span className="text-sm text-gray-600">{act.title}</span>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{relativeTime(act.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </GlassCard>
  );
}
