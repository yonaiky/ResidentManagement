import { prisma } from "@/lib/prisma";
import {
  applyPlanLimitsToTenant,
  slugifyTenantName,
} from "@/lib/tenant/plans";
import { assertWithinLimit } from "@/lib/tenant/limits";
import { writeAuditLog } from "@/lib/audit/log";

export type CreateTenantInput = {
  organizationName: string;
  profileId: string;
  email: string;
  propertyName?: string;
  propertyCode?: string;
  propertyType?: string;
  address?: string;
};

export async function createTenantWithOwner(input: CreateTenantInput) {
  const organizationName = input.organizationName.trim();
  if (!organizationName) {
    throw new Error("organizationName required");
  }

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  let slug = slugifyTenantName(organizationName);
  if (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: organizationName,
        slug,
        status: "TRIAL",
        trialEndsAt: trialEnds,
        email: input.email,
        ...applyPlanLimitsToTenant("BASIC"),
      },
    });

    await tx.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        profileId: input.profileId,
        role: "tenant_admin",
        status: "active",
      },
    });

    const organization = await tx.organization.create({
      data: {
        tenantId: tenant.id,
        name: organizationName,
        slug,
        organizationType: "residential",
        status: "ACTIVE",
      },
    });

    await tx.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: input.profileId,
        role: "tenant_admin",
        status: "active",
      },
    });

    await tx.profile.update({
      where: { id: input.profileId },
      data: { role: "admin" },
    });

    let property = null;
    const propertyName = input.propertyName?.trim();
    const propertyCode = input.propertyCode?.trim();
    if (propertyName && propertyCode) {
      const limitCheck = await assertWithinLimit(tenant, "properties");
      if (!limitCheck.ok) {
        throw new Error(limitCheck.message);
      }
      property = await tx.property.create({
        data: {
          tenantId: tenant.id,
          organizationId: organization.id,
          name: propertyName,
          code: propertyCode.toUpperCase(),
          propertyType: input.propertyType ?? "condominium",
          address: input.address?.trim() || null,
        },
      });
    }

    return { tenant, organization, property };
  }).then(async (result) => {
    await writeAuditLog({
      tenantId: result.tenant.id,
      organizationId: result.organization.id,
      userId: input.profileId,
      action: "create",
      entity: "Organization",
      entityId: result.organization.id,
      newValues: {
        name: result.organization.name,
        slug: result.organization.slug,
      },
    });
    return result;
  });
}
