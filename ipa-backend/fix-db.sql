-- Add missing columns to Student table
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "companyPOBox" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "supervisorDesignation" TEXT;

-- Rename columns in weekly_logs
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_logs' AND column_name = 'weekStart') THEN
        ALTER TABLE "weekly_logs" RENAME COLUMN "weekStart" TO "startDate";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_logs' AND column_name = 'weekEnd') THEN
        ALTER TABLE "weekly_logs" RENAME COLUMN "weekEnd" TO "endDate";
    END IF;
END $$;

-- Add new columns to weekly_logs
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "dateSigned" TIMESTAMP(3);
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "fridayHours" DOUBLE PRECISION;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "fridayTask" TEXT;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "generalStatement" TEXT;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "grade" TEXT;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "mondayHours" DOUBLE PRECISION;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "mondayTask" TEXT;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "supervisorSignature" TEXT;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "thursdayHours" DOUBLE PRECISION;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "thursdayTask" TEXT;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "totalHours" DOUBLE PRECISION;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "tuesdayHours" DOUBLE PRECISION;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "tuesdayTask" TEXT;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "wednesdayHours" DOUBLE PRECISION;
ALTER TABLE "weekly_logs" ADD COLUMN IF NOT EXISTS "wednesdayTask" TEXT;

-- Create iap_reports table
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

-- Create unique index
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'iap_reports_studentId_key') THEN
        CREATE UNIQUE INDEX "iap_reports_studentId_key" ON "iap_reports"("studentId");
    END IF;
END $$;

-- Add foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'iap_reports_studentId_fkey') THEN
        ALTER TABLE "iap_reports" ADD CONSTRAINT "iap_reports_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
