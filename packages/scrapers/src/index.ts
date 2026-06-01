export { GreenhouseScraper } from './greenhouse/index.js';
export { discoverGreenhouseCompanies } from './greenhouse/discovery.js';
export { BaseScraper } from './base/BaseScraper.js';
export { classify, extractTags, isExcludedTitle } from './classifier/index.js';
export { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from './normalizer/index.js';
import { GreenhouseScraper } from './greenhouse/index.js';
import { ScraperSource, type ScraperResult } from '@jap/shared';
import { BaseScraper } from './base/BaseScraper.js';

export function scraperFactory(source: ScraperSource): BaseScraper {
  switch (source) {
    case ScraperSource.GREENHOUSE: return new GreenhouseScraper();
  }
}

export async function runAllScrapers(
  sources: ScraperSource[] = Object.values(ScraperSource),
  concurrency = Number(process.env.SCRAPER_CONCURRENCY ?? 2)
): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];
  const queue = [...sources];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const source = queue.shift();
      if (!source) break;
      const scraper = scraperFactory(source);
      try {
        results.push(await scraper.run());
      } catch (err: unknown) {
        console.error(`Scraper ${source} crashed:`, err);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}
