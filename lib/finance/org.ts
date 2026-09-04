import { NextResponse } from "next/server";
import type { AuthTenantUser } from "@/lib/tenant/types";
import { prisma } from "@/lib/prisma";

/**
 * Resuelve organizationId activo: cookie/contexto o primera org del tenant.
 * Valida membership salvo platform admin.
 */
export async function resolveOrganizationId(
  auth: AuthTenantUser
): Promise<{ organizationId: string } | NextResponse> {
  if (auth.ctx.organizationId) {
    return { organizationId: auth.ctx.organizationId };
  }

  const org = await prisma.organization.findFirst({
    where: { tenantId: auth.ctx.tenantId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  if (!org) {
    return NextResponse.json(
      { error: "Sin organización activa" },
      { status: 403 }
    );
  }

  if (!auth.ctx.isPlatformAdmin) {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_profileId: {
          organizationId: org.id,
          profileId: auth.userId,
        },
      },
    });
    if (!membership || membership.status !== "active") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return { organizationId: org.id };
}
