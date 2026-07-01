-- AlterTable
ALTER TABLE "Landing" ADD COLUMN "ultimoSslDias" INTEGER;
ALTER TABLE "Landing" ADD COLUMN "ultimoSslValido" BOOLEAN;
ALTER TABLE "Landing" ADD COLUMN "ultimoSslVence" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "sendSslAlerts" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("email", "id", "nombre", "password") SELECT "email", "id", "nombre", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
