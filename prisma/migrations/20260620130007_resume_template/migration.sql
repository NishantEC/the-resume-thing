-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "skills" TEXT,
    "tex" TEXT,
    "template" TEXT NOT NULL DEFAULT 'modern',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Resume" ("createdAt", "headline", "id", "skills", "summary", "tex", "updatedAt", "userId") SELECT "createdAt", "headline", "id", "skills", "summary", "tex", "updatedAt", "userId" FROM "Resume";
DROP TABLE "Resume";
ALTER TABLE "new_Resume" RENAME TO "Resume";
CREATE UNIQUE INDEX "Resume_userId_key" ON "Resume"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
