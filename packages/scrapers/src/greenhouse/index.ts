import { ScraperSource, hashUrl, slugify, parseSalary, type NormalizedJob, createHttpClient } from '@jap/shared';
import { db } from '@jap/database';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  absolute_url: string;
  location: { name: string };
  content: string;
  salary_min?: number;
  salary_max?: number;
  departments?: Array<{ name: string }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
  meta?: { total: number };
}

export class GreenhouseScraper extends BaseScraper {
  readonly source = ScraperSource.GREENHOUSE;
  private readonly http = createHttpClient(process.env.PROXY_URL);

  private async getCompanies(): Promise<Array<{ name: string; atsSlug: string }>> {
    const rows = await db.company.findMany({
      where: { atsType: 'greenhouse', atsSlug: { not: null } },
      select: { name: true, atsSlug: true },
    });
    return rows.map((r) => ({ name: r.name, atsSlug: r.atsSlug! }));
  }

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    const companies = await this.getCompanies();

    for (const { name, atsSlug: slug } of companies) {
      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`;
        const response = await this.http.get<GreenhouseResponse>(url);

        for (const job of response.jobs ?? []) {
          const { location, remote } = normalizeLocation(job.location?.name ?? '');
          const urlHash = hashUrl(job.absolute_url);

          results.push({
            title: normalizeTitle(job.title),
            companyName: name,
            companySlug: slugify(slug),
            location,
            remote,
            salary:
              job.salary_min || job.salary_max
                ? { min: job.salary_min ?? null, max: job.salary_max ?? null, currency: 'USD', period: 'annual' }
                : parseSalary(job.content),
            applyUrl: job.absolute_url,
            urlHash,
            description: normalizeDescription(job.content ?? ''),
            postedAt: normalizeDate(job.updated_at),
            source: this.source,
            tags: [],
            aiScore: 0,
            classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
          });
        }

        this.logger.debug({ company: slug, count: response.jobs?.length ?? 0 }, 'Greenhouse company scraped');
        // Polite delay
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const message = err instanceof Error ? err.message : String(err);
        if (status === 404) {
          // Company no longer on Greenhouse — clear ATS info to skip next time
          await db.company.updateMany({ where: { atsSlug: slug, atsType: 'greenhouse' }, data: { atsType: null, atsSlug: null } });
          this.logger.debug({ company: slug }, 'Greenhouse board not found (404), removed from tracking');
        } else {
          this.logger.warn({ company: slug, status, message }, 'Failed to scrape Greenhouse company');
        }
      }
    }

    return results;
  }
}
