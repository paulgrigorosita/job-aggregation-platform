import { Worker } from 'bullmq';
import { createConnection } from '../redis.js';
import { createLogger } from '@jap/shared';
import { applyToJob } from '../services/applyService.js';

const logger = createLogger('worker:apply');

export function createApplyWorker() {
  const worker = new Worker<{ jobId: string }>(
    'apply',
    async (job) => {
      logger.info({ jobId: job.data.jobId }, 'Starting auto-apply');
      await applyToJob(job.data.jobId);
    },
    {
      connection: createConnection(),
      concurrency: 1,
      lockDuration: 120_000,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.data.jobId }, 'Auto-apply completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.data.jobId, err }, 'Auto-apply failed');
  });

  return worker;
}
