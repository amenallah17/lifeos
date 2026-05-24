'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface IconButtonProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-10 w-10 [&>svg]:h-5 [&>svg]:w-5',
  lg: 'h-12 w-12 [&>svg]:h-6 [&>svg]:w-6',
};

export default function IconButton({ children, size = 'md', className = '', onClick }: IconButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full backdrop-blur-xl bg-white/5 border border-white/10 text-white/70 transition-colors hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {children}
    </motion.button>
  );
}
