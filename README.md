# JAP — Job Aggregation Platform

A production-grade, US-focused job aggregation platform that scrapes, normalizes, classifies, and exposes engineering jobs from multiple ATS providers and startup job boards.

**Targets:** Greenhouse · Lever · Ashby · YC Jobs · Wellfound

**Focus:** Full-Stack, AI/ML, Backend, Frontend, Platform Engineering — US-based only

---

## Architecture

```
├── apps/
│   ├── api/          # Fastify REST API (port 3001)
│   ├── worker/       # BullMQ scrape workers + cron scheduler
│   └── dashboard/    # Next.js frontend (port 3000)
└── packages/
    ├── scrapers/     # Modular scraper implementations
    ├── shared/       # Types, utilities, logger
    └── database/     # Prisma ORM + PostgreSQL schema
```

**Stack:** Node.js 20 · TypeScript · Fastify · Next.js 14 · Prisma · PostgreSQL 16 · Redis 7 · BullMQ · Playwright · pnpm workspaces · Turborepo

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm 9 (`npm install -g pnpm`)
- Docker + Docker Compose (for PostgreSQL + Redis)
- Optional: OpenAI API key (for semantic embeddings)

### 1. Clone and install

```bash
git clone <repo-url>
cd job-aggregation-platform
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and REDIS_URL
```

Key variables:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://jap:secret@localhost:5432/jap` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `GREENHOUSE_COMPANIES` | Comma-separated Greenhouse slugs | `stripe,notion,figma` |
| `LEVER_COMPANIES` | Comma-separated Lever slugs | `openai,anthropic` |
| `ASHBY_COMPANIES` | Comma-separated Ashby slugs | `linear,vercel` |
| `OPENAI_API_KEY` | Optional — enables semantic embeddings | — |
| `DISCORD_WEBHOOK_URL` | Optional — enables Discord job alerts | — |
| `TELEGRAM_BOT_TOKEN` | Optional — enables Telegram alerts | — |
| `ALERT_MIN_SCORE` | Minimum AI score to trigger alerts | `60` |

### 3. Start infrastructure

```bash
docker-compose up -d postgres redis
```

### 4. Initialize database

```bash
cd packages/database
pnpm prisma migrate dev --name init
pnpm prisma generate
cd ../..
```

### 5. Build packages

```bash
pnpm turbo run build
```

### 6. Start services

```bash
# API (port 3001)
cd apps/api && pnpm dev

# Worker (separate terminal)
cd apps/worker && pnpm dev

# Dashboard (separate terminal)  
cd apps/dashboard && pnpm dev
```

### 7. Trigger an immediate scrape

```bash
# Via API (add a trigger endpoint) or direct worker call
cd apps/worker
node -e "
import('./dist/scheduler.js').then(m => m.triggerImmediateScrape())
"
```

---

## Full Docker Deployment

```bash
cp .env.example .env
# Edit .env with your values

docker-compose up -d
```

Services start in dependency order. First-run database migration:

```bash
docker-compose exec api sh -c "cd /app && npx prisma migrate deploy"
```

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

Interactive docs: `http://localhost:3001/docs`

### Endpoints

#### `GET /jobs`

Query parameters:

| Param | Type | Description |
|---|---|---|
| `q` | string | Full-text search (title, description, company) |
| `company` | string | Filter by company slug |
| `source` | string | `greenhouse` \| `lever` \| `ashby` \| `yc` \| `wellfound` |
| `remote` | boolean | Remote jobs only |
| `isAI` | boolean | AI-related jobs only |
| `isFullStack` | boolean | Full-stack jobs only |
| `isBackend` | boolean | Backend jobs only |
| `isFrontend` | boolean | Frontend jobs only |
| `tags` | string | Comma-separated skill tags |
| `salaryMin` | number | Minimum salary (annual, USD) |
| `salaryMax` | number | Maximum salary (annual, USD) |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Results per page (default: 25, max: 100) |
| `sortBy` | string | `postedAt` \| `aiScore` \| `firstSeenAt` |
| `sortDir` | string | `asc` \| `desc` |

#### `GET /jobs/:id`

Get a single job by `id` or `urlHash`.

#### `GET /companies`

List companies with job counts. Supports `q`, `page`, `pageSize`.

#### `GET /companies/:slug`

Get company with recent job listings.

#### `GET /stats`

Platform statistics: total jobs, companies, AI job count, breakdown by source, top skill tags.

#### `GET /feed.xml`

RSS feed of the 100 most recent AI jobs.

---

## Scraper Details

### Greenhouse

Uses the public Greenhouse Boards API (`/v1/boards/{slug}/jobs?content=true`). Configured via `GREENHOUSE_COMPANIES` env var.

### Lever

Uses the public Lever postings API (`/v0/postings/{slug}?mode=json`). Handles pagination via the `next` URL in each response. Configured via `LEVER_COMPANIES`.

### Ashby

Uses Ashby's official public job board API (`POST /posting-api/job-board/{slug}`). More reliable than HTML parsing. Configured via `ASHBY_COMPANIES`.

### YC Jobs

Fetches from the Work at a Startup API. Filters to engineering roles only. Falls back to jobs page scraping if primary endpoint fails.

### Wellfound

Uses Playwright (headless Chromium) to intercept GraphQL API responses. Runs twice daily due to browser overhead. Requires Chromium to be installed (`npx playwright install chromium`).

---

## Job Classification

Jobs are scored 0–100 for AI relevance based on keyword frequency in title and description:

- **AI keywords** (weight 12): LLM, GPT, RAG, embeddings, fine-tuning, vector, LangChain, NLP, etc.
- **Score ≥ 30 + ≥1 keyword hit** → `isAI = true`
- **Full-stack** (≥2 hits): React, Next.js, Node.js, TypeScript, Vue, GraphQL
- **Backend** (≥2 hits): Python, Go, Rust, Kafka, gRPC, FastAPI, Kubernetes
- **Frontend** (≥2 hits): React, Vue, Angular, CSS, Tailwind, design systems

---

## US-Only Filtering

Accepted locations:
- Any US state or abbreviation
- "United States", "USA", "America"
- "Remote", "Remote (US)", "US Remote", "Remote - North America"

Rejected locations:
- India and Indian cities (Bangalore, Mumbai, etc.)
- EU/EMEA designations (Europe only, EU only, EMEA)
- Specific non-US cities (London, Berlin, Paris, Singapore, etc.)
- "Canada only", "Latin America"

---

## Queue Architecture

BullMQ queues backed by Redis:

| Queue | Purpose | Schedule |
|---|---|---|
| `scrape` | Run a scraper for one source | Cron per source (see below) |
| `embed` | Generate OpenAI embeddings | After each new job (if `OPENAI_API_KEY` set) |
| `alert` | Discord/Telegram notifications | For new AI jobs with score ≥ `ALERT_MIN_SCORE` |

Cron schedules (UTC):
- Greenhouse: every 2 hours
- Lever: every 2 hours (offset 30m)
- Ashby: every 3 hours
- YC: every 4 hours
- Wellfound: 06:00 and 18:00

---

## Development

```bash
# Run all tests
pnpm turbo run test

# Type-check all packages
pnpm turbo run typecheck

# Lint
pnpm turbo run lint

# Build all packages
pnpm turbo run build
```

### Adding a new scraper

1. Create `packages/scrapers/src/{name}/index.ts`
2. Extend `BaseScraper`
3. Implement `fetchAll(): Promise<NormalizedJob[]>`
4. Add the new source to `ScraperSource` enum in `packages/shared/src/types/job.ts`
5. Register in `scraperFactory()` in `packages/scrapers/src/index.ts`
6. Add cron schedule to `apps/worker/src/scheduler.ts`

### Adding new companies

Simply update the relevant env vars:

```bash
GREENHOUSE_COMPANIES=stripe,notion,figma,openai,your-new-company
```

Or update the defaults in `.env.example` and commit.

---

## Database Schema

```
companies       — Company profiles (slug, name, domain, logo)
jobs            — Job listings with all metadata + classifier flags
job_tags        — Many-to-many job ↔ skill tags
scraper_runs    — Audit log of every scrape (counts, errors, timing)
```

The `jobs.embedding` column (type `vector(1536)`) stores OpenAI embeddings for semantic search when `OPENAI_API_KEY` is configured.

---

## License

MIT
