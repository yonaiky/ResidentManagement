import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        residentId: parseInt(params.id)
      },
      include: {
        resident: {
          select: {
            name: true,
            lastName: true,
            noRegistro: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformar los datos para incluir información adicional
    const formattedPayments = payments.map(payment => ({
      ...payment,
      residentName: `${payment.resident.name} ${payment.resident.lastName}`,
      noRegistro: payment.resident.noRegistro,
      monthName: new Date(payment.year, payment.month - 1).toLocaleString('es', { month: 'long' }),
      year: payment.year
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: "Error al obtener los pagos" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  console.log('Iniciando registro de pago...');
  console.log('Params:', params);
  
  try {
    // Validar que el ID sea un número válido
    const residentId = parseInt(params.id);
    console.log('Resident ID:', residentId);
    
    if (isNaN(residentId)) {
      console.log('ID de residente inválido');
      return NextResponse.json(
        { error: "ID de residente inválido" },
        { status: 400 }
      );
    }

    // Validar que el body sea JSON válido
    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return NextResponse.json(
        { error: "JSON inválido en el body" },
        { status: 400 }
      );
    }

    const { amount } = body;
    console.log('Amount:', amount);
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      console.log('Monto inválido');
      return NextResponse.json(
        { error: "El monto debe ser un número válido mayor que 0" },
        { status: 400 }
      );
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    console.log('Fecha actual:', { today, currentMonth, currentYear });

    // Verificar si el residente existe
    console.log('Buscando residente...');
    const resident = await prisma.resident.findUnique({
      where: { id: residentId }
    });

    if (!resident) {
      console.log('Residente no encontrado');
      return NextResponse.json(
        { error: "Residente no encontrado" },
        { status: 404 }
      );
    }
    console.log('Residente encontrado:', resident);

    // Verificar si ya existe un pago para este mes
    console.log('Verificando pagos existentes...');
    const existingPayment = await prisma.payment.findFirst({
      where: {
        AND: [
          { residentId: residentId },
          { month: currentMonth },
          { year: currentYear }
        ]
      }
    });

    if (existingPayment) {
      console.log('Pago existente encontrado');
      return NextResponse.json(
        { error: "Ya existe un pago registrado para este mes" },
        { status: 400 }
      );
    }

    // Calcular la fecha de vencimiento (día 30 del mes actual)
    const dueDate = new Date(currentYear, currentMonth, 30);
    console.log('Fecha de vencimiento:', dueDate);

    // Calcular la fecha del próximo pago (día 30 del mes siguiente)
    const nextPaymentDate = new Date(currentYear, currentMonth + 1, 30);
    console.log('Fecha del próximo pago:', nextPaymentDate);

    // Crear el pago
    console.log('Creando pago...');
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        residentId: residentId,
        paymentDate: today,
        dueDate,
        month: currentMonth,
        year: currentYear,
        status: 'completed'
      }
    });
    console.log('Pago creado:', payment);

    // Actualizar el estado del residente
    console.log('Actualizando estado del residente...');
    await prisma.resident.update({
      where: { id: residentId },
      data: {
        paymentStatus: 'paid',
        lastPaymentDate: today,
        nextPaymentDate
      }
    });
    console.log('Estado del residente actualizado');

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error detallado:', error);
    return NextResponse.json(
      { 
        error: "Error al registrar el pago",
        details: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 