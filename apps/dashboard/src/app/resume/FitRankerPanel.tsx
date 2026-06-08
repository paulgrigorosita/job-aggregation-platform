'use client';

import { useState } from 'react';
import { runFitRanker } from '@/lib/api';
import { Sparkles, Loader2 } from 'lucide-react';

export function FitRankerPanel() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setMessage(null);
    setError(null);
    try {
      const result = await runFitRanker();
      if (result.status === 'NOOP') {
        setMessage('No unranked jobs found — everything is already scored.');
      } else {
        setMessage(`Queued fit-score calculation for ${result.unrankedCount ?? 'all'} unranked job(s). This runs in the background — refresh the job list in a bit to see scores appear.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start ranking');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
        <Sparkles size={20} className="text-violet-500" />
        Fit Score Calculator
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Score every existing job against this resume using Claude AI. New scrapes are ranked automatically —
        use this to backfill jobs that don&apos;t have a fit score yet.
      </p>
      <button
        onClick={run}
        disabled={running}
        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors"
      >
        {running ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {running ? 'Starting…' : 'Run Fit Calculator'}
      </button>
      {message && (
        <div className="mt-3 p-3 text-sm text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 rounded-lg">{message}</div>
      )}
      {error && (
        <div className="mt-3 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>
      )}
    </div>
  );
}
