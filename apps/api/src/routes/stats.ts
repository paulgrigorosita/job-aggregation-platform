import type { FastifyInstance } from 'fastify';
import { db } from '@jap/database';

export async function statsRoutes(app: FastifyInstance) {
  app.get('/stats', {
    schema: { tags: ['stats'], summary: 'Platform statistics' },
    async handler(_request, reply) {
      const [
        totalJobs,
        totalCompanies,
        aiJobs,
        jobsBySource,
        topTags,
        lastRun,
      ] = await Promise.all([
        db.job.count({ where: { isActive: true } }),
        db.company.count(),
        db.job.count({ where: { isActive: true, isAI: true } }),
        db.job.groupBy({
          by: ['source'],
          where: { isActive: true },
          _count: { source: true },
        }),
        db.jobTag.groupBy({
          by: ['tag'],
          _count: { tag: true },
          orderBy: { _count: { tag: 'desc' } },
          take: 20,
        }),
        db.scraperRun.findFirst({ orderBy: { startedAt: 'desc' } }),
      ]);

      return reply.send({
        totalJobs,
        totalCompanies,
        aiJobs,
        jobsBySource: Object.fromEntries(jobsBySource.map((r) => [r.source, r._count.source])),
        topTags: topTags.map((t) => ({ tag: t.tag, count: t._count.tag })),
        lastScrapedAt: lastRun?.finishedAt?.toISOString() ?? null,
      });
    },
  });
}
