import { ScraperSource, hashUrl, slugify, type NormalizedJob, createHttpClient } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  jobType: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryCurrency?: string;
  jobGeo: string;
  jobIndustry: string[];
  jobTag: string[];
}

interface JobicyResponse {
  apiVersion: string;
  documentationUrl: string;
  friendlyNotice: string;
  jobCount: number;
  jobs: JobicyJob[];
}

export class JobicyScraper extends BaseScraper {
  readonly source = ScraperSource.JOBICY;
  protected readonly strictRemoteFilter = false;
  private readonly http = createHttpClient(process.env.PROXY_URL);

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];

    try {
      const response = await this.http.get<JobicyResponse>(
        'https://jobicy.com/api/v2/remote-jobs?count=50&geo=usa&industry=engineering'
      );

      for (const job of response.jobs ?? []) {
        const { location, remote } = normalizeLocation(job.jobGeo || 'Remote');

        results.push({
          title: normalizeTitle(job.jobTitle),
          companyName: job.companyName,
          companySlug: slugify(job.companyName),
          location,
          remote: remote || true,
          salary: job.annualSalaryMin
            ? { min: job.annualSalaryMin, max: job.annualSalaryMax ?? null, currency: job.salaryCurrency ?? 'USD', period: 'annual' }
            : null,
          applyUrl: job.url,
          urlHash: hashUrl(job.url),
          description: normalizeDescription(job.jobDescription ?? job.jobExcerpt ?? ''),
          postedAt: normalizeDate(job.pubDate),
          source: this.source,
          tags: job.jobTag ?? [],
          aiScore: 0,
          classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
        });
      }
    } catch (err: unknown) {
      this.logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Jobicy fetch failed');
    }

    return results;
  }
}
