-- Fase 1: Organization, OrganizationMembership, AuditLog, Payment.createdById
-- Ejecutar con: npx prisma db execute --file scripts/sql/fase1-organization.sql

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "organizationType" TEXT NOT NULL DEFAULT 'residential',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_tenantId_slug_key" ON "Organization"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "Organization_tenantId_idx" ON "Organization"("tenantId");
CREATE INDEX IF NOT EXISTS "Organization_status_idx" ON "Organization"("status");

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "OrganizationMembership" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "profileId" UUID NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMembership_organizationId_profileId_key"
  ON "OrganizationMembership"("organizationId", "profileId");
CREATE INDEX IF NOT EXISTS "OrganizationMembership_profileId_idx" ON "OrganizationMembership"("profileId");

ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "organizationId" TEXT,
  "userId" UUID,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "previousValues" JSONB,
  "newValues" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
CREATE INDEX IF NOT EXISTS "Property_organizationId_idx" ON "Property"("organizationId");
ALTER TABLE "Property" ADD CONSTRAINT "Property_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "createdById" UUID;

-- Migración 1:1: cada Tenant recibe una Organization default
INSERT INTO "Organization" ("id", "tenantId", "name", "slug", "organizationType", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  t."id",
  t."name",
  t."slug",
  'residential',
  CASE WHEN t."status" IN ('TRIAL', 'ACTIVE') THEN 'ACTIVE' ELSE 'INACTIVE' END,
  t."createdAt",
  NOW()
FROM "Tenant" t
WHERE NOT EXISTS (
  SELECT 1 FROM "Organization" o WHERE o."tenantId" = t."id"
);

-- Vincular properties existentes a su organization default
UPDATE "Property" p
SET "organizationId" = o."id"
FROM "Organization" o
WHERE p."tenantId" = o."tenantId"
  AND p."organizationId" IS NULL;

-- Crear OrganizationMembership desde TenantMembership
INSERT INTO "OrganizationMembership" ("id", "organizationId", "profileId", "role", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  o."id",
  tm."profileId",
  tm."role",
  tm."status",
  tm."createdAt",
  NOW()
FROM "TenantMembership" tm
JOIN "Organization" o ON o."tenantId" = tm."tenantId"
WHERE NOT EXISTS (
  SELECT 1 FROM "OrganizationMembership" om
  WHERE om."organizationId" = o."id" AND om."profileId" = tm."profileId"
);
