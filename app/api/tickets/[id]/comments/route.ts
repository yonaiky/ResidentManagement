import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findTicketWithAccess, requireTicketAuth } from "@/lib/tickets/auth";

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
    return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  try {
    const ticket = await findTicketWithAccess(ticketId, auth.user);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const comments = await prisma.ticketComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, username: true, email: true } },
      },
    });

    return NextResponse.json(
      comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: c.author,
      }))
    );
  } catch (error) {
    console.error("GET /api/tickets/[id]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const ticketId = parseId(params.id);
  if (ticketId == null) {
    return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  try {
    const { body } = (await request.json()) as { body?: string };
    if (!body?.trim()) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }

    const ticket = await findTicketWithAccess(ticketId, user);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: user.userId,
        body: body.trim(),
      },
      include: {
        author: { select: { id: true, username: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tickets/[id]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
