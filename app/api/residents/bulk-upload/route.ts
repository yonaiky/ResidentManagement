import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Recibir los datos procesados directamente del frontend
    const residentsToCreate = await req.json();

    if (!Array.isArray(residentsToCreate) || residentsToCreate.length === 0) {
      return NextResponse.json({ error: "Datos inválidos o vacíos" }, { status: 400 });
    }

    let inserted = 0;
    let errors = 0;

    for (const residentData of residentsToCreate) {
      try {
        await prisma.resident.create({
          data: {
            name: String(residentData.name),
            apellido: String(residentData.apellido),
            cedula: String(residentData.cedula),
            noRegistro: String(residentData.noRegistro),
            phone: String(residentData.phone),
            address: String(residentData.address),
            paymentStatus: "pending",
            nextPaymentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 30),
          },
        });
        inserted++;
      } catch (e) {
        console.error("Error creating resident for row:", residentData, e);
        errors++;
        // Si hay duplicados u otros errores, los registra como error y continúa
        continue;
      }
    }

    return NextResponse.json({ inserted, errors });
  } catch (error) {
    console.error("Error al procesar la carga masiva:", error);
    return NextResponse.json({ error: "Error al procesar la carga masiva" }, { status: 500 });
  }
}

// Mantener otras funciones GET, PUT, DELETE si existen 