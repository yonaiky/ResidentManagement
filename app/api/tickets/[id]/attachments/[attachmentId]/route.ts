import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { findTicketWithAccess, requireTicketAuth } from "@/lib/tickets/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;

  const ticketId = parseInt(params.id, 10);
  if (Number.isNaN(ticketId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ticket = await findTicketWithAccess(ticketId, auth);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const attachment = await prisma.ticketAttachment.findFirst({
    where: { id: params.attachmentId, ticketId },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Segregación: path debe pertenecer al tenant del ticket
  if (!attachment.filePath.includes(auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const full = path.join(process.cwd(), "uploads", attachment.filePath);
    const data = await readFile(full);
    return new NextResponse(data, {
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${attachment.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }
}
