'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJobs, type JobFilters } from '@/lib/api';
import { FilterBar } from './FilterBar';
import { JobTable } from './JobTable';
import { Pagination } from './Pagination';

export function JobsSection() {
  const [filters, setFilters] = useState<JobFilters>({ page: 1, pageSize: 25, sortBy: 'postedAt', sortDir: 'desc' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => fetchJobs(filters),
  });

  const updateFilters = useCallback((updates: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates, page: 'page' in updates ? updates.page : 1 }));
  }, []);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onFiltersChange={updateFilters} />

      {isLoading && (
        <div className="text-center py-12 text-slate-500">Loading jobs...</div>
      )}
      {isError && (
        <div className="text-center py-12 text-red-500">Failed to load jobs. Is the API running?</div>
      )}
      {data && (
        <>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {data.meta.total.toLocaleString()} jobs found
          </div>
          <JobTable jobs={data.data} />
          <Pagination meta={data.meta} onPageChange={(page) => updateFilters({ page })} />
        </>
      )}
    </div>
  );
}
