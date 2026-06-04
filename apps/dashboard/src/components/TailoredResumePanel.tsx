'use client';

import { useState, useEffect, useRef } from 'react';
import { tailorResume, autoApply, previewFill, fetchApplyStatus, type TailoredResume, type ApplyStatus, BASE_URL } from '@/lib/api';
import { FileText, Loader2, Copy, Check, RefreshCw, Download, Send, CheckCircle, XCircle, Eye, X } from 'lucide-react';

export function TailoredResumePanel({
  jobId,
  initial,
  initialApplyStatus,
}: {
  jobId: string;
  initial?: TailoredResume | null;
  initialApplyStatus?: ApplyStatus | null;
}) {
  const [resume, setResume] = useState<TailoredResume | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyStatus, setApplyStatus] = useState<ApplyStatus | null>(initialApplyStatus ?? null);
  const [applying, setApplying] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // screenshotUrl busts cache on each new preview run
  const [screenshotCacheBuster, setScreenshotCacheBuster] = useState(Date.now());
  const screenshotUrl = `${BASE_URL}/jobs/${jobId}/apply/screenshot?t=${screenshotCacheBuster}`;

  // Poll for apply status while PENDING
  useEffect(() => {
    if (applyStatus?.applicationStatus === 'PENDING') {
      pollRef.current = setInterval(async () => {
        try {
          const s = await fetchApplyStatus(jobId);
          setApplyStatus(s);
          if (s.applicationStatus !== 'PENDING' && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch { /* ignore */ }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [applyStatus?.applicationStatus, jobId]);

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

  const downloadPDF = () => {
    if (!resume) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const contact = `
      <table class="contact-table">
        <tr>
          <td>&#x1F4CD; Anytown, AZ, 85000</td>
          ${resume.linkedinUrl ? `<td><span class="contact-label">LinkedIn:</span> <a href="${resume.linkedinUrl}">${resume.linkedinUrl.replace('https://', '')}</a></td>` : '<td></td>'}
        </tr>
        <tr>
          <td>&#9993; <a href="mailto:${resume.email}">${resume.email}</a></td>
          ${resume.githubUrl ? `<td><span class="contact-label">GitHub:</span> <a href="${resume.githubUrl}">${resume.githubUrl.replace('https://', '')}</a></td>` : '<td></td>'}
        </tr>
        <tr>
          <td>&#9990; ${resume.phone}</td>
          ${resume.portfolioUrl ? `<td><span class="contact-label">Portfolio:</span> <a href="${resume.portfolioUrl}">${resume.portfolioUrl.replace('https://', '')}</a></td>` : '<td></td>'}
        </tr>
      </table>`;

    const workHTML = resume.workHistory.map(w => `
      <div class="role">
        <div class="role-header">
          <span class="role-company">${w.company}</span>
          <span class="role-duration">${w.duration}</span>
        </div>
        <div class="role-title">${w.title}</div>
        <ul>${w.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
      </div>`).join('');

    const projectsHTML = resume.projects?.length ? `
      <div class="section-title">Projects</div>
      ${resume.projects.map(p => `
        <div class="project">
          <span class="project-name">${p.name}</span>${p.url ? ` &mdash; <a href="${p.url}" class="link">${p.url}</a>` : ''}
          <div class="project-desc">${p.description}</div>
          <div class="project-tech">${p.tech.join(' &middot; ')}</div>
        </div>`).join('')}` : '';

    const educationHTML = resume.education?.length ? `
      <div class="section-title">Education</div>
      ${resume.education.map(ed => `
        <div class="edu-row">
          <div>
            <div class="edu-inst">${ed.institution}</div>
            <div class="edu-detail">${ed.degree} &mdash; ${ed.field}</div>
          </div>
          <div class="edu-duration">${ed.duration}</div>
        </div>`).join('')}` : '';

    const skillsHTML = resume.skills.map(s => `<span class="skill">${s}</span>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title></title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a1a1a;
      padding: 36px 44px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 24pt; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 3px; }
    .title { font-size: 12pt; color: #5b21b6; font-weight: 600; margin-bottom: 6px; }
    .contact-table { width: 100%; border-collapse: collapse; font-size: 9pt; color: #444; margin-bottom: 18px; }
    .contact-table td { padding: 1.5px 0; width: 50%; vertical-align: top; }
    .contact-table a { color: #1a1a1a; text-decoration: none; }
    .contact-label { font-weight: 600; color: #1a1a1a; }
    .divider { border: none; border-top: 1.5px solid #e5e7eb; margin: 0 0 14px; }
    .section-title {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 3px;
      margin: 16px 0 8px;
    }
    .summary { color: #333; font-size: 10pt; line-height: 1.6; }
    .skills { display: flex; flex-wrap: wrap; gap: 5px; }
    .skill {
      background: #f3f0ff;
      color: #5b21b6;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 9pt;
      font-weight: 500;
    }
    .role { margin-bottom: 12px; }
    .role-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
    .role-company { font-weight: 700; font-size: 10.5pt; }
    .role-duration { font-size: 9pt; color: #888; }
    .role-title { font-size: 9.5pt; color: #5b21b6; font-weight: 600; margin-bottom: 4px; }
    ul { padding-left: 14px; }
    li { margin-bottom: 2px; color: #333; font-size: 10pt; }
    .project { margin-bottom: 10px; }
    .project-name { font-weight: 700; font-size: 10.5pt; }
    .link { color: #5b21b6; font-size: 9pt; text-decoration: none; }
    .project-desc { color: #444; font-size: 9.5pt; margin-top: 2px; }
    .project-tech { font-size: 9pt; color: #888; margin-top: 2px; }
    .edu-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .edu-inst { font-weight: 700; font-size: 10.5pt; }
    .edu-detail { font-size: 9.5pt; color: #555; margin-top: 1px; }
    .edu-duration { font-size: 9pt; color: #888; white-space: nowrap; margin-left: 12px; }
    @media print {
      body { padding: 24px 32px; }
      .role { page-break-inside: avoid; }
      .project { page-break-inside: avoid; }
      .edu-row { page-break-inside: avoid; }
    }
    @page {
      margin: 0.5in;
      size: letter;
      @top-left { content: none; }
      @top-center { content: none; }
      @top-right { content: none; }
      @bottom-left { content: none; }
      @bottom-center { content: none; }
      @bottom-right { content: none; }
    }
  </style>
</head>
<body>
  <h1>${resume.name}</h1>
  <div class="title">${resume.title}</div>
  ${contact}
  <hr class="divider"/>

  <div class="section-title">Summary</div>
  <div class="summary">${resume.summary}</div>

  <div class="section-title">Skills</div>
  <div class="skills">${skillsHTML}</div>

  <div class="section-title">Work History</div>
  ${workHTML}

  ${projectsHTML}
  ${educationHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    printWindow.location.href = url;
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  };

  const copyAsText = () => {
    if (!resume) return;
    const text = formatResumeAsText(resume);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerPreview = async () => {
    setPreviewing(true);
    setPreviewReady(false);
    setError(null);
    try {
      await previewFill(jobId);
      // Poll until the screenshot file exists (API returns 200)
      previewPollRef.current = setInterval(async () => {
        try {
          const res = await fetch(screenshotUrl, { method: 'HEAD' });
          if (res.ok) {
            setScreenshotCacheBuster(Date.now());
            setPreviewReady(true);
            setShowPreview(true);
            setPreviewing(false);
            if (previewPollRef.current) {
              clearInterval(previewPollRef.current);
              previewPollRef.current = null;
            }
          }
        } catch { /* keep polling */ }
      }, 2000);
      // Timeout after 90s
      setTimeout(() => {
        if (previewPollRef.current) {
          clearInterval(previewPollRef.current);
          previewPollRef.current = null;
          setPreviewing(false);
          setError('Preview timed out — check worker logs');
        }
      }, 90_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to queue preview');
      setPreviewing(false);
    }
  };

  const triggerApply = async () => {
    setApplying(true);
    setError(null);
    try {
      await autoApply(jobId);
      setApplyStatus({ applicationStatus: 'PENDING', appliedAt: null, applyError: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to queue application');
    } finally {
      setApplying(false);
    }
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
            <>
              <button onClick={copyAsText} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy text'}
              </button>
              <div className="relative group">
                <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Download size={14} />
                  Download PDF
                </button>
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 hidden group-hover:block z-10 leading-relaxed">
                  In the print dialog: uncheck <strong>Headers and footers</strong> to remove the date, URL, and page number.
                </div>
              </div>
            </>
          )}
          {/* Preview Fill button */}
          <button
            onClick={previewing ? undefined : (previewReady ? () => setShowPreview(true) : triggerPreview)}
            disabled={!resume}
            title={!resume ? 'Generate a tailored resume first' : previewReady ? 'View last screenshot' : 'Fill the form and take a screenshot without submitting'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {previewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            {previewing ? 'Filling…' : previewReady ? 'View Preview' : 'Preview Fill'}
          </button>
          {/* Auto Apply button + status */}
          {applyStatus?.applicationStatus === 'APPLIED' ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle size={14} />
              Applied
            </span>
          ) : applyStatus?.applicationStatus === 'FAILED' ? (
            <span title={applyStatus.applyError ?? ''} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg cursor-help">
              <XCircle size={14} />
              Apply failed
            </span>
          ) : applyStatus?.applicationStatus === 'PENDING' ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Loader2 size={14} className="animate-spin" />
              Applying…
            </span>
          ) : (
            <button
              onClick={triggerApply}
              disabled={applying || !resume}
              title={!resume ? 'Generate a tailored resume first' : 'Auto-fill and submit the Greenhouse application'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {applying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {applying ? 'Queuing…' : 'Auto Apply'}
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
              {resume.portfolioUrl && <a href={resume.portfolioUrl} target="_blank" rel="noopener noreferrer" className="underline">Portfolio</a>}
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
                <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300">{s}</span>
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
                        <span className="text-slate-300 shrink-0">•</span>{h}
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

      {/* Screenshot modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowPreview(false)}>
          <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Eye size={16} className="text-violet-500" />
                Form Preview — filled but not submitted
              </span>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[80vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl}
                alt="Filled application form preview"
                className="w-full rounded border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex justify-between items-center">
              <span>Looks correct? Click <strong>Auto Apply</strong> to submit.</span>
              <button onClick={() => setShowPreview(false)} className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Close</button>
            </div>
          </div>
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
