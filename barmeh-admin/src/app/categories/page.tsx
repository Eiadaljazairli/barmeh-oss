"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  X,
  Package,
} from 'lucide-react';
import { adminService } from '@/services/api';
import {
  PageHeader,
  EmptyState,
  ErrorState,
  StatusBadge,
  Button,
  useConfirm,
} from '@/components/ui';

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string | null;
  parentId?: string | null;
  order?: number | null;
  isActive: boolean;
  _count?: { listings: number };
}

interface FormState {
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  parentId: string;
  order: string;
}

const EMPTY: FormState = {
  nameAr: '',
  nameEn: '',
  slug: '',
  icon: '',
  parentId: '',
  order: '',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const fetchCategories = async () => {
    try {
      setError(null);
      const r = await adminService.getCategories();
      setCategories(r.data);
    } catch (e) {
      console.error(e);
      setError('تعذّر جلب قائمة الفئات. تأكد من اتصالك ثم أعد المحاولة.');
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
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setCreating(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      slug: c.slug,
      icon: c.icon || '',
      parentId: c.parentId || '',
      order: c.order?.toString() || '',
    });
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim() || !form.nameEn.trim() || !form.slug.trim()) {
      toast.error('الاسم بالعربية والإنجليزية والـ slug مطلوبين');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        slug: form.slug.trim(),
        icon: form.icon.trim() || undefined,
        parentId: form.parentId.trim() || undefined,
        order: form.order ? Number(form.order) : undefined,
      };
      if (editing) {
        await adminService.updateCategory(editing.id, payload);
        toast.success(`تم تحديث "${payload.nameAr}"`);
      } else {
        await adminService.createCategory(payload);
        toast.success(`تم إنشاء فئة "${payload.nameAr}"`);
      }
      await fetchCategories();
      close();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'حدث خطأ أثناء الحفظ';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    const ok = await confirm({
      title: `حذف فئة "${c.nameAr}"؟`,
      description:
        'هذا إجراء يقوم بتعطيل الفئة (soft delete) — لن تظهر للمستخدمين لكن البيانات تبقى في النظام.',
      confirmLabel: 'حذف الفئة',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await adminService.deleteCategory(c.id);
      toast.success(`تم حذف "${c.nameAr}"`);
      await fetchCategories();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'حدث خطأ أثناء الحذف';
      toast.error(message);
    }
  };

  const tree = (() => {
    const parents = categories.filter((c) => !c.parentId);
    const childrenOf = (pid: string) =>
      categories.filter((c) => c.parentId === pid);
    const result: Array<Category & { depth: number }> = [];
    parents.forEach((p) => {
      result.push({ ...p, depth: 0 });
      childrenOf(p.id).forEach((ch) => result.push({ ...ch, depth: 1 }));
    });
    categories
      .filter((c) => c.parentId && !parents.find((p) => p.id === c.parentId))
      .forEach((c) => result.push({ ...c, depth: 0 }));
    return result;
  })();

  const totalActive = categories.filter((c) => c.isActive).length;
  const totalCount = categories.length;

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <div className="mt-12 lg:mt-0">
          <PageHeader
            eyebrow="التصنيفات"
            eyebrowIcon={FolderTree}
            title="إدارة الفئات"
            description="إنشاء وتعديل وتنظيم فئات الإعلانات بالمنصة بهيكل هرمي يدعم فئات فرعية."
            breadcrumbs={[
              { label: 'لوحة القيادة', href: '/' },
              { label: 'إدارة الفئات' },
            ]}
            count={!loading ? `${totalActive} نشط · ${totalCount} كلي` : undefined}
            actions={
              <Button leftIcon={<Plus size={16} strokeWidth={2.5} />} onClick={openCreate}>
                فئة جديدة
              </Button>
            }
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchCategories} />
        ) : loading ? (
          <div className="space-y-3" aria-busy>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : tree.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="لا توجد فئات بعد"
            description="ابدأ بإضافة الفئة الأولى لمنح المستخدمين تجربة استكشاف منظمة."
            action={
              <Button
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
                onClick={openCreate}
              >
                إنشاء فئة جديدة
              </Button>
            }
          />
        ) : (
          <section className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <ul className="divide-y divide-border">
              {tree.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-primary-light/10 transition-colors group"
                  style={{ paddingRight: `${1 + c.depth * 2}rem` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {c.depth > 0 && (
                      <span
                        className="text-slate-300 text-lg select-none"
                        aria-hidden
                      >
                        └
                      </span>
                    )}
                    <div className="w-10 h-10 bg-slate-100 dark:bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {c.icon ? (
                        /^(https?:\/\/|\/)/.test(c.icon) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.icon}
                            alt={c.nameAr}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-lg">{c.icon}</span>
                        )
                      ) : (
                        <Package className="text-gold" size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground text-sm truncate">
                          {c.nameAr}
                        </p>
                        {!c.isActive && (
                          <StatusBadge tone="neutral" label="معطّلة" dense />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {c.nameEn} · /{c.slug}
                        {c._count && ` · ${c._count.listings} إعلان نشط`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 text-slate-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                      title="تعديل"
                      aria-label={`تعديل ${c.nameAr}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="حذف"
                      aria-label={`حذف ${c.nameAr}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {creating && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={close}
            role="dialog"
            aria-modal
            aria-labelledby="category-form-title"
          >
            <div
              className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-5 border-b border-border">
                <h3
                  id="category-form-title"
                  className="font-bold text-lg text-foreground"
                >
                  {editing ? 'تعديل فئة' : 'إضافة فئة جديدة'}
                </h3>
                <button
                  onClick={close}
                  className="text-slate-400 hover:text-foreground p-1 rounded-md transition-colors"
                  aria-label="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <Field
                  label="الاسم بالعربية"
                  required
                  value={form.nameAr}
                  onChange={(v) => setForm((f) => ({ ...f, nameAr: v }))}
                  placeholder="مثلاً: عقارات"
                />
                <Field
                  label="الاسم بالإنجليزية"
                  required
                  value={form.nameEn}
                  onChange={(v) => setForm((f) => ({ ...f, nameEn: v }))}
                  placeholder="e.g. Real Estate"
                />
                <Field
                  label="Slug (للـ URL)"
                  required
                  value={form.slug}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    }))
                  }
                  placeholder="real-estate"
                />
                <Field
                  label="أيقونة (Emoji أو رابط)"
                  value={form.icon}
                  onChange={(v) => setForm((f) => ({ ...f, icon: v }))}
                  placeholder="🏠 أو https://..."
                />
                <Field
                  label="الترتيب"
                  type="number"
                  value={form.order}
                  onChange={(v) => setForm((f) => ({ ...f, order: v }))}
                  placeholder="0"
                />
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                    الفئة الأم (اختياري)
                  </label>
                  <select
                    value={form.parentId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, parentId: e.target.value }))
                    }
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition-all"
                  >
                    <option value="">— فئة رئيسية —</option>
                    {categories
                      .filter((c) => !c.parentId && c.id !== editing?.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={close}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" loading={saving} className="flex-1">
                    {editing ? 'حفظ التعديلات' : 'إنشاء الفئة'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmDialog}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition-all"
      />
    </div>
  );
}
