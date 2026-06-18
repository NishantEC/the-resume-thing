-- AlterTable
ALTER TABLE "Resume" ADD COLUMN "skills" TEXT;

-- AlterTable
ALTER TABLE "ResumeItem" ADD COLUMN "project" TEXT;
ALTER TABLE "ResumeItem" ADD COLUMN "projectMeta" TEXT;
ALTER TABLE "ResumeItem" ADD COLUMN "projectUrl" TEXT;
