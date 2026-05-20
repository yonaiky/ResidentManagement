import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import { applyPlanLimitsToTenant } from "@/lib/tenant/plans";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = String(body.name).trim();
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
