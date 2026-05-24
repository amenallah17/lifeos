'use client';

interface DividerProps {
  className?: string;
}

export default function Divider({ className = '' }: DividerProps) {
  return (
    <div className={`h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent ${className}`} />
  );
}
