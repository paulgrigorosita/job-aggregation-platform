import { chromium } from 'playwright';
import { ScraperSource, hashUrl, slugify, parseSalary, type NormalizedJob, createLogger } from '@jap/shared';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation } from '../normalizer/index.js';

interface WellfoundJob {
  title: string;
  startupName: string;
  remoteConfig?: { kind?: string };
  description?: string;
  salary?: string;
  angellistUrl?: string;
  liveStartAt?: string;
  locationNames?: string[];
}

interface GraphQLResponse {
  data?: {
    jobSearchResults?: {
      startupJobs?: Array<{
        title: string;
        startup: { name: string; slug: string };
        remoteConfig?: { kind?: string };
        description?: string;
        salary?: string;
        angellistUrl?: string;
        liveStartAt?: string;
        locationNames?: string[];
      }>;
    };
    talent?: {
      jobListings?: Array<{
        job: WellfoundJob & { startup?: { name: string; slug: string } };
      }>;
    };
  };
}

export class WellfoundScraper extends BaseScraper {
  readonly source = ScraperSource.WELLFOUND;
  protected readonly logger = createLogger('scraper:wellfound');

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
        viewport: { width: 1366 + Math.floor(Math.random() * 400), height: 768 + Math.floor(Math.random() * 200) },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();
      const intercepted: NormalizedJob[] = [];

      // Intercept GraphQL and API responses
      page.on('response', async (response) => {
        const url = response.url();
        if (!url.includes('wellfound.com') && !url.includes('angel.co')) return;
        const ct = response.headers()['content-type'] ?? '';
        if (!ct.includes('application/json')) return;
        try {
          const body = await response.json() as GraphQLResponse;
          const jobs = this.extractJobsFromGraphQL(body);
          if (jobs.length > 0) intercepted.push(...jobs);
        } catch {}
      });

      await page.goto('https://wellfound.com/jobs?role=software-engineer&remote=true&location=United+States', {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      // Wait for initial data then scroll
      await new Promise((r) => setTimeout(r, 4000));
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
      }

      // Debug: capture screenshot to see what the browser actually loaded
      if (intercepted.length === 0) {
        const screenshotPath = `/tmp/wellfound-debug-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: false });
        this.logger.warn({ screenshotPath }, 'Wellfound intercepted 0 jobs — screenshot saved for debugging');
      }

      results.push(...intercepted);
      this.logger.debug({ count: results.length }, 'Wellfound jobs collected');
    } catch (err: unknown) {
      this.logger.error({ err }, 'Wellfound Playwright scrape failed');
    } finally {
      if (browser) await browser.close();
    }

    return results;
  }

  private extractJobsFromGraphQL(body: GraphQLResponse): NormalizedJob[] {
    const jobs: NormalizedJob[] = [];

    const rawJobs =
      body.data?.jobSearchResults?.startupJobs ??
      body.data?.talent?.jobListings?.map((l) => ({ ...l.job, startup: l.job.startup })) ??
      [];

    for (const raw of rawJobs) {
      try {
        const companyName = (raw as { startup?: { name: string; slug: string } }).startup?.name ?? 'Unknown';
        const companySlug = slugify((raw as { startup?: { name: string; slug: string } }).startup?.slug ?? companyName);
        const isRemote = raw.remoteConfig?.kind === 'REMOTE_ALLOWED' || raw.remoteConfig?.kind === 'REMOTE_ONLY';
        const locName = raw.locationNames?.[0] ?? (isRemote ? 'Remote' : '');
        const { location, remote } = normalizeLocation(isRemote ? `Remote, ${locName}` : locName);
        const applyUrl = raw.angellistUrl ?? `https://wellfound.com/jobs`;
        if (!raw.angellistUrl) return jobs; // skip if no direct URL

        jobs.push({
          title: normalizeTitle(raw.title ?? ''),
          companyName,
          companySlug,
          location,
          remote: isRemote || remote,
          salary: parseSalary(raw.salary ?? null),
          applyUrl,
          urlHash: hashUrl(applyUrl),
          description: normalizeDescription(raw.description ?? ''),
          postedAt: raw.liveStartAt ? new Date(raw.liveStartAt) : null,
          source: this.source,
          tags: [],
          aiScore: 0,
          classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
        });
      } catch {}
    }

    return jobs;
  }
}
