import { NextResponse } from "next/server";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { getReceivables } from "@/lib/finance/statements";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const items = await getReceivables({
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
  });

  return NextResponse.json({ items });
}
