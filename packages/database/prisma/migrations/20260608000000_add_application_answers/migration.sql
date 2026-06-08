ALTER TABLE "resumes"
  ADD COLUMN "applicationAnswers" JSONB NOT NULL DEFAULT '{}';
