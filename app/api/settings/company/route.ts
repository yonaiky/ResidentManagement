import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings';
import { getAuthUser, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTenantAuth } from '@/lib/tenant/auth';
import { mergeTenantWhere } from '@/lib/tenant/scope';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantAuth = await requireTenantAuth('tenant_admin');
    if (tenantAuth instanceof NextResponse) return tenantAuth;

    const companyInfo = await prisma.companyInfo.findFirst({
      where: mergeTenantWhere({}, tenantAuth.ctx),
    });
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
    const authUser = await getAuthUser();
    
    if (!authUser || !hasPermission(authUser.role, 'admin')) {
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
    const tenantAuth = await requireTenantAuth('tenant_admin');
    if (tenantAuth instanceof NextResponse) return tenantAuth;

    const existing = await prisma.companyInfo.findFirst({
      where: mergeTenantWhere({}, tenantAuth.ctx),
    });

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
          tenantId: tenantAuth.ctx.tenantId,
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