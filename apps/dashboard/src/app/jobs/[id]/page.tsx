import { fetchJob } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';
import { AiScoreBadge } from '@/components/AiScoreBadge';
import { SourceBadge } from '@/components/SourceBadge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, MapPin, DollarSign, Building2 } from 'lucide-react';

export default async function JobPage({ params }: { params: { id: string } }) {
  let job;
  try {
    job = await fetchJob(params.id);
  } catch {
    notFound();
  }

  const salary =
    job.salaryMin && job.salaryMax
      ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
      : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6">
        <ArrowLeft size={16} /> Back to jobs
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-slate-600 dark:text-slate-400">
              <Building2 size={16} />
              <span className="font-medium">{job.company?.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AiScoreBadge score={job.aiScore} />
            <SourceBadge source={job.source} />
            {job.remote && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Remote
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {job.location}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1">
              <DollarSign size={14} /> {salary}/yr
            </span>
          )}
          {job.postedAt && (
            <span>{formatDistanceToNow(new Date(job.postedAt))} ago</span>
          )}
        </div>

        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {job.tags.map((t: { tag: string }) => (
              <span key={t.tag} className="px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {t.tag}
              </span>
            ))}
          </div>
        )}

        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
        >
          Apply Now <ExternalLink size={16} />
        </a>

        {job.description && (
          <div className="mt-8 prose dark:prose-invert max-w-none">
            {/<[a-z][\s\S]*>/i.test(job.description) || job.description.includes('&lt;')
              ? <div dangerouslySetInnerHTML={{ __html: job.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ') }} />
              : <ReactMarkdown>{job.description}</ReactMarkdown>
            }
          </div>
        )}
      </div>
    </div>
  );
}
