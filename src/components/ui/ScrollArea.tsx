'use client';

import { ReactNode } from 'react';

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export default function ScrollArea({ children, className = '' }: ScrollAreaProps) {
  return (
    <div
      className={`overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 ${className}`}
    >
      {children}
    </div>
  );
}
