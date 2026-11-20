"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import {
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import { adminService } from '@/services/api';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  Button,
  useConfirm,
  type Column,
} from '@/components/ui';

interface Reporter {
  id?: string;
  name?: string;
  phone?: string;
}

interface ListingRef {
  id?: string;
  title?: string;
}

interface Report {
  id: string;
  reason: string;
  status?: string;
  createdAt?: string;
  reporter?: Reporter;
  listing?: ListingRef;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const fetchData = async () => {
    try {
      setError(null);
      const response = await adminService.getReports();
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('تعذّر جلب البلاغات. تأكد من الاتصال ثم أعد المحاولة.');
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

  const handleResolve = async (report: Report) => {
    const ok = await confirm({
      title: 'تأكيد حلّ البلاغ',
      description: `سيتم تحديد البلاغ "${report.reason}" كمحلول وإزالته من قائمة المراجعة.`,
      confirmLabel: 'حلّ البلاغ',
      tone: 'primary',
    });
    if (!ok) return;
    try {
      setResolvingId(report.id);
      await adminService.resolveReport(report.id);
      toast.success('تم حلّ البلاغ');
      await fetchData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'تعذّر حلّ البلاغ';
      toast.error(message);
    } finally {
      setResolvingId(null);
    }
  };

  const columns: Column<Report>[] = [
    {
      key: 'reason',
      header: 'سبب البلاغ',
      sortValue: (r) => r.reason,
      cell: (r) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} strokeWidth={2.2} />
          </div>
          <span className="font-bold text-foreground truncate">{r.reason}</span>
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'المُبلِغ',
      hideOnMobile: true,
      sortValue: (r) => r.reporter?.name || r.reporter?.phone || '',
      cell: (r) => (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <User size={14} />
          <span className="truncate">
            {r.reporter?.name || r.reporter?.phone || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'listing',
      header: 'الإعلان',
      hideOnMobile: true,
      sortValue: (r) => r.listing?.title || '',
      cell: (r) =>
        r.listing?.title ? (
          <div className="flex items-center gap-2 text-sm text-gold">
            <Tag size={14} />
            <span className="truncate">{r.listing.title}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'تاريخ',
      hideOnMobile: true,
      align: 'end',
      sortValue: (r) => (r.createdAt ? new Date(r.createdAt) : null),
      cell: (r) =>
        r.createdAt ? (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Calendar size={12} />
            <span>{new Date(r.createdAt).toLocaleDateString('ar-EG')}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      key: 'status',
      header: 'الحالة',
      align: 'center',
      sortValue: (r) => r.status || '',
      cell: (r) =>
        r.status === 'RESOLVED' ? (
          <StatusBadge tone="success" label="محلول" dense />
        ) : (
          <StatusBadge tone="warning" label="مفتوح" dense />
        ),
    },
    {
      key: 'actions',
      header: 'إجراء',
      align: 'end',
      cell: (r) => (
        <Button
          size="sm"
          variant="primary"
          leftIcon={<CheckCircle size={14} strokeWidth={2.5} />}
          onClick={() => handleResolve(r)}
          loading={resolvingId === r.id}
        >
          حلّ
        </Button>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <div className="mt-12 lg:mt-0">
          <PageHeader
            eyebrow="البلاغات"
            eyebrowIcon={AlertTriangle}
            title="بلاغات المخالفات"
            description="إدارة البلاغات المقدّمة من المستخدمين حول الإعلانات أو الحسابات."
            breadcrumbs={[
              { label: 'لوحة القيادة', href: '/' },
              { label: 'البلاغات' },
            ]}
            count={!loading ? reports.length : undefined}
          />
        </div>

        <DataTable<Report>
          data={reports}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={fetchData}
          defaultSort={{ key: 'createdAt', dir: 'desc' }}
          empty={{
            title: 'لا توجد بلاغات نشطة',
            description: 'كل البلاغات تمت معالجتها — ستظهر هنا فور وصول أي بلاغ جديد.',
          }}
        />

        {confirmDialog}
      </main>
    </div>
  );
}
