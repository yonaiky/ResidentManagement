import { prisma } from "@/lib/prisma";

export async function generateTicketNumber(createdAt: Date = new Date()): Promise<string> {
  const year = createdAt.getFullYear();
  const prefix = `TKT-${year}-`;

  const last = await prisma.maintenanceTicket.findFirst({
    where: {
      ticketNumber: { startsWith: prefix },
    },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });

  let nextSeq = 1;
  if (last?.ticketNumber) {
    const parts = last.ticketNumber.split("-");
    const seq = parseInt(parts[2] ?? "0", 10);
    if (!Number.isNaN(seq)) nextSeq = seq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}
