import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const tenantId = auth.ctx.tenantId;
  const organizationId = org.organizationId;
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const openStatuses = ["open", "assigned", "in_progress", "waiting"];

  const [
    ticketsOpen,
    ticketsCritical,
    ticketsSlaBreached,
    visitorsInside,
    visitorsToday,
    reservationsToday,
    reservationsPending,
    spotsTotal,
    spotsAssigned,
    recentAnnouncements,
    recentActivity,
  ] = await Promise.all([
    prisma.maintenanceTicket.count({
      where: {
        tenantId,
        status: { in: openStatuses },
        OR: [{ organizationId }, { organizationId: null }],
      },
    }),
    prisma.maintenanceTicket.count({
      where: {
        tenantId,
        priority: "urgent",
        status: { in: openStatuses },
        OR: [{ organizationId }, { organizationId: null }],
      },
    }),
    prisma.maintenanceTicket.count({
      where: {
        tenantId,
        slaBreached: true,
        status: { in: openStatuses },
        OR: [{ organizationId }, { organizationId: null }],
      },
    }),
    prisma.parkingVisit.count({
      where: {
        tenantId,
        organizationId,
        checkedInAt: { not: null },
        checkedOutAt: null,
        status: "checked_in",
      },
    }),
    prisma.parkingVisit.count({
      where: {
        tenantId,
        organizationId,
        OR: [
          { checkedInAt: { gte: startOfDay, lte: endOfDay } },
          {
            validFrom: { lte: endOfDay },
            validTo: { gte: startOfDay },
            status: { not: "cancelled" },
          },
        ],
      },
    }),
    prisma.reservation.count({
      where: {
        tenantId,
        organizationId,
        status: { in: ["PENDING", "APPROVED"] },
        startAt: { lte: endOfDay },
        endAt: { gte: startOfDay },
      },
    }),
    prisma.reservation.count({
      where: { tenantId, organizationId, status: "PENDING" },
    }),
    prisma.parkingSpot.count({ where: { tenantId } }),
    prisma.parkingAssignment.count({
      where: { endDate: null, spot: { tenantId } },
    }),
    prisma.announcement.findMany({
      where: { tenantId, organizationId, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        publishedAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId,
        OR: [{ organizationId }, { organizationId: null }],
        action: {
          in: [
            "TicketCreated",
            "TicketAssigned",
            "TicketResolved",
            "TicketClosed",
            "VisitorPreauthorized",
            "VisitorCheckedIn",
            "VisitorCheckedOut",
            "ReservationCreated",
            "ReservationApproved",
            "ReservationRejected",
            "AnnouncementPublished",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return NextResponse.json({
    tickets: {
      open: ticketsOpen,
      critical: ticketsCritical,
      slaBreached: ticketsSlaBreached,
    },
    visitors: {
      inside: visitorsInside,
      today: visitorsToday,
    },
    reservations: {
      today: reservationsToday,
      pendingApproval: reservationsPending,
    },
    parking: {
      total: spotsTotal,
      occupied: spotsAssigned,
      available: Math.max(0, spotsTotal - spotsAssigned),
    },
    announcements: recentAnnouncements,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      createdAt: a.createdAt.toISOString(),
      newValues: a.newValues,
    })),
  });
}
