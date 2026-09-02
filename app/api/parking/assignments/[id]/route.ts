import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingManager } from "@/lib/parking/auth";
import { assignmentInclude } from "@/lib/parking/queries";
import { serializeAssignment } from "@/lib/parking/serialize";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const assignment = await prisma.parkingAssignment.findFirst({
      where: {
        id,
        spot: { tenantId: auth.ctx.tenantId },
      },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (assignment.endDate) {
      return NextResponse.json(
        { error: "La asignación ya está finalizada" },
        { status: 409 }
      );
    }

    const updated = await prisma.parkingAssignment.update({
      where: { id },
      data: {
        endDate: body.endDate ? new Date(body.endDate) : new Date(),
      },
      include: assignmentInclude,
    });

    return NextResponse.json(serializeAssignment(updated));
  } catch (error) {
    console.error("PATCH /api/parking/assignments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
