'use client';

import { useEffect, useState } from 'react';
import type { JobFilters } from '@/lib/api';
import { Search } from 'lucide-react';

interface Props {
  filters: JobFilters;
  onFiltersChange: (updates: Partial<JobFilters>) => void;
}

export function FilterBar({ filters, onFiltersChange }: Props) {
  const [q, setQ] = useState(filters.q ?? '');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => onFiltersChange({ q: q || undefined }), 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* AI jobs toggle */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isAI === true}
            onChange={(e) => onFiltersChange({ isAI: e.target.checked ? true : undefined })}
            className="rounded"
          />
          AI jobs only
        </label>

        {/* Sort */}
        <select
          value={filters.sortBy ?? 'postedAt'}
          onChange={(e) => onFiltersChange({ sortBy: e.target.value as JobFilters['sortBy'] })}
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="postedAt">Sort: Date posted</option>
          <option value="aiScore">Sort: AI score</option>
          <option value="firstSeenAt">Sort: Date added</option>
        </select>
      </div>
    </div>
  );
}
