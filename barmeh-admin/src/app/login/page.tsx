"use client";

import React, { useState } from 'react';
import { Lock, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import BrandMark from '@/components/BrandMark';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [userId, setUserId] = useState('');
  const [show2fa, setShow2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.requires2fa) {
        setShow2fa(true);
        setUserId(response.data.userId);
      } else {
        const { accessToken, user } = response.data;
        if (!user.isAdmin) {
          throw new Error('عذراً، هذا الحساب ليس له صلاحيات دخول للإدارة');
        }
        localStorage.setItem('admin_token', accessToken);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-2fa', { userId, code: twoFactorCode });
      const { accessToken, user } = response.data;

      if (!user.isAdmin) {
        throw new Error('عذراً، هذا الحساب ليس له صلاحيات دخول للإدارة');
      }

      localStorage.setItem('admin_token', accessToken);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-mesh flex items-center justify-center p-6 relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full blur-[140px] opacity-30"
           style={{ background: 'radial-gradient(circle, var(--gold-500) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] rounded-full blur-[140px] opacity-20"
           style={{ background: 'radial-gradient(circle, var(--primary-400) 0%, transparent 70%)' }} />

      <div className="absolute inset-0 pattern-dots opacity-[0.08] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <BrandMark size={72} variant="gold" />
          </motion.div>

          <div className="text-center mt-6">
            <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight">
              برمة
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-300 mb-3">
              Barmeh · Admin
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
              <ShieldCheck size={14} className="text-gold-400" />
              <span>{show2fa ? 'تحقّق من تيلجرام لإدخال الرمز' : 'لوحة الإدارة المركزية'}</span>
            </div>
          </div>
        </div>

        <div className="glass-dark p-8 rounded-3xl shadow-2xl"
             style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08)' }}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-sm font-medium text-center mb-6"
            >
              {error}
            </motion.div>
          )}

          {!show2fa ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 mr-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-card/5 border border-white/10 rounded-xl px-12 py-3.5 text-white text-left placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                    placeholder="admin@example.com"
                    required
                  />
                  <Mail className="absolute right-4 top-3.5 text-slate-500" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 mr-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-card/5 border border-white/10 rounded-xl px-12 py-3.5 text-white text-left placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <Lock className="absolute right-4 top-3.5 text-slate-500" size={20} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-gold text-primary-900 font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: 'var(--shadow-gold)' }}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2fa} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 text-center">
                  رمز التحقق (Telegram)
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="······"
                  className="w-full bg-white dark:bg-card/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-3xl font-bold tracking-[0.8em] focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <p className="text-[11px] text-slate-500 mt-3 text-center leading-relaxed">
                  أرسلنا رمزاً مكوّناً من 6 أرقام<br />
                  إلى حساب التيلجرام المرتبط
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-gold text-primary-900 font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                style={{ boxShadow: 'var(--shadow-gold)' }}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                ) : (
                  <span>تأكيد الرمز والدخول</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShow2fa(false)}
                className="w-full text-slate-400 text-xs font-bold hover:text-gold-300 transition-colors"
              >
                ← العودة لتسجيل الدخول
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-slate-500 text-xs leading-relaxed">
          محمي بواسطة نظام تشفير برمة المتطوّر
          <br />
          <span className="text-slate-600 dark:text-slate-300">© {new Date().getFullYear()} Barmeh · جميع الحقوق محفوظة</span>
        </p>
      </motion.div>
    </div>
  );
}
