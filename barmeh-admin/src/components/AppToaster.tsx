"use client";

import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      dir="rtl"
      richColors
      closeButton
      expand
      visibleToasts={4}
      toastOptions={{
        style: {
          fontFamily: 'var(--font-cairo), var(--font-inter), system-ui, sans-serif',
          fontWeight: 600,
        },
        className: 'rtl-toast',
      }}
    />
  );
}
