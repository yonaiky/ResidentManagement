import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePaymentStatus() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  try {
    // Obtener todos los residentes
    const residents = await prisma.resident.findMany({
      include: {
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1
        }
      }
    });

    for (const resident of residents) {
      const lastPayment = resident.payments[0];
      let newStatus = 'pending';

      if (dayOfMonth > 5) {
        // Si es después del día 5
        if (!lastPayment || 
            lastPayment.month < currentMonth || 
            lastPayment.year < currentYear) {
          newStatus = 'overdue';
        }
      }

      // Actualizar el estado del residente
      await prisma.resident.update({
        where: { id: resident.id },
        data: {
          paymentStatus: newStatus,
          nextPaymentDate: new Date(currentYear, currentMonth, 5) // Próximo pago el día 5 del mes siguiente
        }
      });
    }

    console.log('Estados de pago actualizados correctamente');
  } catch (error) {
    console.error('Error al actualizar estados de pago:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
updatePaymentStatus(); 