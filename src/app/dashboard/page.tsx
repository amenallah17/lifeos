'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import GreetingWidget from '@/components/dashboard/GreetingWidget';
import ClockWidget from '@/components/dashboard/ClockWidget';
import StatsWidget from '@/components/dashboard/StatsWidget';
import QuickActionsWidget from '@/components/dashboard/QuickActionsWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import DailyFocusWidget from '@/components/dashboard/DailyFocusWidget';
import StudyTrackerWidget from '@/components/dashboard/StudyTrackerWidget';
import QuoteWidget from '@/components/dashboard/QuoteWidget';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-400 shadow-lg shadow-emerald-500/30" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <Sparkles size={18} className="text-emerald-500/60" />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GreetingWidget />
          </div>
          <ClockWidget />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsWidget />
          <QuickActionsWidget />
          <DailyFocusWidget />
          <StudyTrackerWidget />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivityWidget />
          </div>
          <QuoteWidget />
        </motion.div>
      </motion.div>
    </div>
  );
}
