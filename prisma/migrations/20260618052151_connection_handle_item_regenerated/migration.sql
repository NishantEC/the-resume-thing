-- AlterTable
ALTER TABLE "Connection" ADD COLUMN "handle" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResumeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resumeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "project" TEXT,
    "projectMeta" TEXT,
    "projectUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "regenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResumeItem_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ResumeItem" ("content", "createdAt", "id", "kind", "order", "project", "projectMeta", "projectUrl", "resumeId", "status", "updatedAt") SELECT "content", "createdAt", "id", "kind", "order", "project", "projectMeta", "projectUrl", "resumeId", "status", "updatedAt" FROM "ResumeItem";
DROP TABLE "ResumeItem";
ALTER TABLE "new_ResumeItem" RENAME TO "ResumeItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
