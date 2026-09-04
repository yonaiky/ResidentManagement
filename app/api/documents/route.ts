import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";

const MAX_BYTES = 15 * 1024 * 1024;

function canViewDocument(
  visibility: string,
  role: string,
  isPlatformAdmin: boolean
): boolean {
  if (isPlatformAdmin) return true;
  if (visibility === "ADMINS") {
    return (
      role === "admin" ||
      role === "tenant_admin" ||
      role === "manager" ||
      role === "platform_admin"
    );
  }
  if (visibility === "RESIDENTS" || visibility === "OWNERS" || visibility === "ALL") {
    return true;
  }
  return (
    role === "admin" ||
    role === "tenant_admin" ||
    role === "manager" ||
    role === "platform_admin"
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const category = request.nextUrl.searchParams.get("category");
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") || "20", 10) || 20));

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
    status: "ACTIVE",
  };
  if (category) where.category = category;

  const [total, raw] = await Promise.all([
    prisma.documentAsset.count({ where }),
    prisma.documentAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items = raw.filter((d) =>
    canViewDocument(d.visibility, auth.ctx.membershipRole, auth.ctx.isPlatformAdmin)
  );

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const name = String(form.get("name") || "").trim();
    const category = String(form.get("category") || "internal").trim();
    const description = String(form.get("description") || "").trim() || null;
    const visibility = String(form.get("visibility") || "ADMINS");
    const replacesId = String(form.get("replacesId") || "") || null;

    if (!(file instanceof File) || !name) {
      return NextResponse.json({ error: "name y file son requeridos" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Archivo demasiado grande" }, { status: 400 });
    }

    let version = 1;
    if (replacesId) {
      const prev = await prisma.documentAsset.findFirst({
        where: {
          id: replacesId,
          tenantId: auth.ctx.tenantId,
          organizationId: org.organizationId,
        },
      });
      if (!prev) {
        return NextResponse.json({ error: "Documento a reemplazar no encontrado" }, { status: 404 });
      }
      version = prev.version + 1;
      await prisma.documentAsset.update({
        where: { id: prev.id },
        data: { status: "ARCHIVED" },
      });
    }

    const dir = path.join(
      process.cwd(),
      "uploads",
      "documents",
      auth.ctx.tenantId,
      org.organizationId
    );
    await mkdir(dir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stored = `${Date.now()}-${safeName}`;
    await writeFile(path.join(dir, stored), Buffer.from(await file.arrayBuffer()));
    const relative = path
      .join("documents", auth.ctx.tenantId, org.organizationId, stored)
      .replace(/\\/g, "/");

    const doc = await prisma.documentAsset.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        name,
        category,
        description,
        filePath: relative,
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
        visibility,
        version,
        replacesId,
        uploadedByUserId: auth.userId,
      },
    });

    await emitOpsEvent({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      event: replacesId ? OPS_EVENTS.DocumentReplaced : OPS_EVENTS.DocumentUploaded,
      entity: "DocumentAsset",
      entityId: doc.id,
      payload: { name, version },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
