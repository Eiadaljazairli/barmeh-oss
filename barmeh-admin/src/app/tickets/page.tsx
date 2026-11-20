"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Headset,
  MessageSquare,
  User,
  Calendar,
  Search,
} from 'lucide-react';
import { adminService } from '@/services/api';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  type Column,
} from '@/components/ui';

interface UserRef {
  id?: string;
  name?: string;
  phone?: string;
}

interface Ticket {
  id: string;
  subject: string;
  description?: string;
  status: 'OPEN' | 'CLOSED' | string;
  createdAt: string;
  user?: UserRef;
  messages?: Array<unknown>;
}

type Filter = 'all' | 'open' | 'closed';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const fetchData = async () => {
    try {
      setError(null);
      const response = await adminService.getSupportTickets();
      setTickets(response.data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('تعذّر جلب تذاكر الدعم. تأكد من الاتصال ثم أعد المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let arr = tickets;
    if (filter === 'open') arr = arr.filter((t) => t.status === 'OPEN');
    if (filter === 'closed') arr = arr.filter((t) => t.status === 'CLOSED');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (t) =>
          t.subject?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.user?.name?.toLowerCase().includes(q) ||
          t.user?.phone?.toLowerCase().includes(q),
      );
    }
    return arr;
  }, [tickets, filter, search]);

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const closedCount = tickets.filter((t) => t.status === 'CLOSED').length;

  const columns: Column<Ticket>[] = [
    {
      key: 'subject',
      header: 'الموضوع',
      sortValue: (t) => t.subject,
      cell: (t) => (
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
            <Headset size={16} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm truncate">
              {t.subject}
            </p>
            {t.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {t.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'المستخدم',
      hideOnMobile: true,
      sortValue: (t) => t.user?.name || t.user?.phone || '',
      cell: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <User size={12} />
          <span className="truncate">
            {t.user?.name || t.user?.phone || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'messages',
      header: 'الرسائل',
      hideOnMobile: true,
      align: 'center',
      sortValue: (t) => t.messages?.length ?? 0,
      cell: (t) => (
        <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
          <MessageSquare size={12} />
          <span>{t.messages?.length ?? 0}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'تاريخ',
      hideOnMobile: true,
      align: 'end',
      sortValue: (t) => new Date(t.createdAt),
      cell: (t) => (
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Calendar size={12} />
          <span>{new Date(t.createdAt).toLocaleDateString('ar-EG')}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      align: 'center',
      sortValue: (t) => t.status,
      cell: (t) =>
        t.status === 'OPEN' ? (
          <StatusBadge tone="info" label="مفتوحة" dense />
        ) : (
          <StatusBadge tone="neutral" label="مغلقة" dense />
        ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <div className="mt-12 lg:mt-0">
          <PageHeader
            eyebrow="تذاكر الدعم"
            eyebrowIcon={Headset}
            title="تذاكر الدعم الفني"
            description="الاستفسارات والمساعدة التقنية للمستخدمين — متابعة وإغلاق التذاكر."
            breadcrumbs={[
              { label: 'لوحة القيادة', href: '/' },
              { label: 'تذاكر الدعم' },
            ]}
            count={!loading ? `${openCount} مفتوحة · ${closedCount} مغلقة` : undefined}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في الموضوع أو اسم المستخدم..."
              className="w-full bg-card border border-border rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition-all"
            />
          </div>

          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            {(
              [
                { key: 'all', label: 'الكل' },
                { key: 'open', label: 'مفتوحة' },
                { key: 'closed', label: 'مغلقة' },
              ] as { key: Filter; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f.key
                    ? 'bg-gold text-primary'
                    : 'text-slate-500 hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable<Ticket>
          data={filtered}
          columns={columns}
          rowKey={(t) => t.id}
          loading={loading}
          error={error}
          onRetry={fetchData}
          defaultSort={{ key: 'createdAt', dir: 'desc' }}
          empty={{
            title:
              search.trim() || filter !== 'all'
                ? 'لا توجد نتائج مطابقة'
                : 'لا توجد تذاكر دعم حالياً',
            description:
              search.trim() || filter !== 'all'
                ? 'جرّب تعديل البحث أو الفلتر.'
                : 'ستظهر تذاكر الدعم هنا فور وصول استفسار من أي مستخدم.',
          }}
        />
      </main>
    </div>
  );
}
