"use client";

import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

export type StatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'gold';

const TONE_STYLES: Record<StatusTone, string> = {
  success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  gold: 'bg-gold/10 text-gold border-gold/20',
};

interface StatusBadgeProps {
  tone?: StatusTone;
  icon?: LucideIcon;
  label: string;
  dense?: boolean;
  className?: string;
}

export default function StatusBadge({
  tone = 'neutral',
  icon: Icon,
  label,
  dense = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold border rounded-full',
        dense ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        TONE_STYLES[tone],
        className,
      )}
    >
      {Icon && <Icon size={dense ? 10 : 12} strokeWidth={2.5} />}
      <span>{label}</span>
    </span>
  );
}
