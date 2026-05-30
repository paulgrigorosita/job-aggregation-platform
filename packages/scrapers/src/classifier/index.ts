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
  /sourcer/i, /headhunter/i, /people\s+ops/i, /people\s+partner/i,
  /benefits/i, /compensation/i, /\bhris\b/i,
  // Sales & Marketing
  /\bsales\b/i, /account\s+executive/i, /account\s+manager/i,
  /business\s+development/i, /\bbdr\b/i, /\bsdr\b/i,
  /marketing/i, /demand\s+generation/i, /growth\s+manager/i,
  /brand\s+manager/i, /content\s+strat/i, /social\s+media/i,
  /seo\s+manager/i, /copywriter/i, /community\s+manager/i,
  /community\s+lead/i, /developer\s+community/i, /developer\s+advocate/i,
  /developer\s+relations/i, /\bdevrel\b/i,
  // Finance & Accounting
  /accountant/i, /accounting/i, /\bcfo\b/i, /finance\s+manager/i,
  /financial\s+analyst/i, /bookkeeper/i, /treasurer/i,
  /payroll/i, /accounts\s+payable/i, /accounts\s+receivable/i,
  /economist/i, /\bfp&a\b/i,
  // Legal & Policy
  /\blegal\b/i, /counsel/i, /paralegal/i, /attorney/i, /compliance\s+manager/i,
  /policy/i, /regulatory/i, /government\s+affairs/i,
  // Operations & Admin
  /operations\s+manager/i, /office\s+manager/i, /executive\s+assistant/i,
  /administrative/i, /receptionist/i, /coordinator/i, /facilities/i,
  /procurement/i, /supply\s+chain/i, /logistics/i,
  // Product & Program (non-engineering)
  /product\s+manager/i, /program\s+manager/i, /project\s+manager/i, /\bpmo\b/i,
  /implementation\s+consultant/i, /implementation\s+specialist/i,
  /solutions\s+consultant/i, /enterprise\s+consultant/i,
  /management\s+consultant/i, /\bconsultant\b/i,
  // Design (non-engineering)
  /\bdesigner\b/i, /product\s+design/i, /graphic\s+design/i,
  /brand\s+design/i, /visual\s+design/i, /motion\s+design/i,
  /ux\s+designer/i, /ui\s+designer/i, /illustrat/i,
  // Support & Success
  /support\s+specialist/i, /customer\s+success/i, /customer\s+support/i,
  /technical\s+support/i, /help\s+desk/i, /\bcsm\b/i,
  // Executive non-technical
  /chief\s+of\s+staff/i, /\bcoo\b/i, /\bcmo\b/i, /\bcro\b/i,
  /head\s+of\s+(?!engineering|platform|infrastructure|security|data)/i,
  /director.*(?:procurement|community|policy|communications|finance|legal|hr|people|marketing|sales)/i,
  // Other non-technical
  /data\s+analyst/i, /business\s+analyst/i,
  /partnerships/i, /ambassador/i, /event\s+manager/i,
  /communications/i, /public\s+relations/i, /\bpr\s+manager\b/i,
  /technical\s+writer/i, /documentation/i,
];

const TECHNICAL_TITLE_PATTERNS = [
  // Core engineering
  /software\s+engineer/i, /\bswe\b/i,
  /backend\s+engineer/i, /back.?end\s+engineer/i,
  /frontend\s+engineer/i, /front.?end\s+engineer/i,
  /full.?stack\s+engineer/i, /full.?stack\s+developer/i,
  /web\s+developer/i, /web\s+engineer/i,
  // Specialized engineering
  /ml\s+engineer/i, /ai\s+engineer/i, /machine\s+learning\s+engineer/i,
  /deep\s+learning\s+engineer/i, /research\s+engineer/i,
  /data\s+engineer/i, /data\s+scientist/i, /analytics\s+engineer/i,
  /devops\s+engineer/i, /\bsre\b/i, /site\s+reliability/i,
  /platform\s+engineer/i, /infrastructure\s+engineer/i,
  /cloud\s+engineer/i, /security\s+engineer/i,
  /mobile\s+engineer/i, /android\s+engineer/i, /ios\s+engineer/i,
  /embedded\s+engineer/i, /firmware\s+engineer/i,
  /compiler\s+engineer/i, /systems\s+engineer/i,
  // Leadership (engineering-specific)
  /engineering\s+manager/i, /\bvp.*engineering\b/i, /\bcto\b/i,
  /staff\s+engineer/i, /principal\s+engineer/i, /distinguished\s+engineer/i,
  /director.*engineering/i, /head\s+of\s+engineering/i,
  /head\s+of\s+platform/i, /head\s+of\s+infrastructure/i,
  /head\s+of\s+security/i, /head\s+of\s+data/i,
  // Architect
  /solutions\s+architect/i, /software\s+architect/i, /cloud\s+architect/i,
  /security\s+architect/i, /data\s+architect/i,
  // AI / Automation specializations
  /ai\s+agent/i, /ai\s+automation/i, /ai\s+platform/i, /ai\s+infrastructure/i,
  /llm\s+engineer/i, /prompt\s+engineer/i, /rag\s+engineer/i,
  /applied\s+ai/i, /applied\s+ml/i, /applied\s+scientist/i,
  /nlp\s+engineer/i, /computer\s+vision\s+engineer/i,
  /robotics\s+engineer/i, /automation\s+engineer/i,
  /\bgenai\b/i, /generative\s+ai/i, /multimodal/i,
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
