import type { FastifyInstance } from 'fastify';
import { db } from '@jap/database';
import { tailorResumeForJob, type ResumeProfile } from '../services/resumeTailor.js';

export async function resumeRoutes(app: FastifyInstance) {
  // GET /resume — fetch the single base resume
  app.get('/resume', {
    schema: { tags: ['resume'], summary: 'Get base resume' },
    async handler(_request, reply) {
      const resume = await db.resume.findFirst({ orderBy: { createdAt: 'desc' } });
      return reply.send(resume ?? null);
    },
  });

  // PUT /resume — create or update base resume
  app.put('/resume', {
    schema: { tags: ['resume'], summary: 'Save base resume' },
    async handler(request, reply) {
      const body = request.body as ResumeProfile;

      const existing = await db.resume.findFirst({ orderBy: { createdAt: 'desc' } });

      const data = {
        ...body,
        skills: body.skills,
        workHistory: body.workHistory as object[],
        education: (body.education ?? []) as object[],
        projects: (body.projects ?? []) as object[],
      };

      const resume = existing
        ? await db.resume.update({ where: { id: existing.id }, data })
        : await db.resume.create({ data });

      return reply.send(resume);
    },
  });

  // POST /jobs/:id/tailor — generate tailored resume for a specific job
  app.post('/jobs/:id/tailor', {
    schema: { tags: ['resume'], summary: 'Tailor resume for a job' },
    async handler(request, reply) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return reply.status(503).send({ error: 'ANTHROPIC_API_KEY not configured' });
      }

      const { id } = request.params as { id: string };

      const [job, baseResume] = await Promise.all([
        db.job.findFirst({ where: { OR: [{ id }, { urlHash: id }] } }),
        db.resume.findFirst({ orderBy: { createdAt: 'desc' } }),
      ]);

      if (!job) return reply.status(404).send({ error: 'Job not found' });
      if (!baseResume) return reply.status(404).send({ error: 'No base resume found. Please save your resume first.' });

      const base: ResumeProfile = {
        name: baseResume.name,
        email: baseResume.email,
        phone: baseResume.phone,
        linkedinUrl: baseResume.linkedinUrl,
        githubUrl: baseResume.githubUrl,
        portfolioUrl: baseResume.portfolioUrl,
        title: baseResume.title,
        summary: baseResume.summary,
        skills: baseResume.skills as string[],
        workHistory: baseResume.workHistory as ResumeProfile['workHistory'],
        education: (baseResume.education ?? []) as ResumeProfile['education'],
        projects: (baseResume.projects ?? []) as ResumeProfile['projects'],
      };

      const tailored = await tailorResumeForJob(base, {
        title: job.title,
        description: job.description ?? '',
      });

      // Persist on the job
      await db.job.update({ where: { id: job.id }, data: { tailoredResume: tailored as object } });

      return reply.send(tailored);
    },
  });

  // GET /jobs/:id/tailor — fetch previously generated tailored resume
  app.get('/jobs/:id/tailor', {
    schema: { tags: ['resume'], summary: 'Get tailored resume for a job' },
    async handler(request, reply) {
      const { id } = request.params as { id: string };
      const job = await db.job.findFirst({
        where: { OR: [{ id }, { urlHash: id }] },
        select: { tailoredResume: true },
      });
      if (!job) return reply.status(404).send({ error: 'Job not found' });
      return reply.send(job.tailoredResume ?? null);
    },
  });
}
