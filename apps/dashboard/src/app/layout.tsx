import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'JAP - AI & Tech Jobs',
  description: 'US-based AI, Full-Stack, and Engineering jobs aggregated from top ATS providers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <Providers>
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
