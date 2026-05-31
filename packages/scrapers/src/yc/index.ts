import { chromium } from 'playwright';
import { ScraperSource, hashUrl, slugify, type NormalizedJob, createLogger } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

const TECH_ROLES = [
  'engineer', 'developer', 'software', 'fullstack', 'backend', 'frontend',
  'ml', 'ai', 'machine learning', 'data', 'platform', 'infrastructure', 'devops',
  'sre', 'architect', 'technical', 'scientist',
];

export class YCScraper extends BaseScraper {
  readonly source = ScraperSource.YC;
  protected readonly logger = createLogger('scraper:yc');

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    let browser;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        ...(process.env.PROXY_URL ? { proxy: { server: process.env.PROXY_URL } } : {}),
      });

      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      const page = await context.newPage();

      // Intercept JSON API responses
      page.on('response', async (response) => {
        const url = response.url();
        if (!url.includes('workatastartup.com')) return;
        const ct = response.headers()['content-type'] ?? '';
        if (!ct.includes('application/json')) return;
        try {
          const body = await response.json();
          const companies: Array<{ name: string; slug: string; jobs: Array<{ id: number; title: string; remote: boolean; description: string; country_codes?: string[]; created_at: string; job_url?: string }> }> =
            body?.companies ?? (Array.isArray(body) ? body : []);

          for (const company of companies) {
            for (const job of company.jobs ?? []) {
              const titleLower = job.title.toLowerCase();
              if (!TECH_ROLES.some((r) => titleLower.includes(r))) continue;

              const location = job.remote ? 'Remote' : (job.country_codes?.includes('US') ? 'United States' : '');
              const applyUrl = job.job_url ?? `https://www.workatastartup.com/jobs/${job.id}`;
              const { location: loc, remote } = normalizeLocation(location);

              results.push({
                title: normalizeTitle(job.title),
                companyName: company.name,
                companySlug: slugify(company.slug ?? company.name),
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
              });
            }
          }
        } catch {}
      });

      // Load the page — this triggers the API calls
      await page.goto(
        'https://www.workatastartup.com/jobs?role=eng&remote=true',
        { waitUntil: 'networkidle', timeout: 60_000 }
      );

      // Scroll to trigger lazy loads
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await new Promise((r) => setTimeout(r, 2500));
      }

      await context.close();
    } catch (err: unknown) {
      this.logger.error({ err: err instanceof Error ? err.message : String(err) }, 'YC Playwright scrape failed');
    } finally {
      if (browser) await browser.close();
    }

    return results;
  }
}
