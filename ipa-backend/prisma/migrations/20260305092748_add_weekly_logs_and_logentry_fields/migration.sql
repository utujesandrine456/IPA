-- CreateEnum
CREATE TYPE "WeeklyLogStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "log_entries" ADD COLUMN     "mood" TEXT,
ADD COLUMN     "weeklyLogId" INTEGER;

-- CreateTable
CREATE TABLE "weekly_logs" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "objectives" TEXT,
    "status" "WeeklyLogStatus" NOT NULL DEFAULT 'DRAFT',
    "supervisorNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_logs_studentId_weekNumber_key" ON "weekly_logs"("studentId", "weekNumber");

-- AddForeignKey
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_weeklyLogId_fkey" FOREIGN KEY ("weeklyLogId") REFERENCES "weekly_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_logs" ADD CONSTRAINT "weekly_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
