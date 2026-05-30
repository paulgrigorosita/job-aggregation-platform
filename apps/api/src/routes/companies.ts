import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '@jap/database';
import { slugify } from '@jap/shared';

const AddCompanySchema = z.object({
  name: z.string().min(1),
  atsType: z.enum(['greenhouse', 'lever', 'ashby']),
  atsSlug: z.string().min(1),
  domain: z.string().optional(),
});

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

  app.post('/companies', {
    schema: { tags: ['companies'], summary: 'Add or update a tracked company' },
    async handler(request, reply) {
      const body = AddCompanySchema.parse(request.body);
      const slug = slugify(body.name);
      const company = await db.company.upsert({
        where: { slug },
        create: { name: body.name, slug, atsType: body.atsType, atsSlug: body.atsSlug, domain: body.domain },
        update: { atsType: body.atsType, atsSlug: body.atsSlug, domain: body.domain },
      });
      return reply.status(201).send(company);
    },
  });

  app.delete('/companies/:slug/tracking', {
    schema: { tags: ['companies'], summary: 'Stop scraping a company (clears ATS info)' },
    async handler(request, reply) {
      const { slug } = request.params as { slug: string };
      await db.company.update({ where: { slug }, data: { atsType: null, atsSlug: null } });
      return reply.status(204).send();
    },
  });
}
