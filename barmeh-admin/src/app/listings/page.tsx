"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import { useConfirm } from '@/components/ui';
import {
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Tag,
  Download,
} from 'lucide-react';
import { adminService } from '@/services/api';
import { exportToCsv } from '@/lib/csv';
import DetailModal, { DetailRow } from '@/components/DetailModal';

type ListingStatus = 'ACTIVE' | 'PENDING' | 'RESERVED' | 'SOLD' | 'BLOCKED' | 'DELETED' | 'EXPIRED';
type FilterMode = 'all' | ListingStatus;

interface AdminListing {
  id: string;
  title: string;
  price: number;
  city?: string | null;
  status: ListingStatus;
  createdAt: string;
  category?: { nameAr?: string | null } | null;
  images?: { thumbUrl?: string | null }[];
}

const PAGE_SIZE = 20;

const STATUS_META: Record<ListingStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'نشط', cls: 'bg-emerald-100 text-emerald-700' },
  PENDING: { label: 'بانتظار المراجعة', cls: 'bg-amber-100 text-amber-700' },
  RESERVED: { label: 'محجوز', cls: 'bg-sky-100 text-sky-700' },
  SOLD: { label: 'مباع', cls: 'bg-slate-200 text-slate-600 dark:text-slate-300' },
  BLOCKED: { label: 'محظور', cls: 'bg-rose-100 text-rose-600' },
  DELETED: { label: 'محذوف', cls: 'bg-zinc-200 text-zinc-500' },
  EXPIRED: { label: 'منتهي', cls: 'bg-orange-100 text-orange-600' },
};

export default function ListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminListing | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const fetchData = async () => {
    try {
      const response = await adminService.getListings();
      setListings(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
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

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'حذف هذا الإعلان؟',
      description: 'لا يمكن التراجع عن هذا الإجراء بعد التأكيد.',
      confirmLabel: 'حذف',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await adminService.deleteListing(id);
      toast.success('تم حذف الإعلان');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((l) => {
      if (filter !== 'all' && l.status !== filter) return false;
      if (!q) return true;
      const title = l.title.toLowerCase();
      const cat = (l.category?.nameAr || '').toLowerCase();
      const city = (l.city || '').toLowerCase();
      return title.includes(q) || cat.includes(q) || city.includes(q);
    });
  }, [listings, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filterLabels: Record<FilterMode, string> = {
    all: 'كل الحالات',
    ACTIVE: STATUS_META.ACTIVE.label,
    PENDING: STATUS_META.PENDING.label,
    RESERVED: STATUS_META.RESERVED.label,
    SOLD: STATUS_META.SOLD.label,
    BLOCKED: STATUS_META.BLOCKED.label,
    DELETED: STATUS_META.DELETED.label,
    EXPIRED: STATUS_META.EXPIRED.label,
  };

  const handleExport = () => {
    exportToCsv('barmeh_listings', [
      { header: 'العنوان', accessor: (l) => l.title },
      { header: 'الفئة', accessor: (l) => l.category?.nameAr || '' },
      { header: 'السعر (ل.س)', accessor: (l) => l.price },
      { header: 'المدينة', accessor: (l) => l.city || '' },
      { header: 'الحالة', accessor: (l) => STATUS_META[l.status]?.label || l.status },
      { header: 'تاريخ النشر', accessor: (l) => new Date(l.createdAt).toISOString().slice(0, 10) },
    ], filtered);
  };

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8 lg:mb-10 mt-12 lg:mt-0">
          <div>
            <div className="flex items-center gap-2 text-xs lg:text-sm text-gold font-bold mb-2">
              <Tag size={14} strokeWidth={2.5} />
              <span>الإعلانات</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-2">مراجعة الإعلانات</h1>
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">إدارة ومراقبة جميع الإعلانات المنشورة على المنصة</p>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بعنوان الإعلان، الفئة، أو المدينة..."
                className="bg-card border border-border rounded-xl px-10 py-2.5 w-full lg:w-72 focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition-all text-sm placeholder:text-slate-400"
              />
              <Search className="absolute right-3.5 top-3 text-slate-400" size={16} strokeWidth={2.5} />
            </div>

            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:border-gold/60 transition-colors"
              >
                <Filter size={18} />
                <span>{filterLabels[filter]}</span>
              </button>
              {filterOpen && (
                <div className="absolute left-0 lg:right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl shadow-black/10 z-50 overflow-hidden">
                  {(Object.keys(filterLabels) as FilterMode[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setFilter(key);
                        setFilterOpen(false);
                      }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-primary-light/20 transition-colors ${
                        filter === key ? 'bg-gold/10 text-gold font-bold' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {filterLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 text-gold rounded-xl text-sm font-medium hover:bg-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="تصدير النتائج المعروضة كملف CSV"
            >
              <Download size={18} />
              <span>CSV</span>
            </button>
          </div>
        </header>

        <div className="mb-4 flex items-center gap-3 text-xs text-slate-500">
          <span>إجمالي النتائج: <span className="font-bold text-primary">{filtered.length}</span></span>
          {filtered.length > 0 && (
            <span>
              يعرض <span className="font-bold text-primary">{(safePage - 1) * PAGE_SIZE + 1}</span> -{' '}
              <span className="font-bold text-primary">{Math.min(safePage * PAGE_SIZE, filtered.length)}</span>
            </span>
          )}
        </div>

        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 dark:bg-primary-light/30 border-b border-border text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">الإعلان</th>
                  <th className="px-6 py-4">الفئة</th>
                  <th className="px-6 py-4">السعر</th>
                  <th className="px-6 py-4">المدينة</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : pageItems.length > 0 ? (
                  pageItems.map((item) => {
                    const meta = STATUS_META[item.status] || STATUS_META.ACTIVE;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="hover:bg-slate-50 dark:hover:bg-primary-light/10 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {item.images?.[0]?.thumbUrl ? (
                                <img src={item.images[0].thumbUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Tag className="text-slate-300" size={20} />
                              )}
                            </div>
                            <span className="font-bold text-sm text-primary line-clamp-1">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.category?.nameAr || '—'}</td>
                        <td className="px-6 py-4 font-bold text-gold whitespace-nowrap">
                          {item.price.toLocaleString('en-US')} ل.س
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.city || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف الإعلان"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              onClick={() => setSelected(item)}
                              className="p-2 text-slate-400 hover:text-primary rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <ExternalLink size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                      {listings.length === 0 ? 'لا توجد إعلانات لعرضها' : 'لم يطابق البحث أي نتيجة'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-primary-light/10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
                السابق
              </button>
              <span className="text-xs text-slate-500">
                صفحة <span className="font-bold text-primary">{safePage}</span> من{' '}
                <span className="font-bold text-primary">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                التالي
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </section>

        <DetailModal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.title || 'إعلان'}
          subtitle={selected?.category?.nameAr || ''}
          footer={
            selected && (
              <button
                onClick={() => {
                  handleDelete(selected.id);
                  setSelected(null);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-colors"
              >
                حذف الإعلان
              </button>
            )
          }
        >
          {selected && (
            <div className="space-y-1">
              {selected.images && selected.images[0]?.thumbUrl && (
                <div className="mb-5 rounded-xl overflow-hidden bg-slate-100 max-h-64">
                  <img src={selected.images[0].thumbUrl} alt={selected.title} className="w-full h-full object-cover" />
                </div>
              )}
              <DetailRow label="معرّف الإعلان" value={<code className="text-[10px]">{selected.id}</code>} />
              <DetailRow label="العنوان" value={selected.title} />
              <DetailRow label="الفئة" value={selected.category?.nameAr || '—'} />
              <DetailRow
                label="السعر"
                value={<span className="text-gold font-bold">{selected.price.toLocaleString('en-US')} ل.س</span>}
              />
              <DetailRow label="المدينة" value={selected.city || '—'} />
              <DetailRow
                label="الحالة"
                value={
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[selected.status]?.cls || ''}`}>
                    {STATUS_META[selected.status]?.label || selected.status}
                  </span>
                }
              />
              <DetailRow label="تاريخ النشر" value={new Date(selected.createdAt).toLocaleString('ar-SY')} />
            </div>
          )}
        </DetailModal>

        {confirmDialog}
      </main>
    </div>
  );
}
