import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { money, moneyToNumber } from "@/lib/finance/money";
import { resolveOrganizationId } from "@/lib/finance/org";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const residentId = parseInt(params.id, 10);
  if (Number.isNaN(residentId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId: auth.ctx.tenantId },
    });
    if (!resident) {
      return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
    }

    const payments = await prisma.payment.findMany({
      where: { residentId, tenantId: auth.ctx.tenantId },
      include: {
        resident: {
          select: {
            name: true,
            lastName: true,
            noRegistro: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedPayments = payments.map((payment) => ({
      ...payment,
      amount: moneyToNumber(payment.amount),
      residentName: payment.resident
        ? `${payment.resident.name} ${payment.resident.lastName}`
        : "—",
      noRegistro: payment.resident?.noRegistro,
      monthName: payment.month && payment.year
        ? new Date(payment.year, payment.month - 1).toLocaleString("es", {
            month: "long",
          })
        : "",
      year: payment.year,
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Error al obtener los pagos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const residentId = parseInt(params.id, 10);

    if (Number.isNaN(residentId)) {
      return NextResponse.json(
        { error: "ID de residente inválido" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "JSON inválido en el body" },
        { status: 400 }
      );
    }

    const { amount, month, year } = body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser un número válido mayor que 0" },
        { status: 400 }
      );
    }

    const today = new Date();
    const paymentMonth = month || today.getMonth() + 1;
    const paymentYear = year || today.getFullYear();

    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId: auth.ctx.tenantId },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Residente no encontrado" },
        { status: 404 }
      );
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        residentId,
        tenantId: auth.ctx.tenantId,
        month: paymentMonth,
        year: paymentYear,
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        {
          error: `Ya existe un pago registrado para ${new Date(paymentYear, paymentMonth - 1).toLocaleString("es", { month: "long" })} ${paymentYear}`,
        },
        { status: 400 }
      );
    }

    const dueDate = new Date(paymentYear, paymentMonth - 1, 30);

    const org = await resolveOrganizationId(auth);
    const organizationId =
      org instanceof NextResponse ? null : org.organizationId;

    const payment = await prisma.payment.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId,
        amount: money(parseFloat(amount)),
        residentId,
        paymentDate: today,
        dueDate,
        month: paymentMonth,
        year: paymentYear,
        status: "CONFIRMED",
        createdById: auth.userId,
      },
    });

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (
      paymentYear > currentYear ||
      (paymentYear === currentYear && paymentMonth >= currentMonth)
    ) {
      let nextPaymentDate;
      if (paymentMonth === 12) {
        nextPaymentDate = new Date(paymentYear + 1, 0, 30);
      } else {
        nextPaymentDate = new Date(paymentYear, paymentMonth, 30);
      }

      await prisma.resident.update({
        where: { id: residentId },
        data: {
          paymentStatus: "paid",
          lastPaymentDate: today,
          nextPaymentDate,
        },
      });
    }

    return NextResponse.json({
      ...payment,
      amount: moneyToNumber(payment.amount),
    });
  } catch (error) {
    console.error("Error detallado:", error);
    return NextResponse.json(
      {
        error: "Error al registrar el pago",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
