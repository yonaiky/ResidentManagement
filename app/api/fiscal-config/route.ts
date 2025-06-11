import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET fiscal configuration
export async function GET() {
  try {
    const config = await prisma.fiscalConfig.findFirst();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching fiscal config:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching fiscal config',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST create fiscal configuration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      businessName, 
      ruc, 
      address, 
      phone, 
      email, 
      website, 
      logoPath,
      resolutionNumber,
      resolutionDate,
      validUntil,
      ncfSeries,
      currentSequence,
      maxSequence,
      itbisRate,
      latePaymentInterest,
      paymentTerms,
      footerNotes
    } = body;

    // Validar campos requeridos
    if (!businessName || !ruc || !address || !phone || !email || 
        !resolutionNumber || !resolutionDate || !validUntil || 
        !ncfSeries || !currentSequence || !maxSequence || 
        !itbisRate || !latePaymentInterest || !paymentTerms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una configuración
    const existingConfig = await prisma.fiscalConfig.findFirst();
    if (existingConfig) {
      return NextResponse.json(
        { error: 'Fiscal configuration already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    const config = await prisma.fiscalConfig.create({
      data: {
        businessName,
        ruc,
        address,
        phone,
        email,
        website,
        logoPath,
        resolutionNumber,
        resolutionDate,
        validUntil,
        ncfSeries,
        currentSequence,
        maxSequence,
        itbisRate,
        latePaymentInterest,
        paymentTerms,
        footerNotes,
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Error creating fiscal config:', error);
    return NextResponse.json(
      { 
        error: 'Error creating fiscal config',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// PUT update fiscal configuration
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      businessName, 
      ruc, 
      address, 
      phone, 
      email, 
      website, 
      logoPath,
      resolutionNumber,
      resolutionDate,
      validUntil,
      ncfSeries,
      currentSequence,
      maxSequence,
      itbisRate,
      latePaymentInterest,
      paymentTerms,
      footerNotes
    } = body;

    // Validar campos requeridos
    if (!id || !businessName || !ruc || !address || !phone || !email || 
        !resolutionNumber || !resolutionDate || !validUntil || 
        !ncfSeries || !currentSequence || !maxSequence || 
        !itbisRate || !latePaymentInterest || !paymentTerms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const config = await prisma.fiscalConfig.update({
      where: { id },
      data: {
        businessName,
        ruc,
        address,
        phone,
        email,
        website,
        logoPath,
        resolutionNumber,
        resolutionDate,
        validUntil,
        ncfSeries,
        currentSequence,
        maxSequence,
        itbisRate,
        latePaymentInterest,
        paymentTerms,
        footerNotes,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating fiscal config:', error);
    return NextResponse.json(
      { 
        error: 'Error updating fiscal config',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 