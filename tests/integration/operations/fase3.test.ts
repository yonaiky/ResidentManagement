import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { slugifyTenantName } from "@/lib/tenant/plans";
import { generateTicketNumber } from "@/lib/tickets/number";
import { computeSlaDueAt } from "@/lib/tickets/sla";
import { canTransition } from "@/lib/tickets/status";
import {
  accessCodeExpiresAt,
  generateAccessCode,
  isAccessCodeValid,
} from "@/lib/operations/access-code";
import {
  createReservation,
  approveReservation,
} from "@/lib/reservations/service";
import { hasReservationOverlap } from "@/lib/reservations/overlap";

const hasDb = Boolean(process.env.DATABASE_URL);
const PREFIX = `ops3-${Date.now()}`;

describe.skipIf(!hasDb)("fase 3 operations integration", () => {
  let tenantA = "";
  let tenantB = "";
  let orgA = "";
  let orgB = "";
  let unitA = "";
  let profileId = "";
  let residentA = 0;
  let areaId = "";

  beforeAll(async () => {
    profileId = crypto.randomUUID();
    await prisma.profile.create({
      data: {
        id: profileId,
        username: `${PREFIX}-u`,
        email: `${PREFIX}@test.local`,
        role: "admin",
      },
    });

    const slugA = slugifyTenantName(`${PREFIX}-a`);
    const slugB = slugifyTenantName(`${PREFIX}-b`);

    const tA = await prisma.tenant.create({
      data: { name: `${PREFIX}-A`, slug: slugA, status: "ACTIVE" },
    });
    const tB = await prisma.tenant.create({
      data: { name: `${PREFIX}-B`, slug: slugB, status: "ACTIVE" },
    });
    tenantA = tA.id;
    tenantB = tB.id;

    const oA = await prisma.organization.create({
      data: { tenantId: tenantA, name: "OrgA", slug: slugA, status: "ACTIVE" },
    });
    const oB = await prisma.organization.create({
      data: { tenantId: tenantB, name: "OrgB", slug: slugB, status: "ACTIVE" },
    });
    orgA = oA.id;
    orgB = oB.id;

    await prisma.tenantMembership.create({
      data: {
        tenantId: tenantA,
        profileId,
        role: "tenant_admin",
        status: "active",
      },
    });

    const property = await prisma.property.create({
      data: {
        tenantId: tenantA,
        organizationId: orgA,
        name: "P",
        code: `${PREFIX}-P`,
      },
    });
    const unit = await prisma.unit.create({
      data: { propertyId: property.id, code: "A-1", status: "occupied" },
    });
    unitA = unit.id;

    const resident = await prisma.resident.create({
      data: {
        tenantId: tenantA,
        name: "Host",
        lastName: "Test",
        cedula: `${PREFIX}-ced`,
        phone: "8090000000",
        address: "A-1",
      },
    });
    residentA = resident.id;

    const area = await prisma.commonArea.create({
      data: {
        tenantId: tenantA,
        organizationId: orgA,
        name: "Gazebo",
        openTime: "08:00",
        closeTime: "22:00",
        minDurationMin: 60,
        maxDurationMin: 240,
        requiresApproval: true,
        priceAmount: 1000,
        status: "ACTIVE",
      },
    });
    areaId = area.id;
  }, 60000);

  afterAll(async () => {
    await prisma.reservation.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.charge.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.commonArea.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.ticketAttachment.deleteMany({
      where: { ticket: { tenantId: { in: [tenantA, tenantB] } } },
    });
    await prisma.ticketStatusHistory.deleteMany({
      where: { ticket: { tenantId: { in: [tenantA, tenantB] } } },
    });
    await prisma.ticketComment.deleteMany({
      where: { ticket: { tenantId: { in: [tenantA, tenantB] } } },
    });
    await prisma.maintenanceTicket.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.parkingVisit.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.documentAsset.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.provider.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.resident.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.unit.deleteMany({
      where: { property: { tenantId: { in: [tenantA, tenantB] } } },
    });
    await prisma.property.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.organizationMembership.deleteMany({
      where: { organizationId: { in: [orgA, orgB] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgA, orgB] } },
    });
    await prisma.tenantMembership.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.auditLog.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
    await prisma.profile.deleteMany({ where: { id: profileId } });
  }, 60000);

  it("creates ticket with org + history + SLA", async () => {
    const createdAt = new Date();
    const ticketNumber = await generateTicketNumber(tenantA, createdAt);
    const slaDueAt = await computeSlaDueAt(
      tenantA,
      "plumbing",
      "urgent",
      createdAt
    );
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        tenantId: tenantA,
        organizationId: orgA,
        ticketNumber,
        title: "Fuga",
        description: "Baño",
        category: "plumbing",
        priority: "urgent",
        status: "open",
        createdById: profileId,
        slaDueAt,
      },
    });
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        fromStatus: null,
        toStatus: "open",
        changedById: profileId,
        note: "Ticket creado",
      },
    });

    expect(canTransition("open", "assigned")).toBe(true);
    const assigned = await prisma.maintenanceTicket.update({
      where: { id: ticket.id },
      data: { status: "assigned", assignedToId: profileId },
    });
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        fromStatus: "open",
        toStatus: "assigned",
        changedById: profileId,
      },
    });
    expect(assigned.status).toBe("assigned");

    const history = await prisma.ticketStatusHistory.findMany({
      where: { ticketId: ticket.id },
    });
    expect(history.length).toBeGreaterThanOrEqual(2);

    const foreign = await prisma.maintenanceTicket.findFirst({
      where: { id: ticket.id, tenantId: tenantB },
    });
    expect(foreign).toBeNull();
  });

  it("visitor preauth + checkin/out + invalid token", async () => {
    const code = generateAccessCode();
    const now = new Date();
    const validFrom = new Date(now.getTime() - 60_000);
    const validTo = new Date(now.getTime() + 60 * 60_000);

    const visit = await prisma.parkingVisit.create({
      data: {
        tenantId: tenantA,
        organizationId: orgA,
        plate: "A123456",
        plateNormalized: "A123456",
        visitorName: "Juan",
        hostResidentId: residentA,
        validFrom,
        validTo,
        status: "scheduled",
        accessCode: code,
        accessExpiresAt: accessCodeExpiresAt(validTo),
      },
    });

    expect(
      isAccessCodeValid({
        code: "WRONG",
        expected: visit.accessCode,
        expiresAt: visit.accessExpiresAt,
      })
    ).toBe(false);

    expect(
      isAccessCodeValid({
        code,
        expected: visit.accessCode,
        expiresAt: visit.accessExpiresAt,
      })
    ).toBe(true);

    const inVisit = await prisma.parkingVisit.update({
      where: { id: visit.id },
      data: {
        checkedInAt: now,
        checkedInById: profileId,
        status: "checked_in",
      },
    });
    expect(inVisit.checkedInAt).toBeTruthy();

    const outVisit = await prisma.parkingVisit.update({
      where: { id: visit.id },
      data: {
        checkedOutAt: new Date(),
        checkedOutById: profileId,
        status: "checked_out",
      },
    });
    expect(outVisit.checkedOutAt).toBeTruthy();
    expect(outVisit.checkedInAt).toBeTruthy();

    const cross = await prisma.parkingVisit.findFirst({
      where: { id: visit.id, tenantId: tenantB },
    });
    expect(cross).toBeNull();
  });

  it("blocks overlapping reservations and creates charge on approve", async () => {
    const day = new Date();
    day.setDate(day.getDate() + 2);
    day.setHours(10, 0, 0, 0);
    const end = new Date(day);
    end.setHours(12, 0, 0, 0);

    const r1 = await createReservation({
      tenantId: tenantA,
      organizationId: orgA,
      commonAreaId: areaId,
      unitId: unitA,
      residentId: residentA,
      startAt: day,
      endAt: end,
      createdByUserId: profileId,
    });
    expect(r1.status).toBe("PENDING");

    await expect(
      createReservation({
        tenantId: tenantA,
        organizationId: orgA,
        commonAreaId: areaId,
        unitId: unitA,
        startAt: day,
        endAt: end,
        createdByUserId: profileId,
      })
    ).rejects.toThrow(/Conflicto/);

    const approved = await approveReservation({
      id: r1.id,
      tenantId: tenantA,
      organizationId: orgA,
      userId: profileId,
    });
    expect(approved.status).toBe("APPROVED");
    expect(approved.chargeId).toBeTruthy();

    const charge = await prisma.charge.findFirst({
      where: { id: approved.chargeId!, tenantId: tenantA, organizationId: orgA },
    });
    expect(charge).toBeTruthy();
    expect(charge?.unitId).toBe(unitA);

    const stillOverlap = await hasReservationOverlap({
      commonAreaId: areaId,
      startAt: day,
      endAt: end,
    });
    expect(stillOverlap).toBe(true);
  });

  it("rejects document path from other tenant", async () => {
    const doc = await prisma.documentAsset.create({
      data: {
        tenantId: tenantA,
        organizationId: orgA,
        name: "Reglamento",
        category: "reglamento",
        filePath: `documents/${tenantA}/${orgA}/x.pdf`,
        fileName: "x.pdf",
        visibility: "ADMINS",
        uploadedByUserId: profileId,
      },
    });

    const leak = await prisma.documentAsset.findFirst({
      where: { id: doc.id, tenantId: tenantB },
    });
    expect(leak).toBeNull();

    expect(doc.filePath.includes(tenantA)).toBe(true);
    expect(doc.filePath.includes(tenantB)).toBe(false);
  });
});
