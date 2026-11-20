"use client";

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Tag,
  AlertTriangle,
  Headset,
  Settings,
  LogOut,
  Store,
  FolderTree,
  Megaphone,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import BrandMark from './BrandMark';
import ThemeToggle from './ThemeToggle';

const menuItems = [
  { icon: LayoutDashboard, label: 'لوحة القيادة', href: '/' },
  { icon: Users, label: 'إدارة المستخدمين', href: '/users' },
  { icon: Tag, label: 'مراجعة الإعلانات', href: '/listings' },
  { icon: ShieldCheck, label: 'مراجعة المحتوى', href: '/moderation' },
  { icon: Store, label: 'الموافقة على التجار', href: '/merchants' },
  { icon: FolderTree, label: 'إدارة الفئات', href: '/categories' },
  { icon: Megaphone, label: 'إرسال تنبيهات', href: '/broadcast' },
  { icon: AlertTriangle, label: 'البلاغات', href: '/reports' },
  { icon: Headset, label: 'تذاكر الدعم', href: '/tickets' },
  { icon: Settings, label: 'إعدادات النظام', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-[100] p-3 rounded-xl lg:hidden shadow-lg border"
        style={{
          background: 'var(--primary-900)',
          color: '#fff',
          borderColor: 'var(--primary-700)',
        }}
        aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] lg:hidden"
        />
      )}

      <aside
        className={clsx(
          'w-64 h-screen fixed right-0 top-0 flex flex-col z-[90] transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{
          background: 'linear-gradient(180deg, var(--primary-900) 0%, var(--primary-800) 100%)',
          borderInlineStart: '1px solid var(--primary-700)',
          color: '#fff',
        }}
      >
        <div
          className="absolute top-0 right-0 left-0 h-32 pointer-events-none opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(212,175,55,0.25) 0%, transparent 70%)',
          }}
        />

        <div className="px-6 pt-7 pb-6 relative">
          <BrandMark size={42} variant="gold" withWordmark />
        </div>

        <div
          className="mx-6 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--gold-500) 50%, transparent 100%)',
            opacity: 0.3,
          }}
        />

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative group',
                  isActive ? 'font-bold' : 'font-medium'
                )}
                style={
                  isActive
                    ? {
                        background:
                          'linear-gradient(135deg, var(--gold-400) 0%, var(--gold-600) 100%)',
                        color: 'var(--primary-900)',
                        boxShadow: 'var(--shadow-gold)',
                      }
                    : { color: 'rgba(255,255,255,0.65)' }
                }
              >
                {isActive && (
                  <span
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                    style={{ background: 'var(--gold-500)' }}
                  />
                )}
                <item.icon size={19} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="p-4 space-y-2"
          style={{ borderTop: '1px solid var(--primary-700)' }}
        >
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
              المظهر
            </span>
            <ThemeToggle />
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-colors text-white/65 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut size={19} />
            <span className="text-sm font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
