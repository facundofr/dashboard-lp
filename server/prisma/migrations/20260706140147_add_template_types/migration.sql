-- CreateTable
CREATE TABLE "TemplateType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📄',
    "description" TEXT,
    "hasMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FieldDefinition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateTypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "options" TEXT,
    "defaultVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FieldDefinition_templateTypeId_fkey" FOREIGN KEY ("templateTypeId") REFERENCES "TemplateType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "templateTypeId" INTEGER,
    "dynamicValues" TEXT,
    "visibleFields" TEXT,
    "ftpHost" TEXT,
    "ftpUser" TEXT,
    "ftpPass" TEXT,
    "ftpPath" TEXT,
    "tecnologias" TEXT,
    "notas" TEXT,
    "imagenUrl" TEXT,
    "sheetUrl" TEXT,
    "formStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "tags" TEXT,
    "cliente" TEXT,
    "metaTags" TEXT,
    "ultimoDeploy" DATETIME,
    "ultimoCheck" DATETIME,
    "ultimoStatus" TEXT,
    "ultimoCodigo" INTEGER,
    "ultimoMs" INTEGER,
    "ultimoSslValido" BOOLEAN,
    "ultimoSslDias" INTEGER,
    "ultimoSslVence" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Landing_templateTypeId_fkey" FOREIGN KEY ("templateTypeId") REFERENCES "TemplateType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Landing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Landing" ("categoria", "cliente", "createdAt", "estado", "formStatus", "ftpHost", "ftpPass", "ftpPath", "ftpUser", "id", "imagenUrl", "marca", "metaTags", "nombre", "notas", "sheetUrl", "tags", "tecnologias", "ultimoCheck", "ultimoCodigo", "ultimoDeploy", "ultimoMs", "ultimoSslDias", "ultimoSslValido", "ultimoSslVence", "ultimoStatus", "updatedAt", "url", "userId") SELECT "categoria", "cliente", "createdAt", "estado", "formStatus", "ftpHost", "ftpPass", "ftpPath", "ftpUser", "id", "imagenUrl", "marca", "metaTags", "nombre", "notas", "sheetUrl", "tags", "tecnologias", "ultimoCheck", "ultimoCodigo", "ultimoDeploy", "ultimoMs", "ultimoSslDias", "ultimoSslValido", "ultimoSslVence", "ultimoStatus", "updatedAt", "url", "userId" FROM "Landing";
DROP TABLE "Landing";
ALTER TABLE "new_Landing" RENAME TO "Landing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TemplateType_name_key" ON "TemplateType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FieldDefinition_templateTypeId_name_key" ON "FieldDefinition"("templateTypeId", "name");
