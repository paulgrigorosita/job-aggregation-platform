export function AiScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
      : score >= 40
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      AI {score}
    </span>
  );
}
