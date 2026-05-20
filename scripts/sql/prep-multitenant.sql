-- Prep existing DB for multitenant (run once before prisma db push)
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'BASIC',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "trialEndsAt" TIMESTAMP(3),
    "maxProperties" INTEGER,
    "maxUsers" INTEGER,
    "maxResidents" INTEGER,
    "maxTokensPerMonth" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "rnc" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");

INSERT INTO "Tenant" ("id", "name", "slug", "plan", "status", "maxProperties", "maxUsers", "maxResidents", "maxTokensPerMonth", "updatedAt")
VALUES (
  'tenant_default_migration',
  'Residencial Principal',
  'default',
  'BASIC',
  'ACTIVE',
  1,
  5,
  100,
  20,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;

DO $$
DECLARE
  tid TEXT;
BEGIN
  SELECT "id" INTO tid FROM "Tenant" WHERE "slug" = 'default' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Resident' AND column_name = 'tenantId') THEN
    ALTER TABLE "Resident" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "Resident" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Token' AND column_name = 'tenantId') THEN
    ALTER TABLE "Token" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "Token" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'tenantId') THEN
    ALTER TABLE "Payment" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "Payment" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'tenantId') THEN
    ALTER TABLE "Notification" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "Notification" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MaintenanceTicket' AND column_name = 'tenantId') THEN
    ALTER TABLE "MaintenanceTicket" ADD COLUMN "tenantId" TEXT;
    ALTER TABLE "MaintenanceTicket" ADD COLUMN "propertyId" TEXT;
  END IF;
  UPDATE "MaintenanceTicket" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MaintenanceSlaRule' AND column_name = 'tenantId') THEN
    ALTER TABLE "MaintenanceSlaRule" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "MaintenanceSlaRule" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ParkingSpot' AND column_name = 'tenantId') THEN
    ALTER TABLE "ParkingSpot" ADD COLUMN "tenantId" TEXT;
    ALTER TABLE "ParkingSpot" ADD COLUMN "propertyId" TEXT;
  END IF;
  UPDATE "ParkingSpot" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Vehicle' AND column_name = 'tenantId') THEN
    ALTER TABLE "Vehicle" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "Vehicle" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ParkingFine' AND column_name = 'tenantId') THEN
    ALTER TABLE "ParkingFine" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "ParkingFine" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CompanyInfo' AND column_name = 'tenantId') THEN
    ALTER TABLE "CompanyInfo" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "CompanyInfo" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FiscalConfig' AND column_name = 'tenantId') THEN
    ALTER TABLE "FiscalConfig" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "FiscalConfig" SET "tenantId" = tid WHERE "tenantId" IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'InvoiceConfig' AND column_name = 'tenantId') THEN
    ALTER TABLE "InvoiceConfig" ADD COLUMN "tenantId" TEXT;
  END IF;
  UPDATE "InvoiceConfig" SET "tenantId" = tid WHERE "tenantId" IS NULL;
END $$;
