"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ConfirmTone = 'danger' | 'primary' | 'warning';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const TONE_STYLES: Record<ConfirmTone, { btn: string; icon: string; iconBg: string }> = {
  danger: {
    btn: 'bg-rose-500 hover:bg-rose-600 text-white',
    icon: 'text-rose-500',
    iconBg: 'bg-rose-500/10 border-rose-500/20',
  },
  warning: {
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
    icon: 'text-amber-500',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
  },
  primary: {
    btn: 'bg-gold hover:opacity-90 text-primary',
    icon: 'text-gold',
    iconBg: 'bg-gold/10 border-gold/20',
  },
};

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  tone = 'danger',
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    cancelBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  const handleConfirm = async () => {
    try {
      setBusy(true);
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const styles = TONE_STYLES[tone];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !busy && onCancel()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 p-6">
              <div
                className={cn(
                  'w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center',
                  styles.iconBg,
                )}
              >
                <AlertTriangle size={20} strokeWidth={2.2} className={styles.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  id="confirm-title"
                  className="text-base font-bold text-foreground"
                >
                  {title}
                </h3>
                {description && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={() => !busy && onCancel()}
                className="text-slate-400 hover:text-foreground transition-colors p-1 -m-1 rounded-md"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-2">
              <button
                ref={cancelBtnRef}
                onClick={onCancel}
                disabled={busy}
                className={cn(
                  'px-4 py-2 rounded-xl font-bold text-sm',
                  'border border-border bg-card hover:bg-slate-50 dark:hover:bg-primary-light/10',
                  'transition-colors disabled:opacity-50',
                )}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className={cn(
                  'px-4 py-2 rounded-xl font-bold text-sm transition-all',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'inline-flex items-center gap-2',
                  styles.btn,
                )}
              >
                {busy && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                <span>{confirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useConfirm() {
  const [state, setState] = useState<
    | (ConfirmOptions & { resolve: (v: boolean) => void; open: true })
    | { open: false }
  >({ open: false });

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, open: true, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.open) {
      state.resolve(true);
      setState({ open: false });
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    if (state.open) {
      state.resolve(false);
      setState({ open: false });
    }
  }, [state]);

  const dialog = state.open ? (
    <ConfirmDialog
      open
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      tone={state.tone}
    />
  ) : null;

  return { confirm, dialog };
}
