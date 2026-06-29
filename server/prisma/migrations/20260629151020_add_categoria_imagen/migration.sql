-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Landing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "categoria" TEXT NOT NULL DEFAULT 'Cober',
    "ftpHost" TEXT,
    "ftpUser" TEXT,
    "ftpPass" TEXT,
    "ftpPath" TEXT,
    "tecnologias" TEXT,
    "notas" TEXT,
    "imagenUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Landing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Landing" ("createdAt", "estado", "ftpHost", "ftpPass", "ftpPath", "ftpUser", "id", "marca", "nombre", "notas", "tecnologias", "updatedAt", "url", "userId") SELECT "createdAt", "estado", "ftpHost", "ftpPass", "ftpPath", "ftpUser", "id", "marca", "nombre", "notas", "tecnologias", "updatedAt", "url", "userId" FROM "Landing";
DROP TABLE "Landing";
ALTER TABLE "new_Landing" RENAME TO "Landing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
