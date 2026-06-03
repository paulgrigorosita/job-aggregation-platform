'use client';

import { useState } from 'react';
import { tailorResume, type TailoredResume } from '@/lib/api';
import { FileText, Loader2, Copy, Check, RefreshCw, Download } from 'lucide-react';

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
  <title>${resume.name} — Resume</title>
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
      @page { margin: 0.5in; size: letter; }
      .role { page-break-inside: avoid; }
      .project { page-break-inside: avoid; }
      .edu-row { page-break-inside: avoid; }
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

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
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
