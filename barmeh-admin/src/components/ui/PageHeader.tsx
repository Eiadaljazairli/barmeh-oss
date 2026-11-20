"use client";

import Link from 'next/link';
import { ChevronLeft, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  count?: number | string;
  className?: string;
}

export default function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  breadcrumbs,
  actions,
  count,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-8 lg:mb-10', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 mb-3 flex-wrap"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${idx}`} className="flex items-center gap-1">
                {idx > 0 && (
                  <ChevronLeft
                    size={12}
                    strokeWidth={2.5}
                    className="text-slate-500/60 shrink-0"
                  />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-gold transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast
                        ? 'text-foreground/80'
                        : 'text-slate-400',
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="flex items-center gap-2 text-xs lg:text-sm text-gold font-bold mb-2">
              {EyebrowIcon && <EyebrowIcon size={14} strokeWidth={2.5} />}
              <span>{eyebrow}</span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
              {title}
            </h1>
            {count !== undefined && count !== null && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold/10 text-gold border border-gold/20">
                {count}
              </span>
            )}
          </div>

          {description && (
            <p className="mt-2 text-sm lg:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
