import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { findTicketWithAccess, requireTicketAuth } from "@/lib/tickets/auth";
import { writeAuditLog } from "@/lib/audit/log";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;
  const ticketId = parseId(params.id);
  if (ticketId == null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ticket = await findTicketWithAccess(ticketId, auth);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const items = await prisma.ticketAttachment.findMany({
    where: { ticketId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;
  const ticketId = parseId(params.id);
  if (ticketId == null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ticket = await findTicketWithAccess(ticketId, auth);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 8MB)" }, { status: 400 });
    }
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { error: "Tipo no permitido (jpg, png, webp, pdf)" },
        { status: 400 }
      );
    }

    const dir = path.join(
      process.cwd(),
      "uploads",
      "tickets",
      auth.ctx.tenantId,
      String(ticketId)
    );
    await mkdir(dir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stored = `${Date.now()}-${safeName}`;
    const fullPath = path.join(dir, stored);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buffer);

    const relative = path
      .join("tickets", auth.ctx.tenantId, String(ticketId), stored)
      .replace(/\\/g, "/");

    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId,
        fileName: file.name,
        filePath: relative,
        mimeType: mime,
        sizeBytes: file.size,
        uploadedById: auth.userId,
      },
    });

    await prisma.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: ticket.status,
        changedById: auth.userId,
        note: `Evidencia agregada: ${file.name}`,
      },
    });

    await writeAuditLog({
      tenantId: auth.ctx.tenantId,
      organizationId: ticket.organizationId,
      userId: auth.userId,
      action: "attach",
      entity: "MaintenanceTicket",
      entityId: String(ticketId),
      newValues: { fileName: file.name },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("POST ticket attachment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
