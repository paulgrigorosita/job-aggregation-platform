export enum ScraperSource {
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  ASHBY = 'ashby',
  YC = 'yc',
  WELLFOUND = 'wellfound',
  REMOTIVE = 'remotive',
  REMOTEOK = 'remoteok',
  JOBICY = 'jobicy',
  HIMALAYAS = 'himalayas',
}

export interface SalaryRange {
  min: number | null;
  max: number | null;
  currency: string;
  period: 'annual' | 'hourly';
}

export interface ClassifierFlags {
  isAI: boolean;
  isFullStack: boolean;
  isBackend: boolean;
  isFrontend: boolean;
}

export interface NormalizedJob {
  title: string;
  companyName: string;
  companySlug: string;
  location: string;
  remote: boolean;
  salary: SalaryRange | null;
  applyUrl: string;
  urlHash: string;
  description: string;
  postedAt: Date | null;
  source: ScraperSource;
  tags: string[];
  aiScore: number;
  classifierFlags: ClassifierFlags;
}
