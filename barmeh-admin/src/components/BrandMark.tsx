"use client";

import React from 'react';

export default function BrandMark({
  size = 40,
  withWordmark = false,
  variant = 'gold',
  className = '',
}: {
  size?: number;
  withWordmark?: boolean;
  variant?: 'gold' | 'mono-light' | 'mono-dark';
  className?: string;
}) {
  const colors = {
    gold: { bg: 'var(--gold-500)', fg: 'var(--primary-900)', accent: 'var(--gold-700)' },
    'mono-light': { bg: 'transparent', fg: '#ffffff', accent: '#ffffff' },
    'mono-dark': { bg: 'transparent', fg: 'var(--primary-900)', accent: 'var(--primary-900)' },
  }[variant];

  return (
    <div className={`flex items-center gap-3 ${className}`} dir="rtl">
      <div
        className="rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
        style={{
          width: size,
          height: size,
          background: variant === 'gold'
            ? `linear-gradient(135deg, var(--gold-400) 0%, var(--gold-600) 100%)`
            : colors.bg,
          boxShadow: variant === 'gold' ? 'var(--shadow-gold)' : undefined,
        }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          width={size * 0.55}
          height={size * 0.55}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 18 Q20 6 32 18 L32 32 L8 32 Z"
            stroke={colors.fg}
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M14 14 L14 28 M14 14 L20 14 Q23 14 23 17 Q23 20 20 20 L14 20 M14 20 L21 20 Q24 20 24 24 Q24 28 21 28 L14 28"
            stroke={colors.fg}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            transform="scale(0.85) translate(2.5, 1)"
          />
        </svg>
      </div>

      {withWordmark && (
        <div className="flex flex-col">
          <span
            className="font-extrabold text-xl leading-none tracking-tight"
            style={{ color: variant === 'mono-light' ? '#fff' : 'inherit' }}
          >
            برمة
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1"
            style={{
              color: variant === 'gold' ? 'var(--gold-500)'
                : variant === 'mono-light' ? 'var(--gold-300)'
                : 'var(--primary-500)'
            }}
          >
            BARMEH
          </span>
        </div>
      )}
    </div>
  );
}
