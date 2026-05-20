import { NextResponse } from "next/server";
import { requireParkingAuth } from "@/lib/parking/auth";
import {
  loadActiveAssignments,
  loadActiveVisitsForAvailability,
  loadAllSpots,
} from "@/lib/parking/queries";
import { serializeSpot } from "@/lib/parking/serialize";

export async function GET() {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const [spots, assignments, visits] = await Promise.all([
      loadAllSpots(auth.ctx.tenantId, auth.ctx.propertyId),
      loadActiveAssignments(auth.ctx.tenantId),
      loadActiveVisitsForAvailability(auth.ctx.tenantId),
    ]);

    const items = spots.map((s) => serializeSpot(s, assignments, visits));
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/parking/availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
