import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '@jap/database';
import { ScraperSource } from '@jap/shared';

const JobFiltersSchema = z.object({
  q: z.string().optional(),
  company: z.string().optional(),
  source: z.nativeEnum(ScraperSource).optional(),
  remote: z.coerce.boolean().optional(),
  isAI: z.coerce.boolean().optional(),
  isFullStack: z.coerce.boolean().optional(),
  isBackend: z.coerce.boolean().optional(),
  isFrontend: z.coerce.boolean().optional(),
  tags: z.string().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  sortBy: z.enum(['postedAt', 'aiScore', 'firstSeenAt']).default('postedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export async function jobRoutes(app: FastifyInstance) {
  app.get('/jobs', {
    schema: {
      tags: ['jobs'],
      summary: 'List jobs with filters',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          company: { type: 'string' },
          source: { type: 'string' },
          remote: { type: 'boolean' },
          isAI: { type: 'boolean' },
          page: { type: 'number' },
          pageSize: { type: 'number' },
          sortBy: { type: 'string' },
          sortDir: { type: 'string' },
        },
      },
    },
    async handler(request, reply) {
      const query = JobFiltersSchema.parse(request.query);
      const { page, pageSize, sortBy, sortDir, q, company, source, remote, isAI, isFullStack, isBackend, isFrontend, tags, salaryMin, salaryMax } = query;

      const where: Record<string, unknown> = { isActive: true };

      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { company: { name: { contains: q, mode: 'insensitive' } } },
        ];
      }
      if (company) where.company = { slug: { contains: company, mode: 'insensitive' } };
      if (source) where.source = source;
      if (remote !== undefined) where.remote = remote;
      if (isAI !== undefined) where.isAI = isAI;
      if (isFullStack !== undefined) where.isFullStack = isFullStack;
      if (isBackend !== undefined) where.isBackend = isBackend;
      if (isFrontend !== undefined) where.isFrontend = isFrontend;
      if (tags) {
        const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
        where.tags = { some: { tag: { in: tagList } } };
      }
      // salaryMin: find jobs where the job's max is at least the query min (job is in range)
      if (salaryMin !== undefined) where.salaryMin = { gte: salaryMin };
      // salaryMax: find jobs where the job's min is at most the query max (job is in range)
      if (salaryMax !== undefined) where.salaryMax = { lte: salaryMax };

      const [data, total] = await Promise.all([
        db.job.findMany({
          where: where as Parameters<typeof db.job.findMany>[0]['where'],
          include: {
            company: { select: { name: true, slug: true, logoUrl: true } },
            tags: { select: { tag: true } },
          },
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.job.count({ where: where as Parameters<typeof db.job.count>[0]['where'] }),
      ]);

      return reply.send({
        data,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    },
  });

  app.get('/jobs/:id', {
    schema: { tags: ['jobs'], summary: 'Get job by ID' },
    async handler(request, reply) {
      const { id } = request.params as { id: string };

      const job = await db.job.findFirst({
        where: { OR: [{ id }, { urlHash: id }], isActive: true },
        include: {
          company: { select: { name: true, slug: true, logoUrl: true, domain: true } },
          tags: { select: { tag: true } },
        },
      });

      if (!job) return reply.status(404).send({ error: 'Job not found' });
      return reply.send(job);
    },
  });
}
