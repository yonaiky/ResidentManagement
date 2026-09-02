import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";
import { writeAuditLog } from "@/lib/audit/log";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const existing = await prisma.announcement.findFirst({
    where: {
      id: params.id,
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const nextStatus = body.status as string | undefined;
  const data: Record<string, unknown> = {};
  if (body.title != null) data.title = String(body.title).trim();
  if (body.content != null) data.content = String(body.content).trim();
  if (body.priority != null) data.priority = body.priority;
  if (body.audienceType != null) data.audienceType = body.audienceType;
  if (body.audiencePayload !== undefined) data.audiencePayload = body.audiencePayload;

  if (nextStatus === "PUBLISHED" && existing.status !== "PUBLISHED") {
    data.status = "PUBLISHED";
    data.publishedAt = new Date();
  } else if (nextStatus === "ARCHIVED") {
    data.status = "ARCHIVED";
    data.archivedAt = new Date();
  } else if (nextStatus === "DRAFT") {
    data.status = "DRAFT";
  }

  const updated = await prisma.announcement.update({
    where: { id: existing.id },
    data,
  });

  if (nextStatus === "PUBLISHED" && existing.status !== "PUBLISHED") {
    await emitOpsEvent({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      event: OPS_EVENTS.AnnouncementPublished,
      entity: "Announcement",
      entityId: updated.id,
    });
  }

  await writeAuditLog({
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
    userId: auth.userId,
    action: "update",
    entity: "Announcement",
    entityId: updated.id,
    previousValues: { status: existing.status },
    newValues: { status: updated.status },
  });

  return NextResponse.json(updated);
}
