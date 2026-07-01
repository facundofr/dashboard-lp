-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
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
    "resetPasswordExpires" TIMESTAMP(3),
    "provider" TEXT,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookConfig" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT 'down,ssl_expiring',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Landing" (
    "id" SERIAL NOT NULL,
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
    "sheetUrl" TEXT,
    "formStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "tags" TEXT,
    "cliente" TEXT,
    "metaTags" JSONB,
    "ultimoDeploy" TIMESTAMP(3),
    "ultimoCheck" TIMESTAMP(3),
    "ultimoStatus" TEXT,
    "ultimoCodigo" INTEGER,
    "ultimoMs" INTEGER,
    "ultimoSslValido" BOOLEAN,
    "ultimoSslDias" INTEGER,
    "ultimoSslVence" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Landing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "landingId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckLog" (
    "id" SERIAL NOT NULL,
    "landingId" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "responseMs" INTEGER,
    "isUp" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'API Key',
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Estado del Servicio',
    "subtitle" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#7c3aed',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPage_slug_key" ON "StatusPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPage_userId_key" ON "StatusPage"("userId");

-- AddForeignKey
ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Landing" ADD CONSTRAINT "Landing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES "Landing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckLog" ADD CONSTRAINT "CheckLog_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES "Landing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPage" ADD CONSTRAINT "StatusPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;