import { StatsBar } from '@/components/StatsBar';
import { JobsSection } from '@/components/JobsSection';
import { fetchStats } from '@/lib/api';

export const revalidate = 300;

export default async function HomePage() {
  let stats = null;
  try {
    stats = await fetchStats();
  } catch {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          AI & Tech Jobs
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          US-based engineering jobs aggregated from Greenhouse, Lever, Ashby, YC, and Wellfound
        </p>
      </div>

      {stats && <StatsBar stats={stats} />}
      <JobsSection />
    </div>
  );
}
