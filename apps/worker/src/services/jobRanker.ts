import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { db } from '@jap/database';
import { createLogger } from '@jap/shared';

const logger = createLogger('job-ranker');
// Resolve relative to the repo root (process.cwd() = project root when running via pnpm)
const RESUME_PATH = join(process.cwd(), 'apps/worker/config/resume.txt');
const MAX_FITS_PER_COMPANY = 2;
const BATCH_SIZE = 10; // jobs per Claude call
const DESC_CHARS = 500; // chars of description to send — enough for requirements, not the whole post

interface JobScore {
  jobId: string;
  score: number;
  reason: string;
}

function loadResume(): string {
  if (!existsSync(RESUME_PATH)) {
    throw new Error(`Resume file not found at ${RESUME_PATH}. Please paste your resume into apps/worker/config/resume.txt`);
  }
  const text = readFileSync(RESUME_PATH, 'utf-8').trim();
  if (text.startsWith('[Replace this placeholder')) {
    throw new Error('Resume file is still a placeholder. Please paste your actual resume into apps/worker/config/resume.txt');
  }
  return text;
}

async function scoreJobsBatch(
  client: Anthropic,
  resumeText: string,
  jobs: Array<{ id: string; title: string; company: string; description: string }>
): Promise<JobScore[]> {
  const jobsBlock = jobs
    .map((j, i) => `### Job ${i + 1} (ID: ${j.id})\nTitle: ${j.title}\nCompany: ${j.company}\n\n${j.description.slice(0, DESC_CHARS)}`)
    .join('\n\n---\n\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: 'You are a job fit evaluator. Score how well a candidate matches each job based on their resume.',
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: `## Candidate Resume\n\n${resumeText}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Score each job below from 0-100 based on how well the candidate's resume matches. Return ONLY valid JSON array, no other text.\n\nFormat: [{"id":"<job_id>","score":<0-100>,"reason":"<one sentence>"}]\n\n${jobsBlock}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  // Extract JSON array from response (Claude might wrap in markdown)
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`Invalid JSON response from Claude: ${text.slice(0, 200)}`);

  const parsed = JSON.parse(match[0]) as Array<{ id: string; score: number; reason: string }>;
  return parsed.map((p) => ({ jobId: p.id, score: p.score, reason: p.reason }));
}

export async function rankNewJobs(): Promise<{ ranked: number; deactivated: number }> {
  const resumeText = loadResume();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Load all active jobs that haven't been ranked yet, grouped by company
  const unrankedJobs = await db.job.findMany({
    where: { isActive: true, fitScore: null },
    select: {
      id: true,
      title: true,
      description: true,
      companyId: true,
      company: { select: { name: true } },
    },
  });

  if (unrankedJobs.length === 0) {
    logger.info('No unranked jobs to process');
    return { ranked: 0, deactivated: 0 };
  }

  logger.info({ count: unrankedJobs.length }, 'Starting job ranking');

  // Group by company
  const byCompany = new Map<string, typeof unrankedJobs>();
  for (const job of unrankedJobs) {
    const list = byCompany.get(job.companyId) ?? [];
    list.push(job);
    byCompany.set(job.companyId, list);
  }

  let ranked = 0;
  let deactivated = 0;

  for (const [, jobs] of byCompany) {

    // Multiple jobs — score them all with Claude then keep top MAX_FITS_PER_COMPANY
    const scores: JobScore[] = [];

    // Score in batches of BATCH_SIZE
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE).map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company.name,
        description: j.description ?? '',
      }));

      try {
        const batchScores = await scoreJobsBatch(client, resumeText, batch);
        scores.push(...batchScores);
      } catch (err) {
        logger.warn({ company: jobs[0].company.name, err }, 'Batch scoring failed, skipping company');
        break;
      }
    }

    if (scores.length === 0) continue;

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    const keepCount = jobs.length === 1 ? 1 : MAX_FITS_PER_COMPANY;
    const topIds = new Set(scores.slice(0, keepCount).map((s) => s.jobId));

    // Persist scores and deactivate low-fit jobs
    for (const score of scores) {
      const isTop = topIds.has(score.jobId);
      // updateMany silently skips if Claude returned a mismatched/hallucinated ID
      const updated = await db.job.updateMany({
        where: { id: score.jobId },
        data: {
          fitScore: score.score,
          fitReason: score.reason,
          isActive: isTop,
        },
      });
      if (updated.count > 0) {
        ranked++;
        if (!isTop) deactivated++;
      }
    }

    logger.info(
      { company: jobs[0].company.name, total: jobs.length, kept: topIds.size, deactivated: jobs.length - topIds.size },
      'Ranked company jobs'
    );
  }

  logger.info({ ranked, deactivated }, 'Job ranking complete');
  return { ranked, deactivated };
}
