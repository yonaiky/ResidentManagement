import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const companyInfo = await prisma.companyInfo.findFirst();
    return NextResponse.json(companyInfo);
  } catch (error) {
    console.error('Get company info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validar que los campos requeridos estén presentes
    if (!data.name || !data.rnc || !data.address || !data.phone || !data.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Buscar si ya existe una configuración
    const existing = await prisma.companyInfo.findFirst();

    let companyInfo;
    if (existing) {
      // Actualizar la configuración existente
      companyInfo = await prisma.companyInfo.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          rnc: data.rnc,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website || null
        }
      });
    } else {
      // Crear nueva configuración
      companyInfo = await prisma.companyInfo.create({
        data: {
          name: data.name,
          rnc: data.rnc,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website || null
        }
      });
    }
    
    return NextResponse.json(companyInfo);
  } catch (error) {
    console.error('Update company info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 