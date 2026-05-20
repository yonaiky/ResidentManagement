import { PrismaClient } from "@prisma/client";
import { isSlaBreached } from "../lib/tickets/sla";

const prisma = new PrismaClient();

async function updateTicketSla() {
  const now = new Date();

  try {
    const tickets = await prisma.maintenanceTicket.findMany({
      where: {
        status: { notIn: ["closed", "cancelled", "resolved"] },
        slaDueAt: { not: null },
      },
      select: {
        id: true,
        slaDueAt: true,
        slaBreached: true,
        status: true,
      },
    });

    let updated = 0;

    for (const ticket of tickets) {
      const breached = isSlaBreached(ticket.slaDueAt, ticket.status, now);
      if (breached !== ticket.slaBreached) {
        await prisma.maintenanceTicket.update({
          where: { id: ticket.id },
          data: { slaBreached: breached },
        });
        updated++;
      }
    }

    console.log(
      `SLA actualizado: ${updated} de ${tickets.length} tickets activos revisados`
    );
  } catch (error) {
    console.error("Error al actualizar SLA de tickets:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

updateTicketSla();
