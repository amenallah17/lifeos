'use client';

import { motion } from 'framer-motion';
import { PlusCircle, Play, FileText, Save } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useStore } from '@/lib/store';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function QuickActionsWidget() {
  const setQuickCaptureOpen = useStore((s) => s.setQuickCaptureOpen);
  const setPomodoroRunning = useStore((s) => s.setPomodoroRunning);
  const setActiveSection = useStore((s) => s.setActiveSection);

  const actions: QuickAction[] = [
    {
      label: 'New Task',
      icon: <PlusCircle size={20} />,
      action: () => setQuickCaptureOpen(true),
    },
    {
      label: 'Start Focus',
      icon: <Play size={20} />,
      action: () => setPomodoroRunning(true),
    },
    {
      label: 'Add Note',
      icon: <FileText size={20} />,
      action: () => setActiveSection('pocket'),
    },
    {
      label: 'Quick Save',
      icon: <Save size={20} />,
      action: () => setQuickCaptureOpen(true),
    },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Quick Actions
      </h3>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        {actions.map((a) => (
          <motion.button
            key={a.label}
            variants={itemVariants}
            whileHover={{ scale: 1.03, borderColor: 'rgba(16, 185, 129, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={a.action}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-200/60 bg-white/60 px-4 py-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="text-emerald-500">{a.icon}</span>
            <span>{a.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </GlassCard>
  );
}
