import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Obtener todos los residentes
export async function GET() {
  try {
    const residents = await prisma.resident.findMany({
      include: {
        tokens: true,
        payments: true,
        notifications: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(residents);
  } catch (error) {
    console.error("Error fetching residents:", error);
    return NextResponse.json(
      { error: "Error al obtener los residentes" },
      { status: 500 }
    );
  }
}

// POST new resident
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cedula, noRegistro, phone, address } = body;

    const resident = await prisma.resident.create({
      data: {
        name,
        cedula,
        noRegistro,
        phone,
        address,
        paymentStatus: "pending",
        nextPaymentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 30),
      },
    });

    return NextResponse.json(resident, { status: 201 });
  } catch (error) {
    console.error("Error creating resident:", error);
    return NextResponse.json(
      { error: "Error al crear el residente" },
      { status: 500 }
    );
  }
}

// PUT update resident
export async function PUT(request: Request) {
  try {
    console.log("PUT /api/residents received.");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    console.log("Resident ID from params:", id);

    const body = await request.json();
    console.log("Request body:", body);

    const { name, apellido, cedula, noRegistro, phone, address, whatsappConsent } = body;

    if (!id) {
      console.error("Error: ID is required for PUT request.");
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    console.log("Attempting to update resident with ID:", id);
    const resident = await prisma.resident.update({
      where: { id: parseInt(id) },
      data: {
        name,
        apellido,
        cedula,
        noRegistro,
        phone,
        address,
        whatsappConsent,
      },
    });

    console.log("Resident updated successfully:", resident);
    return NextResponse.json(resident);
  } catch (error) {
    console.error("Error in PUT /api/residents:", error);
    return NextResponse.json(
      { error: "Error al actualizar el residente" },
      { status: 500 }
    );
  }
}

// DELETE resident
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.resident.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Resident deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting resident' }, { status: 500 });
  }
}