import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { moneyToNumber } from "@/lib/finance/money";

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const unitId = request.nextUrl.searchParams.get("unitId");
  const status = request.nextUrl.searchParams.get("status");

  const charges = await prisma.charge.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      ...(unitId ? { unitId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      unit: { select: { id: true, code: true } },
      fee: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({
    items: charges.map((c) => ({
      ...c,
      amount: moneyToNumber(c.amount),
      outstandingAmount: moneyToNumber(c.outstandingAmount),
    })),
  });
}
