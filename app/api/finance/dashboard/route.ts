import { NextResponse } from "next/server";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { getFinanceDashboardStats } from "@/lib/finance/statements";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const stats = await getFinanceDashboardStats({
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
  });

  const totalUnits = await prisma.unit.count({
    where: {
      property: {
        tenantId: auth.ctx.tenantId,
        OR: [
          { organizationId: org.organizationId },
          { organizationId: null },
        ],
      },
    },
  });

  const unitsWithDebt = stats.unitsPending + stats.unitsOverdue;
  const unitsCurrent = Math.max(0, totalUnits - unitsWithDebt);

  return NextResponse.json({
    ...stats,
    totalUnits,
    unitsCurrent,
  });
}
