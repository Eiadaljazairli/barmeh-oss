"use client";

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  className?: string;
  align?: 'start' | 'center' | 'end';
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: {
    title: string;
    description?: string;
    action?: ReactNode;
  };
  onRowClick?: (row: T) => void;
  skeletonRows?: number;
  className?: string;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

const ALIGN: Record<NonNullable<Column<unknown>['align']>, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
};

export default function DataTable<T>({
  data,
  columns,
  rowKey,
  loading,
  error,
  onRetry,
  empty,
  onRowClick,
  skeletonRows = 6,
  className,
  defaultSort,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(defaultSort ?? null);

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp: number;
      if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
      else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), 'ar');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [data, sort, columns]);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!loading && data.length === 0 && empty) {
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card overflow-hidden shadow-sm',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead className="bg-slate-50 dark:bg-primary-light/10 border-b border-border">
            <tr>
              {columns.map((col) => {
                const sortable = !!col.sortValue;
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400',
                      ALIGN[col.align ?? 'start'],
                      col.hideOnMobile && 'hidden md:table-cell',
                      col.className,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          'inline-flex items-center gap-1 hover:text-gold transition-colors',
                          isSorted && 'text-gold',
                        )}
                      >
                        <span>{col.header}</span>
                        <span className="flex flex-col -my-1 leading-none">
                          <ChevronUp
                            size={10}
                            strokeWidth={3}
                            className={cn(
                              'transition-opacity',
                              isSorted && sort?.dir === 'asc'
                                ? 'opacity-100'
                                : 'opacity-30',
                            )}
                          />
                          <ChevronDown
                            size={10}
                            strokeWidth={3}
                            className={cn(
                              '-mt-0.5 transition-opacity',
                              isSorted && sort?.dir === 'desc'
                                ? 'opacity-100'
                                : 'opacity-30',
                            )}
                          />
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          'px-4 py-4',
                          c.hideOnMobile && 'hidden md:table-cell',
                        )}
                      >
                        <div className="h-4 rounded skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              : sortedData.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      'group transition-colors',
                      onRowClick &&
                        'cursor-pointer hover:bg-slate-50 dark:hover:bg-primary-light/10 focus:bg-gold/5 focus:outline-none',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3.5 text-foreground/90 align-middle',
                          ALIGN[col.align ?? 'start'],
                          col.hideOnMobile && 'hidden md:table-cell',
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
