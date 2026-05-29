import { describe, it, expect } from 'vitest';
import { classify, isExcludedTitle, extractTags } from '../classifier/index.js';

describe('classify', () => {
  it('scores AI jobs high', () => {
    const { aiScore, flags } = classify('Senior LLM Engineer', 'Build RAG pipelines with OpenAI embeddings and vector databases. Work with LangChain and fine-tuning.');
    expect(aiScore).toBeGreaterThanOrEqual(30);
    expect(flags.isAI).toBe(true);
  });

  it('scores non-AI job low', () => {
    const { aiScore, flags } = classify('Accountant', 'Prepare financial statements and tax returns.');
    expect(aiScore).toBeLessThan(30);
    expect(flags.isAI).toBe(false);
  });

  it('detects full-stack', () => {
    const { flags } = classify('Full Stack Engineer', 'React, Next.js, Node.js, TypeScript, GraphQL, PostgreSQL.');
    expect(flags.isFullStack).toBe(true);
  });

  it('detects backend', () => {
    const { flags } = classify('Backend Engineer', 'Python, FastAPI, PostgreSQL, Kafka, Kubernetes microservices distributed systems.');
    expect(flags.isBackend).toBe(true);
  });
});

describe('isExcludedTitle', () => {
  it('excludes internships', () => expect(isExcludedTitle('Software Engineering Intern')).toBe(true));
  it('excludes recruiters', () => expect(isExcludedTitle('Technical Recruiter')).toBe(true));
  it('keeps engineers', () => expect(isExcludedTitle('Senior Software Engineer')).toBe(false));
});

describe('extractTags', () => {
  it('extracts relevant tags', () => {
    const tags = extractTags('Full Stack Engineer', 'React, TypeScript, Node.js, PostgreSQL, Docker, AWS');
    expect(tags).toContain('React');
    expect(tags).toContain('TypeScript');
    expect(tags).toContain('Node.js');
  });
});
