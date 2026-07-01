-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "landingId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES "Landing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
