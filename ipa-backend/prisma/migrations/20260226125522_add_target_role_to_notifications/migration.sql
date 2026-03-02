-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "targetRole" "UserRole",
ALTER COLUMN "userId" DROP NOT NULL;
