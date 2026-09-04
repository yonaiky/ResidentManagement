import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";

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
    const body = await request.json();
    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        { error: "title y content son requeridos" },
        { status: 400 }
      );
    }

    const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const announcement = await prisma.announcement.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        title: String(body.title).trim(),
        content: String(body.content).trim(),
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
