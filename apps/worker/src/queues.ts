import { Queue } from 'bullmq';
import { createConnection } from './redis.js';
import { ScraperSource } from '@jap/shared';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

export const scrapeQueue = new Queue('scrape', {
  connection: createConnection(),
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const embedQueue = new Queue('embed', {
  connection: createConnection(),
  defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 2 },
});

export const alertQueue = new Queue('alert', {
  connection: createConnection(),
  defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 2 },
});

export const rankQueue = new Queue('rank', {
  connection: createConnection(),
  defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 2 },
});

export interface ScrapeJobData {
  source: ScraperSource;
}

export interface EmbedJobData {
  jobId: string;
}

export interface AlertJobData {
  jobId: string;
  channel: 'discord' | 'telegram';
}
