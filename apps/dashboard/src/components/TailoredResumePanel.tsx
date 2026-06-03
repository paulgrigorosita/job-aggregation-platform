'use client';

import { useState } from 'react';
import { tailorResume, fetchTailoredResume, type TailoredResume } from '@/lib/api';
import { FileText, Loader2, Copy, Check, RefreshCw } from 'lucide-react';

export function TailoredResumePanel({ jobId, initial }: { jobId: string; initial?: TailoredResume | null }) {
  const [resume, setResume] = useState<TailoredResume | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await tailorResume(jobId);
      setResume(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate resume');
    } finally {
      setLoading(false);
    }
  };

  const copyAsText = () => {
    if (!resume) return;
    const text = formatResumeAsText(resume);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText size={20} className="text-violet-500" />
          Tailored Resume
        </h2>
        <div className="flex gap-2">
          {resume && (
            <button onClick={copyAsText} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy text'}
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Generating…' : resume ? 'Re-tailor' : 'Tailor Resume'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">{error}</div>
      )}

      {!resume && !loading && (
        <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          Click &quot;Tailor Resume&quot; to generate a customized resume for this job using Claude AI.
          <br />
          <span className="text-xs mt-1 block">Make sure you&apos;ve saved your base resume at <a href="/resume" className="underline">My Resume</a> first.</span>
        </div>
      )}

      {resume && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 space-y-5 text-sm">
          {/* Header */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{resume.name}</h3>
            <p className="text-violet-600 dark:text-violet-400 font-medium mt-0.5">{resume.title}</p>
            <div className="flex flex-wrap gap-3 mt-1 text-slate-500 text-xs">
              {resume.email && <span>{resume.email}</span>}
              {resume.phone && <span>{resume.phone}</span>}
              {resume.linkedinUrl && <a href={resume.linkedinUrl} target="_blank" rel="noopener noreferrer" className="underline">LinkedIn</a>}
              {resume.githubUrl && <a href={resume.githubUrl} target="_blank" rel="noopener noreferrer" className="underline">GitHub</a>}
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Summary</h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{resume.summary}</p>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map((s) => (
                <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Work History */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Work History</h4>
            <div className="space-y-4">
              {resume.workHistory.map((w, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{w.company}</span>
                    <span className="text-xs text-slate-400">{w.duration}</span>
                  </div>
                  <p className="text-violet-600 dark:text-violet-400 text-xs mt-0.5 mb-1.5">{w.title}</p>
                  <ul className="space-y-1">
                    {w.highlights.map((h, hi) => (
                      <li key={hi} className="text-slate-600 dark:text-slate-400 flex gap-2">
                        <span className="text-slate-300 shrink-0">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          {resume.projects && resume.projects.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Projects</h4>
              <div className="space-y-3">
                {resume.projects.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-500 underline">link</a>}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{p.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.tech.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Education</h4>
              <div className="space-y-2">
                {resume.education.map((ed, i) => (
                  <div key={i} className="flex items-baseline justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{ed.institution}</span>
                      <p className="text-xs text-slate-500">{ed.degree} · {ed.field}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-4">{ed.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatResumeAsText(r: TailoredResume): string {
  const lines: string[] = [
    r.name,
    r.title,
    [r.email, r.phone, r.linkedinUrl, r.githubUrl, r.portfolioUrl].filter(Boolean).join(' | '),
    '',
    'SUMMARY',
    r.summary,
    '',
    'SKILLS',
    r.skills.join(', '),
    '',
    'WORK HISTORY',
  ];
  for (const w of r.workHistory) {
    lines.push(`${w.company} — ${w.title} (${w.duration})`);
    for (const h of w.highlights) lines.push(`  • ${h}`);
    lines.push('');
  }
  if (r.projects?.length) {
    lines.push('PROJECTS');
    for (const p of r.projects) {
      lines.push(`${p.name}${p.url ? ` (${p.url})` : ''}`);
      lines.push(`  ${p.description}`);
      lines.push(`  Tech: ${p.tech.join(', ')}`);
      lines.push('');
    }
  }
  if (r.education?.length) {
    lines.push('EDUCATION');
    for (const ed of r.education) {
      lines.push(`${ed.institution} — ${ed.degree}, ${ed.field} (${ed.duration})`);
    }
  }
  return lines.join('\n');
}
