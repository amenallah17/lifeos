'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressBar({ value, label, showPercentage = false, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-sm text-white/70">{label}</span>}
          {showPercentage && <span className="text-xs text-white/50">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
