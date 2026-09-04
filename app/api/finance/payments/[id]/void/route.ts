import { NextRequest, NextResponse } from "next/server";
import { requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { voidPayment } from "@/lib/finance/payments";

type Ctx = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const body = await request.json();
    if (!body.reason || String(body.reason).trim().length < 3) {
      return NextResponse.json(
        { error: "Motivo de anulación requerido" },
        { status: 400 }
      );
    }

    const result = await voidPayment({
      paymentId: parseInt(params.id, 10),
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      reason: String(body.reason).trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
