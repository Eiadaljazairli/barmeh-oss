import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/AppToaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "برمة | لوحة التحكم",
  description: "لوحة الإدارة المركزية لسوق برمة — Barmeh marketplace admin portal",
  icons: {
    icon: '/favicon.ico',
  },
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('barmeh-theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a1f1f" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${cairo.variable} antialiased`}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
