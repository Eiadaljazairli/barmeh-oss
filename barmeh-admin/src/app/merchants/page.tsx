"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import {
  Store,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  Search,
} from 'lucide-react';
import { adminService } from '@/services/api';
import {
  PageHeader,
  EmptyState,
  ErrorState,
  Button,
  useConfirm,
} from '@/components/ui';

interface MerchantProfile {
  id: string;
  storeName: string;
  storeAddress?: string | null;
  taxId?: string | null;
  logoUrl?: string | null;
  businessHours?: unknown;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    phone: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { confirm, dialog: confirmDialog } = useConfirm();

  const fetchMerchants = async () => {
    try {
      setError(null);
      const response = await adminService.getPendingMerchants();
      setMerchants(response.data);
    } catch (err) {
      console.error('Error fetching pending merchants:', err);
      setError('تعذّر جلب قائمة التجار. تأكد من الاتصال ثم أعد المحاولة.');
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
    fetchMerchants();
  }, []);

  const handleVerify = async (profileId: string, storeName: string) => {
    const ok = await confirm({
      title: `توثيق متجر "${storeName}"؟`,
      description:
        'سيظهر المتجر للمستخدمين بعد الموافقة كحساب تجاري موثّق. تأكد من مراجعة كل البيانات قبل المتابعة.',
      confirmLabel: 'توثيق المتجر',
      tone: 'primary',
    });
    if (!ok) return;
    setVerifying(profileId);
    try {
      await adminService.verifyMerchant(profileId);
      toast.success(`تم توثيق "${storeName}"`);
      await fetchMerchants();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'حدث خطأ أثناء التوثيق';
      toast.error(message);
    } finally {
      setVerifying(null);
    }
  };

  const filtered = merchants.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const fullName = `${m.user.firstName || ''} ${m.user.lastName || ''}`.toLowerCase();
    return (
      m.storeName.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      m.user.phone.includes(q)
    );
  });

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <div className="mt-12 lg:mt-0">
          <PageHeader
            eyebrow="التجار"
            eyebrowIcon={Store}
            title="الموافقة على التجار"
            description="مراجعة الحسابات التجارية المسجّلة وتوثيقها بعد التحقّق من بياناتها."
            breadcrumbs={[
              { label: 'لوحة القيادة', href: '/' },
              { label: 'الموافقة على التجار' },
            ]}
            count={!loading ? `${merchants.length} بانتظار المراجعة` : undefined}
          />
        </div>

        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم التجاري، صاحب المتجر، أو رقم الهاتف..."
            className="bg-card border border-border rounded-xl pl-3 pr-10 py-2.5 w-full focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition-all text-sm"
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchMerchants} />
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-2xl skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Store}
            title={
              merchants.length === 0
                ? 'لا توجد طلبات بانتظار المراجعة'
                : 'لم يطابق البحث أي نتيجة'
            }
            description={
              merchants.length === 0
                ? 'كل التجار تم التحقّق منهم — أحسنت!'
                : 'جرّب كلمات بحث أخرى.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((m) => {
              const fullName =
                [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') ||
                'مستخدم';
              return (
                <article
                  key={m.id}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-gold/60 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-primary-light rounded-xl overflow-hidden flex-shrink-0">
                      {m.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.logoUrl}
                          alt={m.storeName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold">
                          <Store size={28} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg truncate">
                        {m.storeName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        مالك المتجر: {fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        تقدّم بالطلب{' '}
                        {new Date(m.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-5 text-xs">
                    <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Phone size={14} className="text-gold shrink-0" />
                      <span>{m.user.phone}</span>
                    </li>
                    {m.user.email && (
                      <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Mail size={14} className="text-gold shrink-0" />
                        <span className="truncate">{m.user.email}</span>
                      </li>
                    )}
                    {m.storeAddress && (
                      <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <MapPin size={14} className="text-gold shrink-0" />
                        <span className="truncate">{m.storeAddress}</span>
                      </li>
                    )}
                    {m.taxId && (
                      <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <FileBadge size={14} className="text-gold shrink-0" />
                        <span>الرقم الضريبي: {m.taxId}</span>
                      </li>
                    )}
                  </ul>

                  <Button
                    variant="primary"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => handleVerify(m.id, m.storeName)}
                    loading={verifying === m.id}
                    leftIcon={<CheckCircle2 size={16} strokeWidth={2.5} />}
                  >
                    توثيق المتجر
                  </Button>
                </article>
              );
            })}
          </div>
        )}

        {confirmDialog}
      </main>
    </div>
  );
}
