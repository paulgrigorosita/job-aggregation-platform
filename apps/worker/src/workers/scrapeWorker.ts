import { Worker, type Job } from 'bullmq';
import { createConnection } from '../redis.js';
import { scrapeQueue, type ScrapeJobData } from '../queues.js';
import { scraperFactory } from '@jap/scrapers';
import { createLogger } from '@jap/shared';

const logger = createLogger('worker:scrape');

export function createScrapeWorker() {
  const worker = new Worker<ScrapeJobData>(
    'scrape',
    async (job: Job<ScrapeJobData>) => {
      const { source } = job.data;
      logger.info({ source, jobId: job.id }, 'Processing scrape job');

      const scraper = scraperFactory(source);
      const result = await scraper.run();

      logger.info(
        { source, status: result.status, stats: result.stats, durationMs: result.durationMs },
        'Scrape job completed'
      );

      return result;
    },
    {
      connection: createConnection(),
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
      limiter: {
        max: 5,
        duration: 60_000,
      },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, source: job?.data?.source, err }, 'Scrape job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Scrape worker error');
  });

  return worker;
}
