-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT 'down,ssl_expiring',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WebhookConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "landingId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES "Landing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "createdAt", "details", "id", "landingId", "userId") SELECT "action", "createdAt", "details", "id", "landingId", "userId" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "sendSslAlerts" BOOLEAN NOT NULL DEFAULT true,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" DATETIME
);
INSERT INTO "new_User" ("email", "id", "nombre", "notifyEmail", "password", "resetPasswordExpires", "resetPasswordToken", "sendSslAlerts") SELECT "email", "id", "nombre", "notifyEmail", "password", "resetPasswordExpires", "resetPasswordToken", "sendSslAlerts" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
