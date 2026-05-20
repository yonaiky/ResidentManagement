import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const config = await prisma.fiscalConfig.findFirst({
      where: mergeTenantWhere({}, auth.ctx),
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching fiscal config:", error);
    return NextResponse.json(
      {
        error: "Error fetching fiscal config",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

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
      footerNotes,
    } = body;

    if (
      !businessName ||
      !ruc ||
      !address ||
      !phone ||
      !email ||
      !resolutionNumber ||
      !resolutionDate ||
      !validUntil ||
      !ncfSeries ||
      !currentSequence ||
      !maxSequence ||
      !itbisRate ||
      !latePaymentInterest ||
      !paymentTerms
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingConfig = await prisma.fiscalConfig.findFirst({
      where: mergeTenantWhere({}, auth.ctx),
    });
    if (existingConfig) {
      return NextResponse.json(
        { error: "Fiscal configuration already exists. Use PUT to update." },
        { status: 400 }
      );
    }

    const config = await prisma.fiscalConfig.create({
      data: {
        tenantId: auth.ctx.tenantId,
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
    console.error("Error creating fiscal config:", error);
    return NextResponse.json(
      {
        error: "Error creating fiscal config",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

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
      footerNotes,
    } = body;

    if (
      !id ||
      !businessName ||
      !ruc ||
      !address ||
      !phone ||
      !email ||
      !resolutionNumber ||
      !resolutionDate ||
      !validUntil ||
      !ncfSeries ||
      !currentSequence ||
      !maxSequence ||
      !itbisRate ||
      !latePaymentInterest ||
      !paymentTerms
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.fiscalConfig.findFirst({
      where: { id, tenantId: auth.ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    console.error("Error updating fiscal config:", error);
    return NextResponse.json(
      {
        error: "Error updating fiscal config",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
