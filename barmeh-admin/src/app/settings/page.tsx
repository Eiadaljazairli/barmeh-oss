"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import { Settings, Bell, Send, Loader2 } from 'lucide-react';
import { adminService } from '@/services/api';
import { PageHeader } from '@/components/ui';

export default function SettingsPage() {
  const [testLoading, setTestLoading] = useState(false);

  const handleTestNotification = async () => {
    setTestLoading(true);
    try {
      await adminService.sendTestNotification();
      toast.success('تم إرسال إشعار تجريبي إلى تيلجرام بنجاح');
    } catch (err: unknown) {
      console.error('Test notification failed:', err);
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const msg =
        status === 401
          ? 'جلسة العمل انتهت، يرجى تسجيل الدخول مجدداً'
          : 'فشل إرسال الإشعار. تأكد من إعدادات البوت والاتصال بالخادم.';
      toast.error(msg);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <div className="mt-12 lg:mt-0">
          <PageHeader
            eyebrow="الإعدادات"
            eyebrowIcon={Settings}
            title="إعدادات النظام"
            description="أدوات تشغيل وفحص المنصة وقنوات الإشعارات."
            breadcrumbs={[
              { label: 'لوحة القيادة', href: '/' },
              { label: 'إعدادات النظام' },
            ]}
          />
        </div>

        <div className="max-w-3xl space-y-6">
          <section className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-foreground mb-3 text-xl">
              <Bell size={22} className="text-gold" />
              <span>إشعارات تيلجرام</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              تُرسل إشعارات الإعلانات الجديدة والبلاغات تلقائياً إلى بوت تيلجرام
              المُعدّ في متغيرات البيئة على الخادم. استخدم الزر أدناه للتأكّد من
              سلامة الاتصال.
            </p>

            <button
              onClick={handleTestNotification}
              disabled={testLoading}
              className="w-full py-4 bg-gold/10 text-gold rounded-2xl border border-gold/20 font-bold hover:bg-gold/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              {testLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send
                  size={18}
                  className="group-hover:translate-x-[-4px] transition-transform"
                />
              )}
              <span>إرسال إشعار تجريبي للتجربة</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
