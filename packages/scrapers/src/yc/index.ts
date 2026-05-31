import { chromium } from 'playwright';
import { ScraperSource, hashUrl, slugify, type NormalizedJob, createLogger } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

const TECH_ROLES = [
  'engineer', 'developer', 'software', 'fullstack', 'backend', 'frontend',
  'ml', 'ai', 'machine learning', 'data', 'platform', 'infrastructure', 'devops',
  'sre', 'architect', 'technical', 'scientist',
];

type YCJob = { id: number; title: string; remote: boolean; description: string; country_codes?: string[]; created_at: string; job_url?: string };
type YCCompany = { name: string; slug: string; jobs: YCJob[] };

export class YCScraper extends BaseScraper {
  readonly source = ScraperSource.YC;

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const seen = new Set<number>();
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
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
      });

      const page = await context.newPage();

      // Intercept all JSON responses — workatastartup may call various subdomains
      page.on('response', async (response) => {
        const url = response.url();
        if (
          !url.includes('workatastartup.com') &&
          !url.includes('ycombinator.com') &&
          !url.includes('yc-oss.github.io')
        ) return;
        const ct = response.headers()['content-type'] ?? '';
        if (!ct.includes('application/json') && !ct.includes('text/json')) return;
        try {
          const body = await response.json();
          this.extractFromBody(body, seen, results);
        } catch {}
      });

      const urls = [
        'https://www.workatastartup.com/jobs?role=eng&remote=true',
        'https://www.workatastartup.com/companies?batch=&industry=&subindustry=&technology=&remote=true&cofounder=false&ba=false&jobType=fulltime&role=eng&jobSlug=',
      ];

      for (const url of urls) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
          await new Promise((r) => setTimeout(r, 3000));

          // Scroll to trigger lazy-loading
          for (let i = 0; i < 4; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
            await new Promise((r) => setTimeout(r, 2000));
          }

          // Try to extract from embedded __NEXT_DATA__ or window.__STATE__
          const embedded = await page.evaluate(() => {
            const el = document.getElementById('__NEXT_DATA__');
            if (el?.textContent) return el.textContent;
            return null;
          });
          if (embedded) {
            try {
              const parsed = JSON.parse(embedded);
              this.extractFromBody(parsed, seen, results);
            } catch {}
          }
        } catch (err: unknown) {
          this.logger.warn({ url, err: err instanceof Error ? err.message : String(err) }, 'YC page load failed');
        }

        if (results.length > 0) break;
      }

      if (results.length === 0) {
        const screenshotPath = `/tmp/yc-debug-${Date.now()}.png`;
        try {
          await page.screenshot({ path: screenshotPath, fullPage: false });
        } catch {}
        this.logger.warn({ screenshotPath }, 'YC intercepted 0 jobs — screenshot saved for debugging');
      }

      await context.close();
    } catch (err: unknown) {
      this.logger.error({ err: err instanceof Error ? err.message : String(err) }, 'YC Playwright scrape failed');
    } finally {
      if (browser) await browser.close();
    }

    return results;
  }

  private extractFromBody(body: unknown, seen: Set<number>, results: NormalizedJob[]) {
    if (!body || typeof body !== 'object') return;
    const companies: YCCompany[] = (body as Record<string, unknown>)?.companies as YCCompany[] ??
      (Array.isArray(body) ? body as YCCompany[] : []);

    for (const company of companies) {
      if (!company?.jobs) continue;
      for (const job of company.jobs ?? []) {
        if (!job?.id || seen.has(job.id)) continue;
        const titleLower = (job.title ?? '').toLowerCase();
        if (!TECH_ROLES.some((r) => titleLower.includes(r))) continue;

        seen.add(job.id);
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
  }
}
