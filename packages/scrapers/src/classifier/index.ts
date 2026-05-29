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
  /intern/i, /internship/i, /co.?op/i, /recruit/i, /talent\s+acquisition/i,
  /human\s+resources/i, /\bhr\b/i, /sales/i, /marketing/i, /finance/i,
  /accountant/i, /legal/i, /counsel/i, /paralegal/i, /operations\s+manager/i,
];

function countKeywordHits(text: string, category: KeywordCategory): number {
  const lower = text.toLowerCase();
  return category.keywords.filter((kw) => new RegExp(kw, 'i').test(lower)).length;
}

export function isExcludedTitle(title: string): boolean {
  return EXCLUDED_TITLES.some((re) => re.test(title));
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
