export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface JobFilters {
  q?: string;
  company?: string;
  source?: string;
  remote?: boolean;
  isAI?: boolean;
  tags?: string;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'postedAt' | 'aiScore' | 'firstSeenAt';
  sortDir?: 'asc' | 'desc';
}

export interface StatsResponse {
  totalJobs: number;
  totalCompanies: number;
  aiJobs: number;
  jobsBySource: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  lastScrapedAt: string | null;
}
