'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Job } from '@/lib/api';
import { AiScoreBadge } from './AiScoreBadge';
import { SourceBadge } from './SourceBadge';
import { FitBadge } from './FitBadge';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, CheckCircle, Loader2, XCircle } from 'lucide-react';

export function JobTable({ jobs }: { jobs: Job[] }) {
  const router = useRouter();

  // If any job is PENDING, refresh the page every 5s until they resolve
  const hasPending = jobs.some(j => j.applicationStatus === 'PENDING');
  useEffect(() => {
    if (!hasPending) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [hasPending, router]);
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        No jobs found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 w-1/3">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Company</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell w-56">Location</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden lg:table-cell">Skills</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Score</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Fit</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Source</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell">Posted</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 line-clamp-1">
                      {job.title}
                    </Link>
                    {job.applicationStatus === 'APPLIED' && (
                      <span title="Applied"><CheckCircle size={14} className="shrink-0 text-green-500" /></span>
                    )}
                    {job.applicationStatus === 'PENDING' && (
                      <span title="Applying…"><Loader2 size={14} className="shrink-0 text-amber-400 animate-spin" /></span>
                    )}
                    {job.applicationStatus === 'FAILED' && (
                      <span title="Apply failed"><XCircle size={14} className="shrink-0 text-red-400" /></span>
                    )}
                  </div>
                  {job.remote && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Remote</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {job.company?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell w-44">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="shrink-0" />
                    <span className="line-clamp-1 max-w-[200px]">{job.location ?? '—'}</span>
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {(job.tags ?? []).slice(0, 3).map((t) => (
                      <span key={t.tag} className="px-1.5 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {t.tag}
                      </span>
                    ))}
                    {(job.tags?.length ?? 0) > 3 && (
                      <span className="text-xs text-slate-400">+{(job.tags?.length ?? 0) - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <AiScoreBadge score={job.aiScore} />
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <FitBadge score={job.fitScore} reason={job.fitReason} />
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <SourceBadge source={job.source} />
                </td>
                <td className="px-3 py-3 text-slate-400 dark:text-slate-500 text-xs hidden md:table-cell whitespace-nowrap w-24">
                  {job.postedAt ? formatDistanceToNow(new Date(job.postedAt)) + ' ago' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
