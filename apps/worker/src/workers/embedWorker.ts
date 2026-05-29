import { Worker, type Job } from 'bullmq';
import { createConnection } from '../redis.js';
import { db } from '@jap/database';
import { createLogger } from '@jap/shared';
import type { EmbedJobData } from '../queues.js';

const logger = createLogger('worker:embed');

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    });
    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    return data.data[0]?.embedding ?? null;
  } catch (err: unknown) {
    logger.warn({ err }, 'OpenAI embedding failed');
    return null;
  }
}

export function createEmbedWorker() {
  if (!process.env.OPENAI_API_KEY) {
    logger.info('OPENAI_API_KEY not set, embed worker disabled');
    return null;
  }

  const worker = new Worker<EmbedJobData>(
    'embed',
    async (job: Job<EmbedJobData>) => {
      const { jobId } = job.data;
      const dbJob = await db.job.findUnique({ where: { id: jobId } });
      if (!dbJob) return;

      const text = `${dbJob.title}\n\n${dbJob.description ?? ''}`;
      const embedding = await generateEmbedding(text);
      if (!embedding) return;

      // Store as raw SQL because Prisma doesn't natively support pgvector writes
      await db.$executeRaw`
        UPDATE jobs SET embedding = ${JSON.stringify(embedding)}::vector WHERE id = ${jobId}
      `;

      logger.debug({ jobId }, 'Embedding stored');
    },
    {
      connection: createConnection(),
      concurrency: 2,
      limiter: { max: 10, duration: 60_000 }, // OpenAI rate limits
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.data?.jobId, err }, 'Embed job failed');
  });

  return worker;
}
