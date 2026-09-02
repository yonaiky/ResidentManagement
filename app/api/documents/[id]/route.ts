import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { writeAuditLog } from "@/lib/audit/log";

function canDownload(
  visibility: string,
  role: string,
  isPlatformAdmin: boolean
): boolean {
  if (isPlatformAdmin) return true;
  if (visibility === "ADMINS") {
    return ["admin", "tenant_admin", "manager", "platform_admin"].includes(role);
  }
  return true;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const doc = await prisma.documentAsset.findFirst({
    where: {
      id: params.id,
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canDownload(doc.visibility, auth.ctx.membershipRole, auth.ctx.isPlatformAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!doc.filePath.includes(auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readFile(path.join(process.cwd(), "uploads", doc.filePath));
    return new NextResponse(data, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const doc = await prisma.documentAsset.findFirst({
    where: {
      id: params.id,
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
    },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.documentAsset.update({
    where: { id: doc.id },
    data: { status: "DELETED" },
  });

  await writeAuditLog({
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
    userId: auth.userId,
    action: "soft_delete",
    entity: "DocumentAsset",
    entityId: doc.id,
  });

  return NextResponse.json(updated);
}
