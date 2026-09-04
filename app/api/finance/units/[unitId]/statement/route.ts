import { NextRequest, NextResponse } from "next/server";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { getUnitStatement } from "@/lib/finance/statements";
import { prisma } from "@/lib/prisma";

type Ctx = { params: { unitId: string } };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const unit = await prisma.unit.findFirst({
    where: {
      id: params.unitId,
      property: { tenantId: auth.ctx.tenantId },
    },
    include: {
      property: { select: { name: true, code: true } },
      occupancies: {
        where: { status: "active" },
        orderBy: [
          { isResponsibleForPayment: "desc" },
          { isPrimary: "desc" },
        ],
        take: 1,
        include: {
          resident: {
            select: { id: true, name: true, lastName: true },
          },
        },
      },
    },
  });

  if (!unit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const statement = await getUnitStatement({
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
    unitId: unit.id,
  });

  const responsible = unit.occupancies[0]?.resident;

  return NextResponse.json({
    unit: {
      id: unit.id,
      code: unit.code,
      propertyName: unit.property.name,
    },
    responsible: responsible
      ? {
          id: responsible.id,
          name: `${responsible.name} ${responsible.lastName}`,
        }
      : null,
    balance: statement.balance,
    lines: statement.lines,
  });
}
