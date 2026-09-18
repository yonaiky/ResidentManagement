import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import { applyPlanLimitsToTenant } from "@/lib/tenant/plans";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/http";
import { tenantPlanSchema, tenantStatusSchema } from "@/lib/validation/enums";
import { shortText } from "@/lib/validation/common";

type RouteContext = { params: { id: string } };

// `null` clears a limit, which the plan model uses to mean "unlimited".
const limitValue = z.union([z.coerce.number().int().nonnegative(), z.null()]);

const patchTenantSchema = z.object({
  name: shortText.optional(),
  status: tenantStatusSchema.optional(),
  plan: tenantPlanSchema.optional(),
  maxProperties: limitValue.optional(),
  maxUsers: limitValue.optional(),
  maxResidents: limitValue.optional(),
  maxTokensPerMonth: limitValue.optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const parsed = await parseJsonBody(request, patchTenantSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.status !== undefined) data.status = body.status;
    if (body.plan !== undefined) {
      Object.assign(data, applyPlanLimitsToTenant(body.plan));
    }
    if (body.maxProperties !== undefined) data.maxProperties = body.maxProperties;
    if (body.maxUsers !== undefined) data.maxUsers = body.maxUsers;
    if (body.maxResidents !== undefined) data.maxResidents = body.maxResidents;
    if (body.maxTokensPerMonth !== undefined) {
      data.maxTokensPerMonth = body.maxTokensPerMonth;
    }

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("PATCH platform tenant", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
