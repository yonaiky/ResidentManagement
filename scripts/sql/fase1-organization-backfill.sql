-- Backfill only (run after prisma db push)
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

UPDATE "Property" p
SET "organizationId" = o."id"
FROM "Organization" o
WHERE p."tenantId" = o."tenantId"
  AND p."organizationId" IS NULL;

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
