import { prisma } from "@/lib/prisma";

const assignmentInclude = {
  spot: { select: { code: true } },
  vehicle: { select: { plate: true } },
  resident: {
    select: {
      id: true,
      name: true,
      lastName: true,
      address: true,
      noRegistro: true,
    },
  },
} as const;

export async function loadActiveAssignments(tenantId: string) {
  return prisma.parkingAssignment.findMany({
    where: {
      endDate: null,
      spot: { tenantId },
    },
    include: assignmentInclude,
  });
}

export async function loadActiveVisitsForAvailability(tenantId: string) {
  const now = new Date();
  return prisma.parkingVisit.findMany({
    where: {
      status: { not: "cancelled" },
      validTo: { gte: now },
      spot: { tenantId },
    },
    select: {
      spotId: true,
      validFrom: true,
      validTo: true,
      status: true,
    },
  });
}

export async function loadAllSpots(tenantId: string, propertyId?: string | null) {
  return prisma.parkingSpot.findMany({
    where: {
      tenantId,
      ...(propertyId ? { propertyId } : {}),
    },
    orderBy: [{ zone: "asc" }, { code: "asc" }],
  });
}

export { assignmentInclude };
