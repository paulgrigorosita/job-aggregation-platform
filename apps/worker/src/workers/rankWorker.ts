import { Worker } from 'bullmq';
import { createConnection } from '../redis.js';
import { rankNewJobs } from '../services/jobRanker.js';
import { createLogger } from '@jap/shared';

const logger = createLogger('worker:rank');

export function createRankWorker() {
  const worker = new Worker(
    'rank',
    async () => {
      logger.info('Starting job ranking run');
      const result = await rankNewJobs();
      logger.info(result, 'Job ranking run complete');
      return result;
    },
    {
      connection: createConnection(),
      concurrency: 1, // only one rank job at a time
      lockDuration: 600_000, // 10 min — many API calls possible
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Rank job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Rank worker error');
  });

  return worker;
}
