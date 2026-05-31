import { ScraperSource, hashUrl, slugify, type NormalizedJob, createHttpClient } from '@jap/shared';
import { db } from '@jap/database';
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

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    const companies = await db.company.findMany({
      where: { atsType: 'ashby', atsSlug: { not: null } },
      select: { name: true, atsSlug: true },
    });

    for (const { name, atsSlug } of companies) {
      try {
        const jobs = await this.fetchCompanyJobs(atsSlug!, name);
        results.push(...jobs);
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const message = err instanceof Error ? err.message : String(err);
        if (status === 401 || status === 404) {
          await db.company.updateMany({ where: { atsSlug: atsSlug!, atsType: 'ashby' }, data: { atsType: null, atsSlug: null } });
          this.logger.debug({ company: atsSlug, status }, 'Ashby board not accessible, removed from tracking');
        } else {
          this.logger.warn({ company: atsSlug, status, message }, 'Failed to scrape Ashby company');
        }
      }
    }

    return results;
  }

  private async fetchCompanyJobs(slug: string, companyName: string): Promise<NormalizedJob[]> {
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
    const response = await this.http.post<AshbyResponse>(apiUrl, { includeCompensation: true });

    const resolvedName = response.jobBoard?.title ?? companyName;
    const companySlug = slugify(slug);

    return (response.jobs ?? []).map((job) => {
      const applyUrl = job.externalLink ?? job.jobUrl ?? `https://jobs.ashbyhq.com/${slug}/${job.id}`;
      const urlHash = hashUrl(applyUrl);
      const { location, remote } = normalizeLocation(
        job.isRemote ? `Remote, ${job.locationName}` : job.locationName
      );

      return {
        title: normalizeTitle(job.title),
        companyName: resolvedName,
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
