import { ScraperSource, hashUrl, slugify, parseSalary, type NormalizedJob, createHttpClient } from '@jap/shared';
import { db } from '@jap/database';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation } from '../normalizer/index.js';

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    location?: string;
    commitment?: string;
    department?: string;
    team?: string;
    workplaceType?: string;
  };
  description: string;
  descriptionPlain: string;
  lists: Array<{ text: string; content: string }>;
  additional: string;
  additionalPlain: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  tags: string[];
  salaryRange?: { min: number; max: number; currency: string; interval: string };
}

interface LeverResponse {
  data: LeverPosting[];
  next?: string;
}

export class LeverScraper extends BaseScraper {
  readonly source = ScraperSource.LEVER;
  protected readonly strictRemoteFilter = true;
  private readonly http = createHttpClient(process.env.PROXY_URL);

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    const companies = await db.company.findMany({
      where: { atsType: 'lever', atsSlug: { not: null } },
      select: { name: true, atsSlug: true },
    });

    for (const { name, atsSlug } of companies) {
      try {
        const jobs = await this.fetchCompanyJobs(atsSlug!, name);
        results.push(...jobs);
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const message = err instanceof Error ? err.message : String(err);
        if (status === 404) {
          await db.company.updateMany({ where: { atsSlug: atsSlug!, atsType: 'lever' }, data: { atsType: null, atsSlug: null } });
          this.logger.debug({ company: atsSlug }, 'Lever board not found (404), removed from tracking');
        } else {
          this.logger.warn({ company: atsSlug, status, message }, 'Failed to scrape Lever company');
        }
      }
    }

    return results;
  }

  private async fetchCompanyJobs(slug: string, companyName: string): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    let nextUrl: string | undefined = `https://api.lever.co/v0/postings/${slug}?mode=json&limit=500`;

    while (nextUrl) {
      const response = await this.http.get<LeverResponse>(nextUrl);
      const postings = Array.isArray(response) ? (response as LeverPosting[]) : response.data;

      // Log first posting's location fields to debug filtering
      if (postings?.length && results.length === 0) {
        this.logger.debug({ sample: { location: postings[0].categories?.location, workplaceType: postings[0].categories?.workplaceType } }, 'Lever location sample');
      }

      for (const posting of postings ?? []) {
        const workplaceType = posting.categories?.workplaceType ?? '';
        const isRemote = /remote/i.test(workplaceType) || /remote/i.test(posting.categories?.location ?? '');
        const rawLocation = isRemote ? 'Remote' : (posting.categories?.location ?? '');
        const { location, remote } = normalizeLocation(rawLocation);
        const fullHtml = [posting.description, ...(posting.lists ?? []).map((l) => l.content), posting.additional].join('\n');
        const urlHash = hashUrl(posting.hostedUrl);

        results.push({
          title: normalizeTitle(posting.text),
          companyName,
          companySlug: slugify(slug),
          location,
          remote,
          salary: posting.salaryRange
            ? {
                min: posting.salaryRange.min,
                max: posting.salaryRange.max,
                currency: posting.salaryRange.currency || 'USD',
                period: posting.salaryRange.interval === 'yearly' ? 'annual' : 'hourly',
              }
            : parseSalary(posting.descriptionPlain),
          applyUrl: posting.hostedUrl,
          urlHash,
          description: normalizeDescription(fullHtml),
          postedAt: posting.createdAt ? new Date(posting.createdAt) : null,
          source: this.source,
          tags: posting.tags ?? [],
          aiScore: 0,
          classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
        });
      }

      // next is a full URL per Lever docs — use as-is
      nextUrl = typeof response === 'object' && !Array.isArray(response) ? response.next : undefined;
    }

    this.logger.debug({ company: slug, count: results.length }, 'Lever company scraped');
    return results;
  }
}
