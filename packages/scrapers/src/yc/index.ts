import { ScraperSource, hashUrl, slugify, type NormalizedJob, createHttpClient } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

interface YCJob {
  id: number;
  title: string;
  company_name: string;
  company_slug: string;
  locations: string[];
  remote: boolean;
  description: string;
  url: string;
  created_at: string;
  ats_name?: string;
  ats_job_url?: string;
}

interface YCResponse {
  jobs: YCJob[];
}

const TECH_ROLES = [
  'engineer', 'developer', 'software', 'fullstack', 'backend', 'frontend',
  'ml', 'ai', 'machine learning', 'data', 'platform', 'infrastructure', 'devops',
  'sre', 'architect', 'technical',
];

export class YCScraper extends BaseScraper {
  readonly source = ScraperSource.YC;
  private readonly http = createHttpClient(process.env.PROXY_URL);

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];

    try {
      // YC Work at a Startup API
      const url = 'https://www.workatastartup.com/company_filters?demographic=any&hasEquity=any&hasSalary=any&industry=any&interviewProcess=any&jobType=any&layout=list-compact&role=eng&sortBy=jobs&tab=any&usVisaNotRequired=any';

      const response = await this.http.get(url, {
        headers: { Accept: 'application/json', 'x-requested-with': 'XMLHttpRequest' },
      }).json<{ companies: Array<{ name: string; slug: string; jobs: Array<{ id: number; title: string; remote: boolean; description: string; country_codes?: string[]; created_at: string; job_url?: string }> }> }>();

      const companies = response?.companies ?? [];

      for (const company of companies) {
        for (const job of company.jobs ?? []) {
          const titleLower = job.title.toLowerCase();
          if (!TECH_ROLES.some((r) => titleLower.includes(r))) continue;

          const location = job.remote ? 'Remote' : (job.country_codes?.includes('US') ? 'United States' : '');
          const applyUrl = job.job_url ?? `https://www.workatastartup.com/jobs/${job.id}`;
          const urlHash = hashUrl(applyUrl);
          const { location: loc, remote } = normalizeLocation(location);

          results.push({
            title: normalizeTitle(job.title),
            companyName: company.name,
            companySlug: slugify(company.slug ?? company.name),
            location: loc,
            remote,
            salary: null,
            applyUrl,
            urlHash,
            description: normalizeDescription(job.description ?? ''),
            postedAt: normalizeDate(job.created_at),
            source: this.source,
            tags: [],
            aiScore: 0,
            classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
          });
        }
      }
    } catch (err: unknown) {
      this.logger.warn({ err }, 'YC API fetch failed, trying alternate endpoint');
      // Fallback: scrape the jobs search page
      const fallbackJobs = await this.fetchFallback();
      results.push(...fallbackJobs);
    }

    return results;
  }

  private async fetchFallback(): Promise<NormalizedJob[]> {
    try {
      const response = await this.http
        .get('https://www.workatastartup.com/jobs?role=eng', {
          headers: { Accept: 'application/json' },
        })
        .json<YCResponse>();

      return (response.jobs ?? []).map((job) => {
        const location = job.remote ? 'Remote' : job.locations?.[0] ?? '';
        const { location: loc, remote } = normalizeLocation(location);
        const applyUrl = job.ats_job_url ?? job.url ?? `https://www.workatastartup.com/jobs/${job.id}`;
        return {
          title: normalizeTitle(job.title),
          companyName: job.company_name,
          companySlug: slugify(job.company_slug ?? job.company_name),
          location: loc,
          remote,
          salary: null,
          applyUrl,
          urlHash: hashUrl(applyUrl),
          description: normalizeDescription(job.description ?? ''),
          postedAt: normalizeDate(job.created_at),
          source: this.source,
          tags: [],
          aiScore: 0,
          classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
        };
      });
    } catch {
      return [];
    }
  }
}
