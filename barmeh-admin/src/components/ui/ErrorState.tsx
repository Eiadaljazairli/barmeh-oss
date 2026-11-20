"use client";

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'تعذّر تحميل البيانات',
  message = 'حدث خطأ غير متوقع. حاول مرة أخرى بعد قليل أو أعد التحميل.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-14 px-6 rounded-2xl border border-rose-500/20 bg-rose-500/5',
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
        <AlertTriangle size={26} strokeWidth={2} className="text-rose-500" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md mb-5">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors"
        >
          <RefreshCw size={14} strokeWidth={2.5} />
          <span>إعادة المحاولة</span>
        </button>
      )}
    </div>
  );
}
