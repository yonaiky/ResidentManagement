import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await prisma.token.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        resident: true,
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Token not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching token" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, status, paymentStatus } = body;

    const token = await prisma.token.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        status,
        paymentStatus,
      },
    });

    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating token" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.token.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Token deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting token" },
      { status: 500 }
    );
  }
}