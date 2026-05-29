'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  meta: { page: number; totalPages: number; total: number; pageSize: number };
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: Props) {
  const { page, totalPages } = meta;
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
