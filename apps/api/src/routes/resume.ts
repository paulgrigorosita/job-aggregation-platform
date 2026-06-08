import type { FastifyInstance } from 'fastify';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { db } from '@jap/database';
import { tailorResumeForJob, type ResumeProfile } from '../services/resumeTailor.js';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore ioredis version phantom conflict between api and worker packages
const applyQueue = new Queue('apply', {
  connection: new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null }),
});

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
        applicationAnswers: (body.applicationAnswers ?? {}) as object,
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

  // GET /apply-queue/debug — show queue counts + stuck/failed jobs in DB
  app.get('/apply-queue/debug', {
    schema: { tags: ['resume'], summary: 'Debug apply queue state' },
    async handler(_request, reply) {
      const [waiting, active, failed, completed] = await Promise.all([
        applyQueue.getWaitingCount(),
        applyQueue.getActiveCount(),
        applyQueue.getFailedCount(),
        applyQueue.getCompletedCount(),
      ]);

      const failedJobs = await applyQueue.getFailed(0, 20);
      const pendingInDb = await db.job.findMany({
        where: { applicationStatus: 'PENDING' },
        select: { id: true, title: true, applyError: true },
        orderBy: { firstSeenAt: 'desc' },
        take: 20,
      });
      const failedInDb = await db.job.findMany({
        where: { applicationStatus: 'FAILED' },
        select: { id: true, title: true, applyError: true },
        orderBy: { firstSeenAt: 'desc' },
        take: 20,
      });

      return reply.send({
        queue: { waiting, active, failed, completed },
        failedBullJobs: failedJobs.map(j => ({
          id: j.id,
          jobId: j.data?.jobId,
          failedReason: j.failedReason,
          stacktrace: j.stacktrace?.[0]?.slice(0, 500),
          attemptsMade: j.attemptsMade,
        })),
        pendingInDb,
        failedInDb,
      });
    },
  });


  app.post('/jobs/:id/apply', {
    schema: { tags: ['resume'], summary: 'Auto-apply to a job via Puppeteer' },
    async handler(request, reply) {
      const { id } = request.params as { id: string };
      const { dryRun } = (request.query as { dryRun?: string });
      const isDryRun = dryRun === 'true' || dryRun === '1';

      const job = await db.job.findFirst({ where: { OR: [{ id }, { urlHash: id }] } });
      if (!job) return reply.status(404).send({ error: 'Job not found' });
      if (!isDryRun && job.applicationStatus === 'APPLIED') {
        return reply.status(409).send({ error: 'Already applied to this job' });
      }

      if (!isDryRun) {
        await db.job.update({ where: { id: job.id }, data: { applicationStatus: 'PENDING', applyError: null } });
      }
      await applyQueue.add('apply', { jobId: job.id, dryRun: isDryRun });

      return reply.status(202).send({ status: isDryRun ? 'PREVIEW' : 'PENDING' });
    },
  });

  // GET /jobs/:id/apply/screenshot — serve the dry-run screenshot PNG
  app.get('/jobs/:id/apply/screenshot', {
    schema: { tags: ['resume'], summary: 'Serve the dry-run form screenshot' },
    async handler(request, reply) {
      const { id } = request.params as { id: string };
      const job = await db.job.findFirst({ where: { OR: [{ id }, { urlHash: id }] }, select: { id: true } });
      if (!job) return reply.status(404).send({ error: 'Job not found' });

      const imgPath = join('/tmp', `apply_preview_${job.id}.png`);
      if (!existsSync(imgPath)) {
        return reply.status(404).send({ error: 'No preview screenshot yet. Run a preview-fill first.' });
      }

      const buffer = readFileSync(imgPath);
      reply.header('Content-Type', 'image/png');
      reply.header('Cache-Control', 'no-store');
      reply.header('Content-Length', buffer.length);
      return reply.send(buffer);
    },
  });

  // GET /jobs/:id/apply-status — check application status
  app.get('/jobs/:id/apply-status', {
    schema: { tags: ['resume'], summary: 'Get application status for a job' },
    async handler(request, reply) {
      const { id } = request.params as { id: string };
      const job = await db.job.findFirst({
        where: { OR: [{ id }, { urlHash: id }] },
        select: { applicationStatus: true, appliedAt: true, applyError: true },
      });
      if (!job) return reply.status(404).send({ error: 'Job not found' });
      return reply.send(job);
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
