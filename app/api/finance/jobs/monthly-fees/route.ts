import { NextRequest, NextResponse } from "next/server";
import { requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { ensureMonthlyFee } from "@/lib/finance/fees";
import { moneyToNumber } from "@/lib/finance/money";

/** Job idempotente: genera cuota mensual + cargos si no existen. */
export async function POST(request: NextRequest) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const month = body.month ?? now.getMonth() + 1;
    const year = body.year ?? now.getFullYear();
    const amount = parseFloat(body.amount ?? "3500");

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount inválido" }, { status: 400 });
    }

    const result = await ensureMonthlyFee({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      name: body.name ?? "Mantenimiento",
      concept: body.concept ?? `Cuota de mantenimiento ${month}/${year}`,
      amount,
      month,
      year,
      dueDay: body.dueDay ?? 30,
      userId: auth.userId,
    });

    return NextResponse.json({
      created: result.created,
      fee: { ...result.fee, amount: moneyToNumber(result.fee.amount) },
      charges: result.charges,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
