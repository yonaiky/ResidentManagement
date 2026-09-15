import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/http";
import {
  announcementAudienceSchema,
  announcementStatusSchema,
} from "@/lib/validation/enums";
import { optionalLongText, shortText } from "@/lib/validation/common";

// `priority` stays unconstrained: the UI exposes no selector for it and only
// the "medium" default is ever written, so there is no proven value set.
const createAnnouncementSchema = z.object({
  title: shortText,
  content: optionalLongText.min(1),
  priority: shortText.optional(),
  status: announcementStatusSchema.optional(),
  audienceType: announcementAudienceSchema.optional(),
  audiencePayload: z.unknown().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const status = request.nextUrl.searchParams.get("status");
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") || "20", 10) || 20));

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
  };
  if (status) where.status = status;

  const [total, items] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const parsed = await parseJsonBody(request, createAnnouncementSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const announcement = await prisma.announcement.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        title: body.title,
        content: body.content,
        priority: body.priority || "medium",
        status,
        audienceType: body.audienceType || "ALL",
        audiencePayload: body.audiencePayload ?? undefined,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        createdByUserId: auth.userId,
      },
    });

    if (status === "PUBLISHED") {
      await emitOpsEvent({
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        userId: auth.userId,
        event: OPS_EVENTS.AnnouncementPublished,
        entity: "Announcement",
        entityId: announcement.id,
      });
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
