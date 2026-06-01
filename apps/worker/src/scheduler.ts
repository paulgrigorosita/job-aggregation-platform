import { scrapeQueue } from './queues.js';
import { ScraperSource } from '@jap/shared';
import { createLogger } from '@jap/shared';

const logger = createLogger('scheduler');

// Cron schedule per source (server TZ is UTC)
const SCHEDULES: Array<{ source: ScraperSource; cron: string; description: string }> = [
  { source: ScraperSource.GREENHOUSE, cron: '0 */2 * * *', description: 'Every 2 hours' },
  { source: ScraperSource.LEVER, cron: '30 */2 * * *', description: 'Every 2 hours (offset 30m)' },
  { source: ScraperSource.ASHBY, cron: '0 */3 * * *', description: 'Every 3 hours' },
  { source: ScraperSource.YC, cron: '0 */4 * * *', description: 'Every 4 hours' },
  { source: ScraperSource.WELLFOUND, cron: '0 6,18 * * *', description: 'Twice daily (Playwright is expensive)' },
  { source: ScraperSource.REMOTIVE, cron: '15 */2 * * *', description: 'Every 2 hours (offset 15m)' },
  { source: ScraperSource.REMOTEOK, cron: '45 */2 * * *', description: 'Every 2 hours (offset 45m)' },
  { source: ScraperSource.JOBICY, cron: '20 */3 * * *', description: 'Every 3 hours' },
  { source: ScraperSource.HIMALAYAS, cron: '50 */3 * * *', description: 'Every 3 hours (offset 50m)' },
];

export async function initScheduler(): Promise<void> {
  // Clear existing repeatable jobs to avoid duplicates on restart
  const existing = await scrapeQueue.getRepeatableJobs();
  await Promise.all(existing.map((job) => scrapeQueue.removeRepeatableByKey(job.key)));

  for (const { source, cron, description } of SCHEDULES) {
    await scrapeQueue.add(
      `scrape:${source}`,
      { source },
      { repeat: { pattern: cron }, jobId: `scheduled:${source}` }
    );
    logger.info({ source, cron, description }, 'Scheduled scrape job');
  }

  logger.info('Scheduler initialized');
}

export async function triggerImmediateScrape(source?: ScraperSource): Promise<void> {
  const sources = source ? [source] : Object.values(ScraperSource);
  for (const src of sources) {
    await scrapeQueue.add(`scrape:${src}:immediate`, { source: src }, { priority: 1 });
    logger.info({ source: src }, 'Triggered immediate scrape');
  }
}
