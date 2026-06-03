ALTER TABLE "resumes"
  ADD COLUMN "portfolioUrl" TEXT,
  ADD COLUMN "education"    JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "projects"     JSONB NOT NULL DEFAULT '[]';
