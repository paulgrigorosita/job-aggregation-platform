'use client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Zap, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-brand-600 dark:text-brand-400">
          <Zap size={20} />
          JAP Jobs
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Jobs</Link>
          <Link href="/resume" className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
            <FileText size={15} /> My Resume
          </Link>
          <a href="/api/v1/feed.xml" target="_blank" className="hover:text-slate-900 dark:hover:text-white">RSS</a>
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
