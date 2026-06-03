import Anthropic from '@anthropic-ai/sdk';

export interface WorkEntry {
  company: string;
  duration: string;
  title: string;
  highlights: string[];
}

export interface ResumeProfile {
  name: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  title: string;
  summary: string;
  skills: string[];
  workHistory: WorkEntry[];
}

export interface TailoredResume extends ResumeProfile {
  // company and duration are preserved exactly from base — only title, summary, skills, highlights change
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function tailorResumeForJob(
  base: ResumeProfile,
  job: { title: string; description: string }
): Promise<TailoredResume> {
  const prompt = `You are a professional resume writer. Tailor the candidate's resume for a specific job posting.

STRICT RULES:
- Keep ALL company names exactly as-is in workHistory
- Keep ALL duration values exactly as-is in workHistory
- Only adjust: resume title, summary, skills order/selection, job titles in workHistory, and highlights
- Skills: reorder to put the most relevant ones first, remove unrelated ones, keep minimum 5
- Highlights: rewrite to emphasize experience most relevant to this job (2-4 bullets per role)
- Return ONLY valid JSON, no markdown, no explanation

JOB POSTING:
Title: ${job.title}
Description: ${job.description.slice(0, 1500)}

BASE RESUME:
${JSON.stringify(base, null, 2)}

Return the tailored resume in exactly this JSON structure:
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "linkedinUrl": "...",
  "githubUrl": "...",
  "title": "adjusted title matching the job",
  "summary": "2-3 sentence summary tailored to this role",
  "skills": ["most relevant first", ...],
  "workHistory": [
    {
      "company": "EXACT same as base",
      "duration": "EXACT same as base",
      "title": "adjusted title for this role",
      "highlights": ["tailored bullet 1", "tailored bullet 2"]
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned invalid JSON for tailored resume');

  const tailored = JSON.parse(match[0]) as TailoredResume;

  // Enforce: restore company names and durations from base (safety net)
  tailored.workHistory = tailored.workHistory.map((entry, i) => ({
    ...entry,
    company: base.workHistory[i]?.company ?? entry.company,
    duration: base.workHistory[i]?.duration ?? entry.duration,
  }));

  return tailored;
}
