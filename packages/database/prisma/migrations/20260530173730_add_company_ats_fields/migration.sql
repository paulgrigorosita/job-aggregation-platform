-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "atsSlug" TEXT,
ADD COLUMN     "atsType" TEXT;

-- CreateIndex
CREATE INDEX "companies_atsType_idx" ON "companies"("atsType");
