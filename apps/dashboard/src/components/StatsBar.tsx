import type { StatsResponse } from '@jap/shared';
import { Briefcase, Building2, Brain, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function StatsBar({ stats }: { stats: StatsResponse }) {
  const lastSeen = stats.lastScrapedAt
    ? formatDistanceToNow(new Date(stats.lastScrapedAt)) + ' ago'
    : 'Never';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { icon: Briefcase, label: 'Total Jobs', value: stats.totalJobs.toLocaleString() },
        { icon: Building2, label: 'Companies', value: stats.totalCompanies.toLocaleString() },
        { icon: Brain, label: 'AI Jobs', value: stats.aiJobs.toLocaleString() },
        { icon: Clock, label: 'Last Scraped', value: lastSeen },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <Icon size={16} />
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        </div>
      ))}
    </div>
  );
}
