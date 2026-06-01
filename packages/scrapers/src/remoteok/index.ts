import { ScraperSource, hashUrl, slugify, type NormalizedJob, createHttpClient } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

interface RemoteOKJob {
  id: string;
  url: string;
  title: string;
  company: string;
  company_logo?: string;
  tags: string[];
  date: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  // first element is a metadata object, not a job — filter it out
  slug?: string;
}

export class RemoteOKScraper extends BaseScraper {
  readonly source = ScraperSource.REMOTEOK;
  protected readonly strictRemoteFilter = false; // RemoteOK is remote-only by nature
  private readonly http = createHttpClient(process.env.PROXY_URL);

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];

    try {
      // RemoteOK returns an array where the first element is metadata — skip it
      const raw = await this.http.get<RemoteOKJob[]>('https://remoteok.com/api');

      const jobs = Array.isArray(raw) ? raw.slice(1) : [];

      for (const job of jobs) {
        if (!job.url || !job.title || !job.company) continue;

        const applyUrl = job.url.startsWith('http') ? job.url : `https://remoteok.com${job.url}`;
        const { location, remote } = normalizeLocation(job.location || 'Remote');

        results.push({
          title: normalizeTitle(job.title),
          companyName: job.company,
          companySlug: slugify(job.company),
          location,
          remote: remote || true,
          salary: job.salary_min
            ? { min: job.salary_min, max: job.salary_max ?? null, currency: 'USD', period: 'annual' }
            : null,
          applyUrl,
          urlHash: hashUrl(applyUrl),
          description: normalizeDescription(job.description ?? ''),
          postedAt: normalizeDate(job.date),
          source: this.source,
          tags: job.tags ?? [],
          aiScore: 0,
          classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
        });
      }
    } catch (err: unknown) {
      this.logger.error({ err: err instanceof Error ? err.message : String(err) }, 'RemoteOK fetch failed');
    }

    return results;
  }
}
