interface Props {
  score: number | null | undefined;
  reason?: string | null;
}

export function FitBadge({ score, reason }: Props) {
  if (score === null || score === undefined || score === -1) return null;

  const color =
    score >= 75 ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' :
    score >= 50 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';

  return (
    <span
      title={reason ?? undefined}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-default ${color}`}
    >
      Fit {score}%
    </span>
  );
}
