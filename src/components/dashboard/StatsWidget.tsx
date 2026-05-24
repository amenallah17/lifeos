'use client';

import { useLocalStorage } from '@/lib/usePersistence';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, FolderOpen, FileText, BookOpen } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { Task, Project, Note, StudySession } from '@/types';

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
}

function AnimatedCounter({ to, suffix }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 800;
    const step = Math.max(1, Math.floor(to / 30));
    const interval = setInterval(() => {
      start += step;
      if (start >= to) {
        setCount(to);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, duration / (to / step));
    return () => clearInterval(interval);
  }, [inView, to]);

  return (
      <span ref={ref} className="text-2xl font-bold text-gray-900">
        {count}
        {suffix && <span className="ml-1 text-sm font-normal text-gray-400">{suffix}</span>}
    </span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function StatsWidget() {
  const [tasks] = useLocalStorage<Task[]>('kanban-tasks', []);
  const [projects] = useLocalStorage<Project[]>('lifeos-projects', []);
  const [notes] = useLocalStorage<Note[]>('study-notes', []);
  const [sessions] = useLocalStorage<StudySession[]>('study-sessions', []);

  const stats: StatItem[] = [
    { label: 'Total Tasks', value: tasks.length, icon: <CheckCircle size={18} /> },
    { label: 'Projects', value: projects.length, icon: <FolderOpen size={18} /> },
    { label: 'Notes', value: notes.length, icon: <FileText size={18} /> },
    { label: 'Study Sessions', value: sessions.length, icon: <BookOpen size={18} /> },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Overview
      </h3>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} className="space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400">
              {stat.icon}
              <span className="text-xs">{stat.label}</span>
            </div>
            <AnimatedCounter to={stat.value} suffix={stat.suffix} />
          </motion.div>
        ))}
      </motion.div>
    </GlassCard>
  );
}
