import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings';
import { requireTenantAuth } from '@/lib/tenant/auth';

export async function GET() {
  const auth = await requireTenantAuth('tenant_admin');
  if (auth instanceof NextResponse) return auth;

  try {
    const invoiceConfig = await settingsService.getInvoiceConfig(auth.ctx.tenantId);
    return NextResponse.json(invoiceConfig);
  } catch (error) {
    console.error('Get invoice config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireTenantAuth('tenant_admin');
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await request.json();
    const invoiceConfig = await settingsService.updateInvoiceConfig(
      auth.ctx.tenantId,
      data
    );
    
    return NextResponse.json(invoiceConfig);
  } catch (error) {
    console.error('Update invoice config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
