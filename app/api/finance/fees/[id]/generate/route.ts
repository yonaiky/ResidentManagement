import { NextRequest, NextResponse } from "next/server";
import { requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { generateChargesForFee } from "@/lib/finance/fees";
import { z } from "zod";
import { parseInput } from "@/lib/validation/http";
import { cuidList } from "@/lib/validation/common";

type Ctx = { params: { id: string } };

const generateChargesSchema = z.object({
  unitIds: cuidList.optional(),
});

export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = parseInput(generateChargesSchema, raw);
    if (!parsed.ok) return parsed.response;

    const result = await generateChargesForFee({
      feeId: params.id,
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      unitIds: parsed.data.unitIds,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
