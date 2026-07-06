-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "sendSslAlerts" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" DATETIME,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "providerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "emailVerificationToken", "emailVerified", "id", "nombre", "notifyEmail", "password", "plan", "provider", "providerId", "resetPasswordExpires", "resetPasswordToken", "role", "sendSslAlerts") SELECT "avatarUrl", "createdAt", "email", "emailVerificationToken", "emailVerified", "id", "nombre", "notifyEmail", "password", "plan", "provider", "providerId", "resetPasswordExpires", "resetPasswordToken", "role", "sendSslAlerts" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
