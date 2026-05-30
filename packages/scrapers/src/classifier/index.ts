import type { ClassifierFlags } from '@jap/shared';

interface KeywordCategory {
  keywords: string[];
  weight: number;
}

const AI_KEYWORDS: KeywordCategory = {
  weight: 12,
  keywords: [
    'llm', 'gpt', 'machine learning', 'ml engineer', 'ai engineer', 'applied ai',
    'rag', 'retrieval augmented', 'vector', 'embedding', 'fine-tun', 'nlp',
    'computer vision', 'deep learning', 'neural network', 'transformer',
    'langchain', 'openai', 'anthropic', 'hugging face', 'diffusion',
    'ai agent', 'mcp', 'model context protocol', 'multimodal',
  ],
};

const FULLSTACK_KEYWORDS: KeywordCategory = {
  weight: 8,
  keywords: [
    'full.?stack', 'fullstack', 'full stack', 'react', 'next.js', 'nextjs',
    'node.?js', 'typescript', 'javascript', 'vue', 'graphql',
  ],
};

const BACKEND_KEYWORDS: KeywordCategory = {
  weight: 6,
  keywords: [
    'backend', 'back.?end', 'python', 'golang', 'go lang', 'rust', 'java',
    'kafka', 'grpc', 'fastapi', 'django', 'postgresql', 'redis', 'kubernetes',
    'microservice', 'api design', 'distributed systems',
  ],
};

const FRONTEND_KEYWORDS: KeywordCategory = {
  weight: 6,
  keywords: [
    'frontend', 'front.?end', 'react', 'vue', 'angular', 'svelte',
    'css', 'tailwind', 'ui engineer', 'ux engineer', 'design system', 'web components',
  ],
};

const EXCLUDED_TITLES = [
  // Internships
  /intern/i, /internship/i, /co.?op/i,
  // HR / Recruiting
  /recruit/i, /talent\s+acquisition/i, /human\s+resources/i, /\bhr\b/i,
  /sourcer/i, /headhunter/i,
  // Sales & Marketing
  /\bsales\b/i, /account\s+executive/i, /account\s+manager/i,
  /business\s+development/i, /\bbdr\b/i, /\bsdr\b/i, /\bae\b/i,
  /marketing/i, /demand\s+generation/i, /growth\s+manager/i,
  /brand\s+manager/i, /content\s+strat/i, /social\s+media/i,
  /seo\s+manager/i, /copywriter/i, /community\s+manager/i,
  // Finance & Accounting
  /accountant/i, /accounting\s+manager/i, /\bcfo\b/i, /finance\s+manager/i,
  /financial\s+analyst/i, /bookkeeper/i, /controller/i, /treasurer/i,
  /payroll/i, /accounts\s+payable/i, /accounts\s+receivable/i,
  // Legal
  /\blegal\b/i, /counsel/i, /paralegal/i, /attorney/i, /compliance\s+manager/i,
  // Operations & Admin
  /operations\s+manager/i, /office\s+manager/i, /executive\s+assistant/i,
  /administrative\s+assistant/i, /\bea\b.*assistant/i, /receptionist/i,
  /coordinator/i, /office\s+coordinator/i, /facilities/i,
  // Product (non-engineering)
  /product\s+manager/i, /\bpm\b/i, /program\s+manager/i,
  /project\s+manager/i, /\bpmo\b/i,
  // Design (non-engineering)
  /product\s+design/i, /graphic\s+design/i, /brand\s+design/i,
  /visual\s+design/i, /motion\s+design/i, /illustrat/i,
  // Support & Success
  /support\s+specialist/i, /customer\s+success/i, /customer\s+support/i,
  /technical\s+support/i, /help\s+desk/i, /\bcsm\b/i,
  // Executive non-technical
  /chief\s+of\s+staff/i, /\bcoo\b/i, /\bcmo\b/i, /\bcro\b/i,
  // Other non-technical
  /data\s+analyst/i, /business\s+analyst/i, /\bpr\b\s+manager/i,
  /partnerships/i, /ambassador/i, /event\s+manager/i,
];

const TECHNICAL_TITLE_PATTERNS = [
  /engineer/i, /developer/i, /architect/i, /\bswe\b/i,
  /software/i, /backend/i, /frontend/i, /full.?stack/i,
  /\bml\b/i, /\bai\b/i, /machine\s+learning/i, /deep\s+learning/i,
  /devops/i, /\bsre\b/i, /platform/i, /infrastructure/i,
  /data\s+engineer/i, /data\s+scientist/i, /analytics\s+engineer/i,
  /security\s+engineer/i, /cloud\s+engineer/i, /embedded/i,
  /mobile/i, /android/i, /ios\s+engineer/i, /firmware/i,
  /compiler/i, /\bvp\s+of\s+engineering\b/i, /\bcto\b/i,
  /engineering\s+manager/i, /staff\s+engineer/i, /principal\s+engineer/i,
];

function countKeywordHits(text: string, category: KeywordCategory): number {
  const lower = text.toLowerCase();
  return category.keywords.filter((kw) => new RegExp(kw, 'i').test(lower)).length;
}

export function isExcludedTitle(title: string): boolean {
  if (EXCLUDED_TITLES.some((re) => re.test(title))) return true;
  // Require at least one technical pattern in the title
  return !TECHNICAL_TITLE_PATTERNS.some((re) => re.test(title));
}

export function classify(
  title: string,
  description: string
): { aiScore: number; flags: ClassifierFlags } {
  const combined = `${title} ${description}`;

  const aiHits = countKeywordHits(combined, AI_KEYWORDS);
  const fsHits = countKeywordHits(combined, FULLSTACK_KEYWORDS);
  const beHits = countKeywordHits(combined, BACKEND_KEYWORDS);
  const feHits = countKeywordHits(combined, FRONTEND_KEYWORDS);

  // Require at least one primary AI keyword in title for strong AI signal
  const titleAiHits = countKeywordHits(title, AI_KEYWORDS);
  const aiScore = Math.min(100, aiHits * AI_KEYWORDS.weight + (titleAiHits > 0 ? 15 : 0));

  return {
    aiScore,
    flags: {
      isAI: aiScore >= 30 && aiHits >= 1,
      isFullStack: fsHits >= 2,
      isBackend: beHits >= 2,
      isFrontend: feHits >= 2,
    },
  };
}

export function extractTags(title: string, description: string): string[] {
  const TAG_KEYWORDS = [
    'React', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript', 'Python',
    'Go', 'Rust', 'Java', 'GraphQL', 'PostgreSQL', 'Redis', 'Kafka',
    'Kubernetes', 'Docker', 'AWS', 'GCP', 'Azure', 'FastAPI', 'Django',
    'LLM', 'RAG', 'OpenAI', 'LangChain', 'Vector DB', 'Terraform',
    'gRPC', 'Vue', 'Angular', 'Svelte', 'Tailwind',
  ];
  const combined = `${title} ${description}`;
  return TAG_KEYWORDS.filter((tag) =>
    new RegExp(`\\b${tag.replace('.', '\\.')}\\b`, 'i').test(combined)
  );
}
