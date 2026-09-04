import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";
import { assertWithinLimit } from "@/lib/tenant/limits";

// GET all tokens
export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const tokens = await prisma.token.findMany({
      where: mergeTenantWhere({}, auth.ctx),
      include: {
        resident: true,
      },
    });
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST new token
export async function POST(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, residentId } = body;

    if (!name || !residentId) {
      return NextResponse.json(
        { error: 'Name and residentId are required' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.ctx.tenantId },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const limitCheck = await assertWithinLimit(tenant, "tokens_monthly");
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const resident = await prisma.resident.findFirst({
      where: { id: parseInt(residentId), tenantId: auth.ctx.tenantId },
    });
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    const token = await prisma.token.create({
      data: {
        tenantId: auth.ctx.tenantId,
        name,
        residentId: parseInt(residentId),
      },
      include: {
        resident: true,
      },
    });

    return NextResponse.json(token, { status: 201 });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { 
        error: 'Error creating token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// PUT update token
export async function PUT(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, name, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.token.findFirst({
      where: { id: parseInt(id), tenantId: auth.ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const token = await prisma.token.update({
      where: { id: parseInt(id) },
      data: {
        name,
        status,
      },
      include: {
        resident: true,
      },
    });

    return NextResponse.json(token);
  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json(
      { 
        error: 'Error updating token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE token
export async function DELETE(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.token.findFirst({
      where: { id: parseInt(id), tenantId: auth.ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    await prisma.token.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      { 
        error: 'Error deleting token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 