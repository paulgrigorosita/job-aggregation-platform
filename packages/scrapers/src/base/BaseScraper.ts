import { createLogger, isUSRelevant, hashUrl, normalizeCompanyTitle, slugify, ScraperSource, ScraperRunStatus, type NormalizedJob, type ScraperResult, type ScraperStats, type ScraperError } from '@jap/shared';
import { db } from '@jap/database';
import { classify, extractTags, isExcludedTitle } from '../classifier/index.js';

export abstract class BaseScraper {
  abstract readonly source: ScraperSource;
  protected readonly logger = createLogger(`scraper:${this.source}`);

  // Concrete scrapers implement only this — returns raw, unnormalized jobs
  protected abstract fetchAll(): Promise<NormalizedJob[]>;

  async run(): Promise<ScraperResult> {
    const startedAt = Date.now();
    const stats: ScraperStats = {
      fetched: 0,
      normalized: 0,
      usFiltered: 0,
      deduplicated: 0,
      persisted: 0,
      errors: [],
    };

    // Create scraper run record
    const run = await db.scraperRun.create({
      data: { source: this.source, status: ScraperRunStatus.RUNNING },
    });

    let status = ScraperRunStatus.SUCCESS;

    try {
      this.logger.info({ source: this.source }, 'Scraper started');

      const raw = await this.fetchAll();
      stats.fetched = raw.length;
      this.logger.info({ count: raw.length }, 'Fetched raw jobs');

      // Apply classifier and tag extraction to each job
      const classified = raw.map((job) => {
        const { aiScore, flags } = classify(job.title, job.description);
        const tags = extractTags(job.title, job.description);
        return { ...job, aiScore, classifierFlags: flags, tags };
      });
      stats.normalized = classified.length;

      // US filter
      const usJobs = classified.filter((job) => {
        const pass = isUSRelevant(job.location);
        if (!pass) stats.usFiltered++;
        return pass;
      });

      // Exclude non-technical roles
      const technicalJobs = usJobs.filter((job) => {
        const excluded = isExcludedTitle(job.title);
        if (excluded) stats.usFiltered++;
        return !excluded;
      });

      // Remote-only: exclude onsite and hybrid
      const relevantJobs = technicalJobs.filter((job) => {
        const loc = (job.location ?? '').toLowerCase();
        const isOnsite = !job.remote && !/remote/i.test(loc);
        if (isOnsite) stats.usFiltered++;
        return !isOnsite;
      });

      this.logger.info(
        { usFiltered: stats.usFiltered, remaining: relevantJobs.length },
        'After US + relevance filter'
      );

      // Persist with upsert (DB constraint handles dedup)
      let persisted = 0;
      let dupes = 0;
      for (const job of relevantJobs) {
        try {
          const result = await this.persistJob(job);
          if (result === 'new') persisted++;
          else dupes++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          stats.errors.push({ company: job.companyName, url: job.applyUrl, message: msg, retryable: false });
        }
      }
      stats.persisted = persisted;
      stats.deduplicated = dupes;

      if (stats.errors.length > 0 && persisted === 0) {
        status = ScraperRunStatus.FAILED;
      } else if (stats.errors.length > 0) {
        status = ScraperRunStatus.PARTIAL;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error({ err }, 'Scraper run failed');
      stats.errors.push({ message: msg, retryable: true });
      status = ScraperRunStatus.FAILED;
    }

    const durationMs = Date.now() - startedAt;

    await db.scraperRun.update({
      where: { id: run.id },
      data: {
        status,
        jobsFetched: stats.fetched,
        jobsNew: stats.persisted,
        jobsDupe: stats.deduplicated,
        jobsRejected: stats.usFiltered,
        errors: stats.errors.length > 0 ? JSON.parse(JSON.stringify(stats.errors)) : undefined,
        finishedAt: new Date(),
        durationMs,
      },
    });

    this.logger.info({ status, durationMs, stats }, 'Scraper finished');

    return { runId: run.id, source: this.source, status, stats, durationMs };
  }

  private async persistJob(job: NormalizedJob): Promise<'new' | 'existing'> {
    // Ensure company exists (upsert by slug)
    const company = await db.company.upsert({
      where: { slug: job.companySlug },
      create: { name: job.companyName, slug: job.companySlug },
      update: { name: job.companyName },
    });

    // Upsert job by urlHash — DB unique constraint prevents duplicates even under concurrency
    const existing = await db.job.findUnique({ where: { urlHash: job.urlHash } });

    if (existing) {
      await db.job.update({
        where: { urlHash: job.urlHash },
        data: { lastSeenAt: new Date(), isActive: true },
      });
      return 'existing';
    }

    await db.job.create({
      data: {
        urlHash: job.urlHash,
        applyUrl: job.applyUrl,
        title: job.title,
        companyId: company.id,
        location: job.location,
        remote: job.remote,
        salaryMin: job.salary?.min ?? undefined,
        salaryMax: job.salary?.max ?? undefined,
        salaryCurrency: job.salary?.currency ?? 'USD',
        salaryPeriod: job.salary?.period ?? undefined,
        description: job.description,
        postedAt: job.postedAt ?? undefined,
        source: job.source,
        aiScore: job.aiScore,
        isAI: job.classifierFlags.isAI,
        isFullStack: job.classifierFlags.isFullStack,
        isBackend: job.classifierFlags.isBackend,
        isFrontend: job.classifierFlags.isFrontend,
        tags: {
          createMany: {
            data: job.tags.map((tag) => ({ tag })),
            skipDuplicates: true,
          },
        },
      },
    });

    return 'new';
  }
}
