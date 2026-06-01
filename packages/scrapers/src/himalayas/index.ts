import { ScraperSource, hashUrl, slugify, type NormalizedJob, createHttpClient } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

interface HimalayasJob {
  id: string;
  title: string;
  slug: string;
  applicationLink: string;
  description: string;
  publishedAt: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  tags: string[];
  company: {
    name: string;
    slug: string;
    logoUrl?: string;
  };
}

interface HimalayasResponse {
  jobs: HimalayasJob[];
  total: number;
}

export class HimalayanScraper extends BaseScraper {
  readonly source = ScraperSource.HIMALAYAS;
  protected readonly strictRemoteFilter = false;
  private readonly http = createHttpClient(process.env.PROXY_URL);

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    const seen = new Set<string>();

    const queries = ['software', 'backend', 'frontend', 'fullstack', 'devops', 'data', 'machine-learning'];

    for (const q of queries) {
      try {
        const response = await this.http.get<HimalayasResponse>(
          `https://himalayas.app/jobs/api?q=${q}&limit=100`
        );

        for (const job of response.jobs ?? []) {
          if (!job.applicationLink || seen.has(job.id)) continue;
          seen.add(job.id);

          const applyUrl = job.applicationLink;
          const { location, remote } = normalizeLocation(
            job.isRemote ? `Remote, ${job.location ?? ''}` : (job.location ?? '')
          );

          results.push({
            title: normalizeTitle(job.title),
            companyName: job.company.name,
            companySlug: slugify(job.company.slug ?? job.company.name),
            location,
            remote: job.isRemote || remote,
            salary: job.salaryMin
              ? { min: job.salaryMin, max: job.salaryMax ?? null, currency: job.salaryCurrency ?? 'USD', period: 'annual' }
              : null,
            applyUrl,
            urlHash: hashUrl(applyUrl),
            description: normalizeDescription(job.description ?? ''),
            postedAt: normalizeDate(job.publishedAt),
            source: this.source,
            tags: job.tags ?? [],
            aiScore: 0,
            classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
          });
        }

        await new Promise((r) => setTimeout(r, 400));
      } catch (err: unknown) {
        this.logger.warn({ q, err: err instanceof Error ? err.message : String(err) }, 'Himalayas query failed');
      }
    }

    return results;
  }
}
