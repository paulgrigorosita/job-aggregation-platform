import 'dotenv/config';
import { createLogger } from '@jap/shared';
import { createScrapeWorker } from './workers/scrapeWorker.js';
import { createEmbedWorker } from './workers/embedWorker.js';
import { createAlertWorker } from './workers/alertWorker.js';
import { createRankWorker } from './workers/rankWorker.js';
import { initScheduler, triggerImmediateScrape } from './scheduler.js';
import { discoverGreenhouseCompanies } from '@jap/scrapers';

const logger = createLogger('worker:main');

async function main() {
  logger.info('Starting job aggregation workers');

  // Discover new Greenhouse companies before first scrape
  discoverGreenhouseCompanies().catch((err) =>
    logger.warn({ err }, 'Greenhouse discovery failed')
  );

  // Initialize the cron scheduler and trigger immediate first run
  await initScheduler();
  await triggerImmediateScrape();

  // Start workers
  const scrapeWorker = createScrapeWorker();
  const embedWorker = createEmbedWorker();
  const alertWorker = createAlertWorker();
  const rankWorker = createRankWorker();

  logger.info('All workers started');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down workers');

    await Promise.all([
      scrapeWorker.close(),
      embedWorker?.close(),
      alertWorker.close(),
      rankWorker.close(),
    ]);

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Worker startup failed:', err);
  process.exit(1);
});
