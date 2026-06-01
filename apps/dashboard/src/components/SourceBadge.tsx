const SOURCE_COLORS: Record<string, string> = {
  greenhouse: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
};

export function SourceBadge({ source }: { source: string }) {
  const color = SOURCE_COLORS[source] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  const label = SOURCE_LABELS[source] ?? source;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
