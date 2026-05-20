import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingManager } from "@/lib/parking/auth";
import { serializeFine } from "@/lib/parking/serialize";

type RouteContext = { params: { id: string } };

const fineInclude = {
  resident: {
    select: {
      id: true,
      name: true,
      lastName: true,
      address: true,
      noRegistro: true,
    },
  },
  issuedBy: { select: { id: true, username: true } },
} as const;

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const status = body.status as string | undefined;

    if (status && !["pending", "paid", "waived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (status) {
      data.status = status;
      if (status === "paid") {
        data.paidAt = new Date();
      } else if (status === "waived") {
        data.paidAt = null;
      }
    }
    if (body.notes !== undefined) {
      data.notes = body.notes ? String(body.notes).trim() : null;
    }

    const fine = await prisma.parkingFine.update({
      where: { id },
      data,
      include: fineInclude,
    });

    return NextResponse.json(serializeFine(fine));
  } catch (error) {
    console.error("PATCH /api/parking/fines/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
