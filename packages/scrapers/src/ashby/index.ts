import { ScraperSource, hashUrl, slugify, type NormalizedJob, createHttpClient } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

interface AshbyJob {
  id: string;
  title: string;
  locationName: string;
  isRemote: boolean;
  descriptionHtml?: string;
  descriptionPlain?: string;
  publishedDate?: string;
  externalLink?: string;
  jobUrl?: string;
  compensationTierSummary?: string;
}

interface AshbyResponse {
  jobs: AshbyJob[];
  jobBoard?: { title: string };
}

export class AshbyScraper extends BaseScraper {
  readonly source = ScraperSource.ASHBY;
  private readonly http = createHttpClient(process.env.PROXY_URL);

  private get companies(): string[] {
    return (process.env.ASHBY_COMPANIES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];

    for (const slug of this.companies) {
      try {
        const jobs = await this.fetchCompanyJobs(slug);
        results.push(...jobs);
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      } catch (err: unknown) {
        this.logger.warn({ company: slug, err }, 'Failed to scrape Ashby company');
      }
    }

    return results;
  }

  private async fetchCompanyJobs(slug: string): Promise<NormalizedJob[]> {
    // Use Ashby's official public posting API
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
    const response = await this.http
      .post(apiUrl, {
        json: { includeCompensation: true },
        headers: { 'Content-Type': 'application/json' },
      })
      .json<AshbyResponse>();

    const companyName = response.jobBoard?.title ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const companySlug = slugify(slug);

    return (response.jobs ?? []).map((job) => {
      const applyUrl = job.externalLink ?? job.jobUrl ?? `https://jobs.ashbyhq.com/${slug}/${job.id}`;
      const urlHash = hashUrl(applyUrl);
      const { location, remote } = normalizeLocation(
        job.isRemote ? `Remote, ${job.locationName}` : job.locationName
      );

      return {
        title: normalizeTitle(job.title),
        companyName,
        companySlug,
        location,
        remote: job.isRemote || remote,
        salary: null, // Ashby compensation is complex; skip for now
        applyUrl,
        urlHash,
        description: normalizeDescription(job.descriptionHtml ?? job.descriptionPlain ?? ''),
        postedAt: normalizeDate(job.publishedDate),
        source: this.source,
        tags: [],
        aiScore: 0,
        classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
      };
    });
  }
}
