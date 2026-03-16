/*
  Warnings:

  - The values [APPROVED] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `dateSigned` on the `weekly_logs` table. All the data in the column will be lost.
  - You are about to drop the column `objectives` on the `weekly_logs` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `weekly_logs` table. All the data in the column will be lost.
  - The `supervisorSignature` column on the `weekly_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[studentId]` on the table `ratings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED', 'REJECTED');
ALTER TABLE "public"."tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'LIAISON';

-- AlterEnum
ALTER TYPE "WeeklyLogStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "absentDays" INTEGER DEFAULT 0,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "graduationYear" TEXT,
ADD COLUMN     "liaisonId" INTEGER,
ADD COLUMN     "liaisonOfficerName" TEXT,
ADD COLUMN     "liaisonOfficerPhone" TEXT,
ADD COLUMN     "supervisorDepartment" TEXT,
ADD COLUMN     "supervisorPhone" TEXT;

-- AlterTable
ALTER TABLE "iap_reports" ADD COLUMN     "contentsTraining" TEXT,
ADD COLUMN     "futureCareerPlan" TEXT,
ADD COLUMN     "nameOfUnit" TEXT,
ADD COLUMN     "notableAchievements" TEXT,
ADD COLUMN     "overviewGoals" TEXT,
ADD COLUMN     "satisfactionIndustry" TEXT,
ADD COLUMN     "satisfactionInstructors" TEXT,
ADD COLUMN     "satisfactionMajor" TEXT,
ADD COLUMN     "satisfactionPractical" TEXT,
ADD COLUMN     "suggestions" TEXT;

-- AlterTable
ALTER TABLE "ratings" ADD COLUMN     "complianceEtiquette" INTEGER DEFAULT 0,
ADD COLUMN     "cooperativeness" INTEGER DEFAULT 0,
ADD COLUMN     "evaluatorName" TEXT DEFAULT '',
ADD COLUMN     "evaluatorPosition" TEXT DEFAULT '',
ADD COLUMN     "knowledgeApplication" INTEGER DEFAULT 0,
ADD COLUMN     "knowledgeWirelessEst" INTEGER DEFAULT 0,
ADD COLUMN     "knowledgeWirelessMaint" INTEGER DEFAULT 0,
ADD COLUMN     "knowledgeWirelessOps" INTEGER DEFAULT 0,
ADD COLUMN     "responsibility" INTEGER DEFAULT 0,
ADD COLUMN     "safetyArrangement" INTEGER DEFAULT 0,
ADD COLUMN     "safetyAwareness" INTEGER DEFAULT 0,
ADD COLUMN     "safetyCompliance" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "weekly_logs" DROP COLUMN "dateSigned",
DROP COLUMN "objectives",
DROP COLUMN "summary",
ADD COLUMN     "liaisonDate" TIMESTAMP(3),
ADD COLUMN     "liaisonName" TEXT,
ADD COLUMN     "liaisonSignature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supervisorDate" TIMESTAMP(3),
ADD COLUMN     "supervisorName" TEXT,
DROP COLUMN "supervisorSignature",
ADD COLUMN     "supervisorSignature" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "liaison_officers" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liaison_officers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liaison_officers_userId_key" ON "liaison_officers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_studentId_key" ON "ratings"("studentId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_liaisonId_fkey" FOREIGN KEY ("liaisonId") REFERENCES "liaison_officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liaison_officers" ADD CONSTRAINT "liaison_officers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
