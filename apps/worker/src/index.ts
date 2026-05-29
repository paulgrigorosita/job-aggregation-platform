import 'dotenv/config';
import { createLogger } from '@jap/shared';
import { createScrapeWorker } from './workers/scrapeWorker.js';
import { createEmbedWorker } from './workers/embedWorker.js';
import { createAlertWorker } from './workers/alertWorker.js';
import { initScheduler } from './scheduler.js';

const logger = createLogger('worker:main');

async function main() {
  logger.info('Starting job aggregation workers');

  // Initialize the cron scheduler
  await initScheduler();

  // Start workers
  const scrapeWorker = createScrapeWorker();
  const embedWorker = createEmbedWorker();
  const alertWorker = createAlertWorker();

  logger.info('All workers started');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down workers');

    await Promise.all([
      scrapeWorker.close(),
      embedWorker?.close(),
      alertWorker.close(),
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
