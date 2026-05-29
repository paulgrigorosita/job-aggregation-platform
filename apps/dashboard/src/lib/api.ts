import type { StatsResponse } from '@jap/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface Job {
  id: string;
  title: string;
  applyUrl: string;
  location?: string;
  remote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  postedAt?: string;
  source: string;
  aiScore: number;
  isAI: boolean;
  isFullStack: boolean;
  isBackend: boolean;
  isFrontend: boolean;
  firstSeenAt: string;
  company?: { name: string; slug: string; logoUrl?: string };
  tags?: Array<{ tag: string }>;
}

export interface JobFilters {
  q?: string;
  company?: string;
  source?: string;
  remote?: boolean;
  isAI?: boolean;
  isFullStack?: boolean;
  isBackend?: boolean;
  isFrontend?: boolean;
  tags?: string;
  salaryMin?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface PaginatedJobs {
  data: Job[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

async function apiFetch<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchJobs = (filters: JobFilters = {}) =>
  apiFetch<PaginatedJobs>('/jobs', filters as Record<string, unknown>);

export const fetchJob = (id: string) => apiFetch<Job>(`/jobs/${id}`);

export const fetchStats = () => apiFetch<StatsResponse>('/stats');
