'use client';

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}

const variantClasses = {
  default: 'bg-black/10 text-black/80',
  success: 'bg-black/10 text-black border-black/20',
  warning: 'bg-amber-500/20 text-black border-amber-500/30',
  danger: 'bg-red-500/20 text-black border-red-500/30',
  info: 'bg-sky-500/20 text-black border-sky-500/30',
  outline: 'bg-transparent text-black/70 border-white/30',
};

export default function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
