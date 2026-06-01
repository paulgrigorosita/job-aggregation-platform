export { GreenhouseScraper } from './greenhouse/index.js';
export { discoverGreenhouseCompanies } from './greenhouse/discovery.js';
export { LeverScraper } from './lever/index.js';
export { AshbyScraper } from './ashby/index.js';
export { YCScraper } from './yc/index.js';
export { WellfoundScraper } from './wellfound/index.js';
export { RemotiveScraper } from './remotive/index.js';
export { RemoteOKScraper } from './remoteok/index.js';
export { JobicyScraper } from './jobicy/index.js';
export { HimalayanScraper } from './himalayas/index.js';
export { BaseScraper } from './base/BaseScraper.js';
export { classify, extractTags, isExcludedTitle } from './classifier/index.js';
export { normalizeTitle, normalizeDescription, normalizeLocation, normalizeDate } from './normalizer/index.js';
import { GreenhouseScraper } from './greenhouse/index.js';
import { LeverScraper } from './lever/index.js';
import { AshbyScraper } from './ashby/index.js';
import { YCScraper } from './yc/index.js';
import { WellfoundScraper } from './wellfound/index.js';
import { RemotiveScraper } from './remotive/index.js';
import { RemoteOKScraper } from './remoteok/index.js';
import { JobicyScraper } from './jobicy/index.js';
import { HimalayanScraper } from './himalayas/index.js';
import { ScraperSource, type ScraperResult } from '@jap/shared';
import { BaseScraper } from './base/BaseScraper.js';

export function scraperFactory(source: ScraperSource): BaseScraper {
  switch (source) {
    case ScraperSource.GREENHOUSE: return new GreenhouseScraper();
    case ScraperSource.LEVER: return new LeverScraper();
    case ScraperSource.ASHBY: return new AshbyScraper();
    case ScraperSource.YC: return new YCScraper();
    case ScraperSource.WELLFOUND: return new WellfoundScraper();
    case ScraperSource.REMOTIVE: return new RemotiveScraper();
    case ScraperSource.REMOTEOK: return new RemoteOKScraper();
    case ScraperSource.JOBICY: return new JobicyScraper();
    case ScraperSource.HIMALAYAS: return new HimalayanScraper();
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
