"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import { Megaphone, Send, CheckCircle2, AlertCircle, Users, Store, ShoppingCart } from 'lucide-react';
import { adminService } from '@/services/api';
import { useConfirm } from '@/components/ui';

type Target = 'all' | 'merchants' | 'consumers';

interface Result {
  totalUsers: number;
  withPushToken: number;
  pushSent: number;
  pushFailed: number;
}

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) window.location.href = '/login';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('العنوان والنص مطلوبان');
      return;
    }
    const targetLabel: Record<Target, string> = {
      all: 'كل المستخدمين',
      merchants: 'التجار فقط',
      consumers: 'المستهلكين فقط',
    };
    const ok = await confirm({
      title: 'إرسال التنبيه؟',
      description: `سيتم إرسال هذا التنبيه إلى ${targetLabel[target]}. هل أنت متأكد؟`,
      confirmLabel: 'إرسال',
      tone: 'primary',
    });
    if (!ok) return;

    setSending(true);
    setError(null);
    setResult(null);
    try {
      const r = await adminService.broadcastNotification({
        title: title.trim(),
        body: body.trim(),
        target,
      });
      setResult(r.data);
      setTitle('');
      setBody('');
      toast.success('تم إرسال التنبيه بنجاح');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'حدث خطأ أثناء الإرسال';
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const targets: { key: Target; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'all', label: 'كل المستخدمين', icon: <Users size={20} />, desc: 'تجار + مستهلكين' },
    { key: 'merchants', label: 'التجار فقط', icon: <Store size={20} />, desc: 'حسابات الـ MERCHANT' },
    { key: 'consumers', label: 'المستهلكين فقط', icon: <ShoppingCart size={20} />, desc: 'حسابات الـ CONSUMER' },
  ];

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <header className="mb-8 lg:mb-10 mt-12 lg:mt-0">
          <div className="flex items-center gap-2 text-xs lg:text-sm text-gold font-bold mb-2">
            <Megaphone size={14} strokeWidth={2.5} />
            <span>الإشعارات</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-2">إرسال تنبيه عام</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">
            ابعث إشعار push إلى مستخدمي التطبيق — يُحفظ بسجل الإشعارات داخل التطبيق أيضاً
          </p>
        </header>

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                المُستهدفون <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {targets.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setTarget(t.key)}
                    className={`p-3 rounded-xl border-2 text-right transition-all ${
                      target === t.key
                        ? 'border-gold bg-gold/10'
                        : 'border-border hover:border-gold/40'
                    }`}
                  >
                    <div className={`flex items-center gap-2 mb-1 ${target === t.key ? 'text-gold' : 'text-slate-400'}`}>
                      {t.icon}
                      <span className="font-bold text-sm text-primary">{t.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                عنوان التنبيه <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: عرض خاص لفترة محدودة!"
                maxLength={80}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">{title.length}/80</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                نص الرسالة <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب نص التنبيه هنا..."
                rows={4}
                maxLength={300}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition-all resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">{body.length}/300</p>
            </div>

            {(title || body) && (
              <div className="bg-slate-50 dark:bg-primary-light/10 border border-dashed border-border rounded-xl p-4">
                <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest">معاينة</p>
                <div className="bg-white dark:bg-primary rounded-lg p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
                      <Megaphone className="text-primary" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-primary mb-0.5 truncate">
                        {title || 'عنوان التنبيه'}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {body || 'نص الرسالة سيظهر هنا'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-700 mb-3">
                  <CheckCircle2 size={20} />
                  <span className="font-bold">تم الإرسال بنجاح!</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Stat label="المستخدمين المستهدفين" value={result.totalUsers} />
                  <Stat label="مسجلين بالـ push" value={result.withPushToken} />
                  <Stat label="تم الإرسال" value={result.pushSent} ok />
                  <Stat label="فشل الإرسال" value={result.pushFailed} bad={result.pushFailed > 0} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>إرسال التنبيه</span>
                </>
              )}
            </button>
          </form>
        </div>

        {confirmDialog}
      </main>
    </div>
  );
}

function Stat({ label, value, ok, bad }: { label: string; value: number; ok?: boolean; bad?: boolean }) {
  return (
    <div className="bg-white dark:bg-card rounded-lg p-2.5 border border-emerald-100">
      <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
      <p className={`font-bold text-lg ${ok ? 'text-emerald-600' : bad ? 'text-rose-600' : 'text-primary'}`}>
        {value.toLocaleString('en-US')}
      </p>
    </div>
  );
}
