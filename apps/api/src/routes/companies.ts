import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '@jap/database';

const CompanyFiltersSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

export async function companyRoutes(app: FastifyInstance) {
  app.get('/companies', {
    schema: { tags: ['companies'], summary: 'List companies' },
    async handler(request, reply) {
      const { q, page, pageSize } = CompanyFiltersSchema.parse(request.query);

      const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {};

      const [data, total] = await Promise.all([
        db.company.findMany({
          where,
          include: { _count: { select: { jobs: { where: { isActive: true } } } } },
          orderBy: { jobs: { _count: 'desc' } },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.company.count({ where }),
      ]);

      return reply.send({
        data,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    },
  });

  app.get('/companies/:slug', {
    schema: { tags: ['companies'], summary: 'Get company by slug' },
    async handler(request, reply) {
      const { slug } = request.params as { slug: string };

      const company = await db.company.findUnique({
        where: { slug },
        include: {
          _count: { select: { jobs: { where: { isActive: true } } } },
          jobs: {
            where: { isActive: true },
            include: { tags: { select: { tag: true } } },
            orderBy: { postedAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!company) return reply.status(404).send({ error: 'Company not found' });
      return reply.send(company);
    },
  });
}
