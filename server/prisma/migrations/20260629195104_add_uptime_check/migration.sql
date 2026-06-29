-- AlterTable
ALTER TABLE "Landing" ADD COLUMN "ultimoCheck" DATETIME;
ALTER TABLE "Landing" ADD COLUMN "ultimoCodigo" INTEGER;
ALTER TABLE "Landing" ADD COLUMN "ultimoMs" INTEGER;
ALTER TABLE "Landing" ADD COLUMN "ultimoStatus" TEXT;

-- CreateTable
CREATE TABLE "CheckLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "landingId" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "responseMs" INTEGER,
    "isUp" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckLog_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES "Landing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
