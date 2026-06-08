export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface StatsResponse {
  totalJobs: number;
  totalCompanies: number;
  aiJobs: number;
  jobsBySource: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  lastScrapedAt: string | null;
}

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
  fitScore?: number | null;
  fitReason?: string | null;
  tailoredResume?: TailoredResume | null;
  applicationStatus?: 'PENDING' | 'APPLIED' | 'FAILED' | null;
  appliedAt?: string | null;
  applyError?: string | null;
  company?: { name: string; slug: string; logoUrl?: string };
  tags?: Array<{ tag: string }>;
}

export interface WorkEntry {
  company: string;
  duration: string;
  title: string;
  highlights: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  duration: string;
}

export interface ProjectEntry {
  name: string;
  url?: string;
  description: string;
  tech: string[];
}

export interface ResumeProfile {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  title: string;
  summary: string;
  skills: string[];
  workHistory: WorkEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
}

export type TailoredResume = ResumeProfile;

export interface JobFilters {
  q?: string;
  company?: string;
  source?: string;
  remote?: boolean;
  isAI?: boolean;
  isFullStack?: boolean;
  isBackend?: boolean;
  isFrontend?: boolean;
  bestFit?: boolean;
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

async function apiFetch<T>(path: string, params?: Record<string, unknown>, init?: RequestInit): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    cache: 'no-store',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchJobs = (filters: JobFilters = {}) =>
  apiFetch<PaginatedJobs>('/jobs', filters as Record<string, unknown>);

export const fetchJob = (id: string) => apiFetch<Job>(`/jobs/${id}`);

export const fetchStats = () => apiFetch<StatsResponse>('/stats');

export const fetchResume = () => apiFetch<ResumeProfile | null>('/resume');

export const saveResume = (data: ResumeProfile) =>
  apiFetch<ResumeProfile>('/resume', undefined, { method: 'PUT', body: JSON.stringify(data) });

export const tailorResume = (jobId: string) =>
  apiFetch<TailoredResume>(`/jobs/${jobId}/tailor`, undefined, { method: 'POST' });

export const fetchTailoredResume = (jobId: string) =>
  apiFetch<TailoredResume | null>(`/jobs/${jobId}/tailor`);

export interface ApplyStatus {
  applicationStatus: 'PENDING' | 'APPLIED' | 'FAILED' | null;
  appliedAt: string | null;
  applyError: string | null;
}

export const autoApply = (jobId: string) =>
  apiFetch<{ status: string }>(`/jobs/${jobId}/apply`, undefined, { method: 'POST' });

export const previewFill = (jobId: string) =>
  apiFetch<{ status: string }>(`/jobs/${jobId}/apply`, { dryRun: 'true' }, { method: 'POST' });

export const fetchApplyStatus = (jobId: string) =>
  apiFetch<ApplyStatus>(`/jobs/${jobId}/apply-status`);
