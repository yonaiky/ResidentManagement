import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingAuth } from "@/lib/parking/auth";
import { aggregateAvailabilityCounts } from "@/lib/parking/availability";
import {
  loadActiveAssignments,
  loadActiveVisitsForAvailability,
  loadAllSpots,
} from "@/lib/parking/queries";
import type { ParkingOverview } from "@/lib/parking/types";

export async function GET() {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const tenantId = auth.ctx.tenantId;
    const [spots, assignments, visits, visitsToday, pendingFines, activeVehicles] =
      await Promise.all([
        loadAllSpots(tenantId, auth.ctx.propertyId),
        loadActiveAssignments(tenantId),
        loadActiveVisitsForAvailability(tenantId),
        prisma.parkingVisit.count({
          where: {
            validFrom: { lte: endOfDay },
            validTo: { gte: startOfDay },
            status: { not: "cancelled" },
            spot: { tenantId },
          },
        }),
        prisma.parkingFine.findMany({
          where: { status: "pending", tenantId },
          select: { amount: true },
        }),
        prisma.vehicle.count({ where: { isActive: true, tenantId } }),
      ]);

    const spotCounts = aggregateAvailabilityCounts(spots, assignments, visits, now);

    const activeVisits = visits.filter(
      (v) => v.validFrom <= now && v.validTo >= now
    ).length;

    const overview: ParkingOverview = {
      spots: spotCounts,
      visitsToday,
      activeVisits,
      pendingFines: pendingFines.length,
      pendingFinesAmount: pendingFines.reduce((s, f) => s + f.amount, 0),
      activeVehicles,
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error("GET /api/parking/overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
