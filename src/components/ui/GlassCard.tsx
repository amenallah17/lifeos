'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  hover: { y: -4, transition: { duration: 0.3, ease: 'easeOut' } },
  tap: { scale: 0.98 },
};

export default function GlassCard({ children, className = '', hover = false, glow = false, onClick }: GlassCardProps) {
  const baseClass = `relative box-border overflow-hidden rounded-2xl backdrop-blur-xl bg-black/15 border border-white/10 shadow-lg ${glow ? 'shadow-black/10' : ''} ${hover ? 'cursor-pointer' : ''} ${className}`;

  const glowLayer = glow && (
    <div className="pointer-events-none absolute -inset-px rounded-2xl bg-white/5 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
  );

  if (onClick) {
    return (
      <motion.button
        onClick={onClick}
        className={baseClass}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover={hover ? 'hover' : undefined}
        whileTap="tap"
      >
        {glowLayer}
        {children}
      </motion.button>
    );
  }

  return (
    <motion.div
      className={baseClass}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={hover ? 'hover' : undefined}
    >
      {glowLayer}
      {children}
    </motion.div>
  );
}
