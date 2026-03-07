/*
  Warnings:

  - You are about to alter the column `weekEnd` on the `weekly_logs` table. The data in that column will be renamed to `endDate`.
  - You are about to alter the column `weekStart` on the `weekly_logs` table. The data in that column will be renamed to `startDate`.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "companyPOBox" TEXT,
ADD COLUMN IF NOT EXISTS "supervisorDesignation" TEXT;

-- AlterTable: Rename columns instead of dropping
ALTER TABLE "weekly_logs" 
RENAME COLUMN "weekStart" TO "startDate";

ALTER TABLE "weekly_logs" 
RENAME COLUMN "weekEnd" TO "endDate";

-- Add new columns
ALTER TABLE "weekly_logs" 
ADD COLUMN IF NOT EXISTS "dateSigned" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "fridayHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "fridayTask" TEXT,
ADD COLUMN IF NOT EXISTS "generalStatement" TEXT,
ADD COLUMN IF NOT EXISTS "grade" TEXT,
ADD COLUMN IF NOT EXISTS "mondayHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "mondayTask" TEXT,
ADD COLUMN IF NOT EXISTS "supervisorSignature" TEXT,
ADD COLUMN IF NOT EXISTS "thursdayHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "thursdayTask" TEXT,
ADD COLUMN IF NOT EXISTS "totalHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "tuesdayHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "tuesdayTask" TEXT,
ADD COLUMN IF NOT EXISTS "wednesdayHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "wednesdayTask" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "iap_reports" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "loVisitCount" INTEGER,
    "isUseful" BOOLEAN,
    "improvedUnderstanding" BOOLEAN,
    "providedExperiences" BOOLEAN,
    "programmeTypes" TEXT[],
    "otherProgrammeDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iap_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "iap_reports_studentId_key" ON "iap_reports"("studentId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'iap_reports_studentId_fkey'
    ) THEN
        ALTER TABLE "iap_reports" ADD CONSTRAINT "iap_reports_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
