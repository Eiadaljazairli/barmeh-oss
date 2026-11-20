"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-gold text-primary hover:opacity-90 disabled:opacity-50',
  secondary:
    'bg-card border border-border text-foreground hover:bg-slate-50 dark:hover:bg-primary-light/10',
  ghost: 'text-foreground hover:bg-slate-100 dark:hover:bg-primary-light/10',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50',
  outline:
    'bg-transparent border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold',
};

const SIZE: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-3 text-base gap-2 rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    loading,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-bold transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
        'disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className={cn(
            'border-2 border-current/30 border-t-current rounded-full animate-spin',
            size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
          )}
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export default Button;
