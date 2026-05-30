-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "location" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT DEFAULT 'USD',
    "salaryPeriod" TEXT,
    "description" TEXT,
    "postedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "aiScore" INTEGER NOT NULL DEFAULT 0,
    "isAI" BOOLEAN NOT NULL DEFAULT false,
    "isFullStack" BOOLEAN NOT NULL DEFAULT false,
    "isBackend" BOOLEAN NOT NULL DEFAULT false,
    "isFrontend" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_tags" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "job_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraper_runs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "jobsFetched" INTEGER NOT NULL DEFAULT 0,
    "jobsNew" INTEGER NOT NULL DEFAULT 0,
    "jobsDupe" INTEGER NOT NULL DEFAULT 0,
    "jobsRejected" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "scraper_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_slug_idx" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_urlHash_key" ON "jobs"("urlHash");

-- CreateIndex
CREATE INDEX "jobs_source_idx" ON "jobs"("source");

-- CreateIndex
CREATE INDEX "jobs_remote_idx" ON "jobs"("remote");

-- CreateIndex
CREATE INDEX "jobs_isAI_idx" ON "jobs"("isAI");

-- CreateIndex
CREATE INDEX "jobs_postedAt_idx" ON "jobs"("postedAt");

-- CreateIndex
CREATE INDEX "jobs_aiScore_idx" ON "jobs"("aiScore");

-- CreateIndex
CREATE INDEX "jobs_companyId_idx" ON "jobs"("companyId");

-- CreateIndex
CREATE INDEX "job_tags_tag_idx" ON "job_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "job_tags_jobId_tag_key" ON "job_tags"("jobId", "tag");

-- CreateIndex
CREATE INDEX "scraper_runs_source_idx" ON "scraper_runs"("source");

-- CreateIndex
CREATE INDEX "scraper_runs_startedAt_idx" ON "scraper_runs"("startedAt");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_tags" ADD CONSTRAINT "job_tags_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
