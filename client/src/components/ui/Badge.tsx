import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'urgent' | 'high' | 'medium' | 'low' | 'success' | 'outline';
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const base = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    urgent: 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    high: 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    medium: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    outline: 'border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 leading-none',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], sizes[size], className))}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toUpperCase();
  switch (p) {
    case 'URGENT':
      return <Badge variant="urgent">⚡ Urgent</Badge>;
    case 'HIGH':
      return <Badge variant="high">High</Badge>;
    case 'MEDIUM':
      return <Badge variant="medium">Medium</Badge>;
    case 'LOW':
      return <Badge variant="low">Low</Badge>;
    default:
      return <Badge variant="default">{priority}</Badge>;
  }
}
