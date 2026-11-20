"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  User,
  ImageOff,
} from 'lucide-react';
import { adminService } from '@/services/api';

interface QueueListing {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: string;
  moderationStatus: 'PENDING' | 'FLAGGED' | 'APPROVED' | 'REJECTED' | 'AUTO_REJECTED';
  moderationReason: string | null;
  moderationFlaggedBy: string | null;
  reportCount: number;
  user: { id: string; firstName: string | null; lastName: string | null; phone: string };
  images: { thumbUrl: string | null; mediumUrl: string | null }[];
}

interface Stats {
  pending: number;
  flagged: number;
  approved: number;
  rejected: number;
}

export default function ModerationPage() {
  const [items, setItems] = useState<QueueListing[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, flagged: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        adminService.getModerationQueue(),
        adminService.getModerationStats(),
      ]);
      setItems(queueRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
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

  const handleApprove = async (id: string) => {
    setActingId(id);
    try {
      await adminService.approveModeration(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setStats((s) => ({ ...s, flagged: Math.max(0, s.flagged - 1), approved: s.approved + 1 }));
      toast.success('تم قبول الإعلان');
    } catch (e) {
      console.error(e);
      toast.error('فشل قبول الإعلان');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('يرجى كتابة سبب الرفض');
      return;
    }
    setActingId(id);
    try {
      await adminService.rejectModeration(id, rejectReason.trim());
      setItems((prev) => prev.filter((i) => i.id !== id));
      setStats((s) => ({ ...s, flagged: Math.max(0, s.flagged - 1), rejected: s.rejected + 1 }));
      setRejectingId(null);
      setRejectReason('');
      toast.success('تم رفض الإعلان');
    } catch (e) {
      console.error(e);
      toast.error('فشل رفض الإعلان');
    } finally {
      setActingId(null);
    }
  };

  const flaggedByLabel = (src: string | null) => {
    if (!src) return null;
    const map: Record<string, string> = {
      static: 'كلمة محظورة / نمط مشبوه',
      gemini: 'مراجعة AI',
      user_report: 'بلاغات مستخدمين',
      admin: 'مراجعة يدويّة',
    };
    return map[src] || src;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 w-full overflow-hidden">
        <header className="mb-8 lg:mb-10 mt-12 lg:mt-0">
          <div className="flex items-center gap-2 text-xs lg:text-sm text-gold font-bold mb-2">
            <ShieldCheck size={14} strokeWidth={2.5} />
            <span>مراجعة المحتوى</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-2">مراجعة الإعلانات</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">
            إعلانات بانتظار قرارك — تمّ وضع علامة عليها بواسطة نظام الفلترة الذكي أو بلاغات المستخدمين.
          </p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="بانتظار المراجعة" value={stats.flagged + stats.pending} icon={Clock} color="amber" />
          <StatCard label="موسومة (FLAGGED)" value={stats.flagged} icon={Flag} color="rose" />
          <StatCard label="مقبولة" value={stats.approved} icon={CheckCircle} color="emerald" />
          <StatCard label="مرفوضة" value={stats.rejected} icon={XCircle} color="slate" />
        </div>

        <div className="space-y-4">
          {loading ? (
            <>
              <div className="h-48 bg-card border border-border skeleton rounded-2xl"></div>
              <div className="h-48 bg-card border border-border skeleton rounded-2xl"></div>
            </>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
              <ShieldCheck size={48} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-slate-500 font-medium">لا توجد إعلانات بانتظار المراجعة الآن</p>
              <p className="text-xs text-slate-400 mt-1">النظام يفحص كل إعلان جديد تلقائياً.</p>
            </div>
          ) : (
            items.map((item) => {
              const thumb = item.images[0]?.thumbUrl || item.images[0]?.mediumUrl;
              const isActing = actingId === item.id;
              const isRejecting = rejectingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:border-gold/30 transition-colors"
                >
                  <div className="p-5 flex flex-col lg:flex-row gap-5">
                    <div className="w-full lg:w-40 h-40 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageOff size={40} className="text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-lg text-primary truncate">{item.title}</h3>
                        <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex-shrink-0">
                          {item.moderationStatus}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">{item.description}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <User size={13} />
                          {item.user.firstName || item.user.phone}
                        </span>
                        <span>السعر: {item.price?.toLocaleString('ar-SY')} ل.س</span>
                        <span>{new Date(item.createdAt).toLocaleDateString('ar-SY')}</span>
                        {item.reportCount > 0 && (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <Flag size={13} /> {item.reportCount} بلاغ
                          </span>
                        )}
                      </div>

                      {item.moderationReason && (
                        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-3">
                          <ShieldAlert size={15} className="flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">سبب الوسم: </span>
                            {item.moderationReason}
                            {item.moderationFlaggedBy && (
                              <span className="text-amber-600 mr-2">
                                ({flaggedByLabel(item.moderationFlaggedBy)})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {!isRejecting ? (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            disabled={isActing}
                            onClick={() => handleApprove(item.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            قبول ونشر
                          </button>
                          <button
                            disabled={isActing}
                            onClick={() => {
                              setRejectingId(item.id);
                              setRejectReason(item.moderationReason || '');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            رفض
                          </button>
                          <a
                            href={`/listings`}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                          >
                            عرض الإعلان
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="سبب الرفض (سيُعرَض لصاحب الإعلان)"
                            className="w-full px-3 py-2 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              disabled={isActing}
                              onClick={() => handleReject(item.id)}
                              className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 disabled:opacity-50"
                            >
                              تأكيد الرفض
                            </button>
                            <button
                              disabled={isActing}
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'amber' | 'rose' | 'emerald' | 'slate';
}) {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    slate: 'bg-slate-50 text-slate-600 dark:text-slate-300 border-slate-200',
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">{label}</span>
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}
