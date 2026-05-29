const SOURCE_COLORS: Record<string, string> = {
  greenhouse: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  lever: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ashby: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  yc: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  wellfound: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

export function SourceBadge({ source }: { source: string }) {
  const color = SOURCE_COLORS[source] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
      {source}
    </span>
  );
}
