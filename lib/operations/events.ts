import { writeAuditLog } from "@/lib/audit/log";
import type { Prisma } from "@prisma/client";

/** Eventos internos operativos (sin proveedores externos en Fase 3). */
export const OPS_EVENTS = {
  TicketCreated: "TicketCreated",
  TicketAssigned: "TicketAssigned",
  TicketResolved: "TicketResolved",
  TicketClosed: "TicketClosed",
  VisitorPreauthorized: "VisitorPreauthorized",
  VisitorCheckedIn: "VisitorCheckedIn",
  VisitorCheckedOut: "VisitorCheckedOut",
  ReservationCreated: "ReservationCreated",
  ReservationApproved: "ReservationApproved",
  ReservationRejected: "ReservationRejected",
  ReservationCancelled: "ReservationCancelled",
  AnnouncementPublished: "AnnouncementPublished",
  DocumentUploaded: "DocumentUploaded",
  DocumentReplaced: "DocumentReplaced",
  ParkingReassigned: "ParkingReassigned",
  ProviderCreated: "ProviderCreated",
} as const;

export type OpsEventName = (typeof OPS_EVENTS)[keyof typeof OPS_EVENTS];

export async function emitOpsEvent(input: {
  tenantId: string;
  organizationId?: string | null;
  userId?: string | null;
  event: OpsEventName;
  entity: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
}): Promise<void> {
  await writeAuditLog({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    userId: input.userId,
    action: input.event,
    entity: input.entity,
    entityId: input.entityId,
    newValues: input.payload,
  });
}
