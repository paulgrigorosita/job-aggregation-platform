import { ScraperSource, hashUrl, slugify, type NormalizedJob, createHttpClient } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveResponse {
  'job-count': number;
  jobs: RemotiveJob[];
}

const CATEGORIES = [
  'software-dev',
  'devops-sysadmin',
  'data',
  'product',
];

export class RemotiveScraper extends BaseScraper {
  readonly source = ScraperSource.REMOTIVE;
  protected readonly strictRemoteFilter = false; // Remotive is remote-only by nature
  private readonly http = createHttpClient(process.env.PROXY_URL);

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    const seen = new Set<number>();

    for (const category of CATEGORIES) {
      try {
        const response = await this.http.get<RemotiveResponse>(
          `https://remotive.com/api/remote-jobs?category=${category}&limit=100`
        );

        for (const job of response.jobs ?? []) {
          if (seen.has(job.id)) continue;
          seen.add(job.id);

          const companySlug = slugify(job.company_name);
          const { location, remote } = normalizeLocation(
            job.candidate_required_location || 'Remote'
          );

          results.push({
            title: normalizeTitle(job.title),
            companyName: job.company_name,
            companySlug,
            location,
            remote: remote || true,
            salary: null,
            applyUrl: job.url,
            urlHash: hashUrl(job.url),
            description: normalizeDescription(job.description ?? ''),
            postedAt: normalizeDate(job.publication_date),
            source: this.source,
            tags: job.tags ?? [],
            aiScore: 0,
            classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
          });
        }

        await new Promise((r) => setTimeout(r, 500));
      } catch (err: unknown) {
        this.logger.warn({ category, err: err instanceof Error ? err.message : String(err) }, 'Remotive category fetch failed');
      }
    }

    return results;
  }
}
