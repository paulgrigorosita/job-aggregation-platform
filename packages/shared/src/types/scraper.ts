import type { ScraperSource } from './job.js';

export enum ScraperRunStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export interface ScraperError {
  company?: string;
  url?: string;
  message: string;
  retryable: boolean;
}

export interface ScraperStats {
  fetched: number;
  normalized: number;
  usFiltered: number;
  deduplicated: number;
  persisted: number;
  errors: ScraperError[];
}

export interface ScraperResult {
  runId: string;
  source: ScraperSource;
  status: ScraperRunStatus;
  stats: ScraperStats;
  durationMs: number;
}
