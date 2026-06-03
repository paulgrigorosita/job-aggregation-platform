-- Add tailoredResume to jobs
ALTER TABLE "jobs" ADD COLUMN "tailoredResume" JSONB;

-- Create resumes table
CREATE TABLE "resumes" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "email"       TEXT,
  "phone"       TEXT,
  "linkedinUrl" TEXT,
  "githubUrl"   TEXT,
  "title"       TEXT NOT NULL,
  "summary"     TEXT NOT NULL,
  "skills"      JSONB NOT NULL,
  "workHistory" JSONB NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);
