"use client";

import React from 'react';
import {
  Users,
  Tag,
  AlertTriangle,
  Headset,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  users: string;
  listings: string;
  reports: string;
  tickets: string;
  deltas?: {
    users?: number;
    listings?: number;
    reports?: number;
    tickets?: number;
  };
  loading?: boolean;
}

interface StatDef {
  key: 'users' | 'listings' | 'reports' | 'tickets';
  label: string;
  value: string;
  icon: typeof Users;
  severity: 'neutral' | 'warning' | 'danger';
}

function Delta({ value }: { value?: number }) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;

  const isUp = value > 0;
  const isDown = value < 0;
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const cls = isUp
    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
    : isDown
    ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'
    : 'text-slate-500 bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold ${cls}`}
      dir="ltr"
    >
      <Icon size={12} strokeWidth={2.5} />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function DashboardStats({
  users,
  listings,
  reports,
  tickets,
  deltas,
  loading,
}: Props) {
  const stats: StatDef[] = [
    { key: 'users', label: 'إجمالي المستخدمين', value: users, icon: Users, severity: 'neutral' },
    { key: 'listings', label: 'الإعلانات النشطة', value: listings, icon: Tag, severity: 'neutral' },
    { key: 'reports', label: 'بلاغات قيد المعالجة', value: reports, icon: AlertTriangle, severity: 'danger' },
    { key: 'tickets', label: 'تذاكر دعم مفتوحة', value: tickets, icon: Headset, severity: 'warning' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const delta = deltas?.[stat.key];

        const accentRing =
          stat.severity === 'danger'
            ? 'group-hover:border-rose-300 dark:group-hover:border-rose-700'
            : stat.severity === 'warning'
            ? 'group-hover:border-amber-300 dark:group-hover:border-amber-700'
            : 'group-hover:border-gold/60';

        const iconWrap =
          stat.severity === 'danger'
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
            : stat.severity === 'warning'
            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
            : 'bg-gold/10 text-gold-700 dark:text-gold';

        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
            className={`group relative bg-card border border-border rounded-2xl p-5 lg:p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30 ${accentRing}`}
          >
            <div className="flex items-start justify-between mb-5">
              <div
                className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center ${iconWrap} transition-transform group-hover:scale-105`}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
              <Delta value={delta} />
            </div>

            <div>
              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">
                {stat.label}
              </p>
              {loading ? (
                <div className="h-9 w-20 rounded-md skeleton" />
              ) : (
                <h3
                  className="text-3xl lg:text-4xl font-extrabold text-primary tracking-tight tabular-nums"
                  dir="ltr"
                >
                  {stat.value}
                </h3>
              )}
            </div>

            <div
              aria-hidden
              className={`absolute bottom-0 inset-x-5 lg:inset-x-6 h-px rounded-full ${
                stat.severity === 'danger'
                  ? 'bg-rose-500/20'
                  : stat.severity === 'warning'
                  ? 'bg-amber-500/20'
                  : 'bg-gold/30'
              }`}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
