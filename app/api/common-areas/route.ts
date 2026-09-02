import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { money, moneyToNumber } from "@/lib/finance/money";
import { writeAuditLog } from "@/lib/audit/log";

function serializeArea(a: {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  openTime: string;
  closeTime: string;
  minDurationMin: number;
  maxDurationMin: number;
  requiresApproval: boolean;
  priceAmount: unknown;
  depositAmount: unknown;
  maxMonthlyPerUnit: number | null;
  minAdvanceHours: number | null;
  blockIfDebt: boolean;
  status: string;
}) {
  return {
    ...a,
    priceAmount: a.priceAmount != null ? moneyToNumber(a.priceAmount as never) : null,
    depositAmount:
      a.depositAmount != null ? moneyToNumber(a.depositAmount as never) : null,
  };
}

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const items = await prisma.commonArea.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      status: "ACTIVE",
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items: items.map(serializeArea) });
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name requerido" }, { status: 400 });
    }

    const area = await prisma.commonArea.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        name: String(body.name).trim(),
        description: body.description ? String(body.description).trim() : null,
        capacity: body.capacity != null ? Number(body.capacity) : null,
        openTime: body.openTime || "08:00",
        closeTime: body.closeTime || "22:00",
        minDurationMin: body.minDurationMin ?? 60,
        maxDurationMin: body.maxDurationMin ?? 240,
        requiresApproval: body.requiresApproval !== false,
        priceAmount:
          body.priceAmount != null && Number(body.priceAmount) > 0
            ? money(Number(body.priceAmount))
            : null,
        depositAmount:
          body.depositAmount != null && Number(body.depositAmount) > 0
            ? money(Number(body.depositAmount))
            : null,
        maxMonthlyPerUnit:
          body.maxMonthlyPerUnit != null ? Number(body.maxMonthlyPerUnit) : null,
        minAdvanceHours:
          body.minAdvanceHours != null ? Number(body.minAdvanceHours) : null,
        blockIfDebt: Boolean(body.blockIfDebt),
        status: "ACTIVE",
      },
    });

    await writeAuditLog({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      action: "create",
      entity: "CommonArea",
      entityId: area.id,
    });

    return NextResponse.json(serializeArea(area), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
