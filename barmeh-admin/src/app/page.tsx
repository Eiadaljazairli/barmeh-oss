"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import DashboardStats from '@/components/DashboardStats';
import { useConfirm } from '@/components/ui';
import {
  Bell,
  Search,
  UserCircle2,
  ExternalLink,
  ChevronLeft,
  Trash2,
  RefreshCw,
  Circle,
  Activity,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';

const POLL_INTERVAL_MS = 60_000;

interface AdminNotif {
  id: number;
  title: string;
  body: string;
  type: 'user' | 'report' | 'ticket';
  at: number;
}

interface ListingRow {
  id: string;
  title: string;
  price: number;
  city: string;
  createdAt: string;
  images?: { thumbUrl: string }[];
}

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'الآن';
  if (diff < 60) return `منذ ${diff} ث`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} ي`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: '0', listings: '0', reports: '0', tickets: '0' });
  const [recentListings, setRecentListings] = useState<ListingRow[]>([]);
  const [cityStats, setCityStats] = useState<{ city: string; count: number }[]>([]);
  const [dailyStats, setDailyStats] = useState<{ date: string; count: number }[]>([]);
  const [adminName, setAdminName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AdminNotif[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [, forceTick] = useState(0);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const socket = useSocket(adminToken);
  const socketConnected = !!socket?.connected;

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setRefreshing(true);
    try {
      const [uCount, lCount, rCount, sCount, lList, cStats, dStats, me] = await Promise.allSettled([
        adminService.getUserCount(),
        adminService.getListingCount(),
        adminService.getReportCount(),
        adminService.getSupportCount(),
        adminService.getListings(),
        adminService.getCityStats(),
        adminService.getDailyStats(),
        adminService.getMe(),
      ]);

      setStats({
        users: uCount.status === 'fulfilled' ? uCount.value.data.count.toLocaleString('en-US') : '0',
        listings: lCount.status === 'fulfilled' ? lCount.value.data.count.toLocaleString('en-US') : '0',
        reports: rCount.status === 'fulfilled' ? rCount.value.data.count.toLocaleString('en-US') : '0',
        tickets: sCount.status === 'fulfilled' ? sCount.value.data.count.toLocaleString('en-US') : '0',
      });

      if (lList.status === 'fulfilled') setRecentListings(lList.value.data.slice(0, 6));
      if (cStats.status === 'fulfilled') setCityStats(cStats.value.data);
      if (dStats.status === 'fulfilled') setDailyStats(dStats.value.data);
      if (me.status === 'fulfilled') {
        const u = me.value.data;
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'الإدارة';
        setAdminName(name);
      }
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setAdminToken(token);
    fetchData({ silent: true });
  }, [fetchData]);

  useEffect(() => {
    const id = window.setInterval(() => fetchData({ silent: true }), POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    const id = window.setInterval(() => forceTick((t) => t + 1), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const pushNotif = (title: string, body: string, type: AdminNotif['type']) => {
      setNotifications((prev) => [
        { id: Date.now() + Math.random(), title, body, type, at: Date.now() },
        ...prev,
      ].slice(0, 30));
    };

    const onUser = (data: { name: string }) => {
      pushNotif('مستخدم جديد انضمّ', `${data.name} سجّل في المنصة`, 'user');
      fetchData({ silent: true });
    };
    const onReport = (data: { reporterName: string; reportedName: string }) => {
      pushNotif('بلاغ جديد', `بلاغ من ${data.reporterName} على ${data.reportedName}`, 'report');
      fetchData({ silent: true });
    };
    const onTicket = (data: { userName: string; subject: string }) => {
      pushNotif('تذكرة دعم جديدة', `${data.userName}: ${data.subject}`, 'ticket');
      fetchData({ silent: true });
    };

    socket.on('new_user_registered', onUser);
    socket.on('new_report', onReport);
    socket.on('new_ticket', onTicket);

    return () => {
      socket.off('new_user_registered', onUser);
      socket.off('new_report', onReport);
      socket.off('new_ticket', onTicket);
    };
  }, [socket, fetchData]);

  const notifRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showNotifications) return;
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showNotifications]);

  const handleDeleteListing = async (id: string) => {
    const ok = await confirm({
      title: 'حذف هذا الإعلان نهائياً؟',
      description: 'لا يمكن التراجع عن هذا الإجراء بعد التأكيد.',
      confirmLabel: 'حذف نهائي',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await adminService.deleteListing(id);
      toast.success('تم حذف الإعلان');
      fetchData({ silent: true });
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/listings?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground" dir="rtl">
      <Sidebar />

      <main className="flex-1 lg:mr-64 w-full overflow-hidden">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between gap-4 px-4 lg:px-10 py-4 lg:py-5 mt-12 lg:mt-0">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-md hidden md:block">
              <Search
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
                strokeWidth={2.5}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن إعلان، مستخدم، أو رقم تذكرة..."
                className="w-full bg-card border border-border rounded-xl pr-10 pl-4 py-2.5 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:border-gold/60
                           focus:ring-2 focus:ring-gold/20 transition-all"
              />
            </form>

            <div className="flex items-center gap-2 lg:gap-3 mr-auto">
              <div
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border"
                title={socketConnected ? 'متصل بالنظام مباشرة' : 'غير متصل — التحديث بالاستطلاع كل دقيقة'}
              >
                <span className="relative flex w-2 h-2">
                  <span
                    className={`absolute inset-0 rounded-full ${
                      socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    } ${socketConnected ? 'animate-ping opacity-75' : ''}`}
                  />
                  <span
                    className={`relative inline-flex w-2 h-2 rounded-full ${
                      socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {socketConnected ? 'متصل' : 'استطلاع'}
                </span>
                <span className="text-[11px] text-slate-400 border-r border-border pr-2 mr-1">
                  {formatRelative(lastUpdated)}
                </span>
              </div>

              <button
                onClick={() => fetchData()}
                disabled={refreshing}
                className="p-2.5 rounded-xl bg-card border border-border hover:border-gold/60
                           hover:text-gold transition-all disabled:opacity-50"
                aria-label="تحديث"
                title="تحديث البيانات"
              >
                <RefreshCw
                  size={16}
                  strokeWidth={2.5}
                  className={refreshing ? 'animate-spin' : ''}
                />
              </button>

              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative p-2.5 rounded-xl bg-card border border-border
                             hover:border-gold/60 hover:text-gold transition-all"
                  aria-label="التنبيهات"
                >
                  <Bell size={18} strokeWidth={2.5} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1
                                     flex items-center justify-center rounded-full
                                     bg-rose-500 text-white text-[10px] font-bold
                                     border-2 border-background">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-[min(340px,calc(100vw-2rem))] max-w-[340px] bg-card border border-border
                                 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground">التنبيهات الحيّة</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {socketConnected
                              ? 'مفعّل عبر WebSocket'
                              : 'الاتصال المباشر متوقف — التحديث كل دقيقة'}
                          </p>
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => setNotifications([])}
                            className="text-[11px] font-bold text-gold hover:text-gold-700 transition-colors"
                          >
                            مسح الكل
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <AnimatePresence initial={false}>
                            {notifications.map((n) => (
                              <motion.div
                                key={n.id}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12, height: 0 }}
                                onClick={() => {
                                  setShowNotifications(false);
                                  if (n.type === 'report') window.location.href = '/reports';
                                  else if (n.type === 'ticket') window.location.href = '/tickets';
                                  else window.location.href = '/users';
                                }}
                                className="relative p-4 border-b border-border last:border-0
                                           hover:bg-slate-50 dark:hover:bg-primary/40
                                           transition-colors cursor-pointer"
                              >
                                <span
                                  className={`absolute right-0 inset-y-3 w-[3px] rounded-full ${
                                    n.type === 'user'
                                      ? 'bg-emerald-500'
                                      : n.type === 'report'
                                      ? 'bg-rose-500'
                                      : 'bg-gold'
                                  }`}
                                />
                                <div className="flex justify-between items-start mb-1.5 gap-3">
                                  <p className="text-sm font-bold text-foreground">{n.title}</p>
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                    {formatRelative(n.at)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                  {n.body}
                                </p>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        ) : (
                          <div className="py-14 text-center px-6">
                            <Bell
                              size={28}
                              strokeWidth={1.5}
                              className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
                            />
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                              لا توجد تنبيهات جديدة
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              التنبيهات الحيّة ستظهر هنا فور حدوثها
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2.5 pr-3 pl-1 border-r border-border mr-1">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {adminName || '...'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                    مدير النظام
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600
                                flex items-center justify-center text-primary-900 font-bold">
                  {adminName ? adminName.charAt(0) : <UserCircle2 size={20} />}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-10">
          <section className="mb-8 lg:mb-10">
            <div className="flex items-center gap-2 text-xs lg:text-sm text-gold font-bold mb-2">
              <Activity size={14} strokeWidth={2.5} />
              <span>لوحة القيادة</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-2">
              {adminName ? `أهلاً، ${adminName}` : 'أهلاً بك مجدداً'}
            </h1>
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
              نظرة شاملة على أداء برمة — البيانات تتحدّث تلقائياً عبر اتصال مباشر مع الخادم.
            </p>
          </section>

          <DashboardStats
            users={stats.users}
            listings={stats.listings}
            reports={stats.reports}
            tickets={stats.tickets}
            loading={loading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mt-6 lg:mt-8">
            <section className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
              <header className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-foreground">
                    آخر الإعلانات المنشورة
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    آخر 6 إعلانات تمت إضافتها للنظام
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = '/listings')}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-gold
                             hover:text-gold-700 transition-all hover:gap-2.5"
                >
                  <span>عرض الكل</span>
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
              </header>

              <div className="divide-y divide-border">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 skeleton" />
                    ))}
                  </div>
                ) : recentListings.length > 0 ? (
                  recentListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="group flex items-center justify-between gap-4 px-6 py-4
                                 hover:bg-slate-50/60 dark:hover:bg-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-primary-light
                                        overflow-hidden flex-shrink-0 border border-border">
                          {listing.images?.[0]?.thumbUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={listing.images[0].thumbUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center
                                            text-slate-400">
                              <Tag size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {listing.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(listing.createdAt).toLocaleDateString('ar-SY', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            <span className="mx-1.5 text-slate-300">•</span>
                            {listing.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className="text-sm font-extrabold text-gold-700 dark:text-gold tabular-nums"
                          dir="ltr"
                        >
                          {listing.price.toLocaleString('en-US')} <span className="text-xs font-medium">ل.س</span>
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500
                                       hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="حذف الإعلان"
                          >
                            <Trash2 size={15} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => (window.location.href = `/listings?id=${listing.id}`)}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary
                                       hover:bg-slate-100 dark:hover:bg-primary-light/30 transition-colors"
                            title="عرض التفاصيل"
                          >
                            <ExternalLink size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center px-6">
                    <Tag
                      size={36}
                      strokeWidth={1.5}
                      className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
                    />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      لا توجد إعلانات نشطة حالياً
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      ستظهر الإعلانات هنا فور إضافتها من المستخدمين
                    </p>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-5 lg:space-y-6">
              <section className="relative bg-mesh text-white rounded-2xl p-6 overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold">آخر 7 أيام</h3>
                    <TrendingUp size={18} className="text-gold" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs text-white/60 mb-6">إعلانات جديدة يومياً</p>

                  {(() => {
                    const max = Math.max(1, ...dailyStats.map((d) => d.count));
                    const dayLabels = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
                    const total = dailyStats.reduce((s, d) => s + d.count, 0);

                    return (
                      <>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-3xl font-extrabold tabular-nums" dir="ltr">
                            {total}
                          </span>
                          <span className="text-xs text-white/60">إعلان هذا الأسبوع</span>
                        </div>

                        <div className="flex items-end gap-1.5 h-24" dir="ltr">
                          {dailyStats.length > 0 ? (
                            dailyStats.map((d, i) => {
                              const pct = (d.count / max) * 100;
                              const dayName = dayLabels[new Date(d.date).getDay()];
                              return (
                                <div
                                  key={d.date}
                                  className="flex-1 flex flex-col items-center gap-1.5 group relative"
                                >
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(4, pct)}%` }}
                                    transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
                                    className="w-full rounded-md bg-gradient-to-t from-gold-600 to-gold-400
                                               hover:from-gold-500 hover:to-gold-300 transition-colors cursor-pointer"
                                    title={`${dayName}: ${d.count} إعلان`}
                                  />
                                  <span className="text-[9px] text-white/50 font-medium">
                                    {dayName}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="w-full text-center text-xs text-white/40 italic self-center">
                              {loading ? 'جاري التحميل...' : 'لا توجد بيانات بعد'}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </section>

              <section className="bg-card border border-border rounded-2xl p-6">
                <header className="mb-5">
                  <h3 className="text-base font-bold text-foreground">أنشط المحافظات</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    حسب عدد الإعلانات
                  </p>
                </header>

                <div className="space-y-4">
                  {cityStats.length > 0 ? (
                    cityStats.slice(0, 5).map((city, index) => {
                      const maxCount = cityStats[0]?.count || 1;
                      const pct = (city.count / maxCount) * 100;
                      return (
                        <div key={city.city} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-5 h-5
                                               rounded-md bg-slate-100 dark:bg-primary-light
                                               text-[10px] font-bold text-slate-500 dark:text-slate-300">
                                {index + 1}
                              </span>
                              <span className="font-bold text-foreground">{city.city}</span>
                            </div>
                            <span
                              className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums"
                              dir="ltr"
                            >
                              {city.count.toLocaleString('en-US')}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-primary-light/40 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: index * 0.1, duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center">
                      <Circle
                        size={28}
                        strokeWidth={1.5}
                        className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
                      />
                      <p className="text-xs text-slate-400 italic">
                        {loading ? 'جاري التحميل...' : 'لا توجد بيانات جغرافية كافية'}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      {confirmDialog}
    </div>
  );
}
