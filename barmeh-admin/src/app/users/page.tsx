"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import {
  Search,
  Filter,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
} from 'lucide-react';
import { adminService } from '@/services/api';
import { exportToCsv } from '@/lib/csv';
import DetailModal, { DetailRow } from '@/components/DetailModal';

type FilterMode = 'all' | 'active' | 'blocked' | 'admin';

interface AdminUser {
  id: string;
  name?: string | null;
  phone: string;
  governorate?: string | null;
  isBlocked: boolean;
  isAdmin: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await adminService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
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
    fetchUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const handleToggleBlock = async (id: string) => {
    try {
      await adminService.toggleBlockUser(id);
      toast.success('تم تحديث حالة الحظر');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تغيير حالة الحظر');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === 'active' && u.isBlocked) return false;
      if (filter === 'blocked' && !u.isBlocked) return false;
      if (filter === 'admin' && !u.isAdmin) return false;
      if (!q) return true;
      const name = (u.name || '').toLowerCase();
      const gov = (u.governorate || '').toLowerCase();
      return name.includes(q) || u.phone.includes(q) || gov.includes(q);
    });
  }, [users, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filterLabels: Record<FilterMode, string> = {
    all: 'الكل',
    active: 'النشطين فقط',
    blocked: 'المحظورين فقط',
    admin: 'المدراء فقط',
  };

  const handleExport = () => {
    exportToCsv('barmeh_users', [
      { header: 'الاسم', accessor: (u) => u.name || '' },
      { header: 'الهاتف', accessor: (u) => u.phone },
      { header: 'المحافظة', accessor: (u) => u.governorate || '' },
      { header: 'النوع', accessor: (u) => (u.isAdmin ? 'مدير' : 'مستهلك') },
      { header: 'الحالة', accessor: (u) => (u.isBlocked ? 'محظور' : 'نشط') },
      { header: 'تاريخ التسجيل', accessor: (u) => new Date(u.createdAt).toISOString().slice(0, 10) },
    ], filtered);
  };

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8 lg:mb-10 mt-12 lg:mt-0">
          <div>
            <div className="flex items-center gap-2 text-xs lg:text-sm text-gold font-bold mb-2">
              <UserCircle2 size={14} strokeWidth={2.5} />
              <span>المستخدمون</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-2">إدارة المستخدمين</h1>
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">عرض وإدارة جميع الحسابات المسجلة في المنصة</p>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم، الهاتف، أو المحافظة..."
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
                <div className="absolute left-0 lg:right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-xl shadow-black/10 z-50 overflow-hidden">
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
                  <th className="px-6 py-4">المستخدم</th>
                  <th className="px-6 py-4">رقم الهاتف</th>
                  <th className="px-6 py-4">الموقع</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">تاريخ التسجيل</th>
                  <th className="px-6 py-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-10 bg-slate-100 rounded"></div>
                      </td>
                    </tr>
                  ))
                ) : pageItems.length > 0 ? (
                  pageItems.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelected(user)}
                      className="hover:bg-slate-50 dark:hover:bg-primary-light/10 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                            {user.avatarUrl && (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-primary">{user.name || 'مستخدم غير معروف'}</p>
                            <p className="text-[10px] text-slate-400 uppercase">
                              {user.isAdmin ? 'مدير' : 'مستهلك'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{user.phone}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{user.governorate || 'غير محدد'}</td>
                      <td className="px-6 py-4">
                        {user.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-600">
                            <ShieldAlert size={12} />
                            محظور
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">
                            <ShieldCheck size={12} />
                            نشط
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('ar-SY')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleBlock(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isBlocked ? 'text-emerald-500 hover:bg-emerald-50' : 'text-rose-500 hover:bg-rose-50'
                            }`}
                            title={user.isBlocked ? 'إلغاء الحظر' : 'حظر المستخدم'}
                          >
                            <UserX size={18} />
                          </button>
                          <button
                            onClick={() => setSelected(user)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                            title="عرض التفاصيل"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                      {users.length === 0 ? 'لا يوجد مستخدمين لعرضهم' : 'لم يطابق البحث أي نتيجة'}
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
          title={selected?.name || 'مستخدم'}
          subtitle={selected?.isAdmin ? 'حساب مدير' : 'حساب مستهلك'}
          footer={
            selected && (
              <button
                onClick={() => {
                  handleToggleBlock(selected.id);
                  setSelected(null);
                }}
                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${
                  selected.isBlocked
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-rose-500 hover:bg-rose-600 text-white'
                }`}
              >
                {selected.isBlocked ? 'إلغاء الحظر' : 'حظر المستخدم'}
              </button>
            )
          }
        >
          {selected && (
            <div className="space-y-1">
              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border">
                <div className="w-16 h-16 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                  {selected.avatarUrl && (
                    <img src={selected.avatarUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-primary">{selected.name || 'مستخدم غير معروف'}</p>
                  <p className="text-xs text-slate-500">{selected.phone}</p>
                </div>
              </div>
              <DetailRow label="معرّف المستخدم" value={<code className="text-[10px]">{selected.id}</code>} />
              <DetailRow label="رقم الهاتف" value={selected.phone} />
              <DetailRow label="المحافظة" value={selected.governorate || 'غير محدد'} />
              <DetailRow label="نوع الحساب" value={selected.isAdmin ? 'مدير' : 'مستهلك'} />
              <DetailRow
                label="حالة الحساب"
                value={
                  selected.isBlocked ? (
                    <span className="text-rose-600 font-bold">محظور</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">نشط</span>
                  )
                }
              />
              <DetailRow label="تاريخ التسجيل" value={new Date(selected.createdAt).toLocaleString('ar-SY')} />
            </div>
          )}
        </DetailModal>
      </main>
    </div>
  );
}
