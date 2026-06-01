import { ScraperSource, hashUrl, slugify, type NormalizedJob, createHttpClient } from '@jap/shared';
import { XMLParser } from 'fast-xml-parser';
import { BaseScraper } from '../base/BaseScraper.js';
import { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from '../normalizer/index.js';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  'dc:company': string;
  region: string;
  description: string;
  type: string;
}

const FEEDS = [
  'https://weworkremotely.com/categories/remote-programming-jobs.rss',
  'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
  'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
  'https://weworkremotely.com/categories/remote-data-science-jobs.rss',
];

export class WeWorkRemotelyScraper extends BaseScraper {
  readonly source = ScraperSource.WEWORKREMOTELY;
  protected readonly strictRemoteFilter = false; // WWR is remote-only by design
  private readonly http = createHttpClient(process.env.PROXY_URL);
  private readonly parser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });

  protected async fetchAll(): Promise<NormalizedJob[]> {
    const results: NormalizedJob[] = [];
    const seen = new Set<string>();

    for (const feedUrl of FEEDS) {
      try {
        const xml = await this.http.get<string>(feedUrl, { responseType: 'text' } as never);
        const parsed = this.parser.parse(xml as unknown as string);
        const items: RSSItem[] = parsed?.rss?.channel?.item ?? [];

        for (const item of Array.isArray(items) ? items : [items]) {
          const url = item.link;
          if (!url || seen.has(url)) continue;
          seen.add(url);

          const companyName = item['dc:company'] ?? 'Unknown';
          const { location, remote } = normalizeLocation(item.region || 'Remote');

          results.push({
            title: normalizeTitle(item.title ?? ''),
            companyName,
            companySlug: slugify(companyName),
            location,
            remote: remote || true,
            salary: null,
            applyUrl: url,
            urlHash: hashUrl(url),
            description: normalizeDescription(item.description ?? ''),
            postedAt: normalizeDate(item.pubDate),
            source: this.source,
            tags: [],
            aiScore: 0,
            classifierFlags: { isAI: false, isFullStack: false, isBackend: false, isFrontend: false },
          });
        }

        await new Promise((r) => setTimeout(r, 500));
      } catch (err: unknown) {
        this.logger.warn({ feedUrl, err: err instanceof Error ? err.message : String(err) }, 'WWR feed fetch failed');
      }
    }

    return results;
  }
}
