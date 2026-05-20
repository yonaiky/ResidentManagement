import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings';
import { requireTenantAuth } from '@/lib/tenant/auth';

export async function GET() {
  const auth = await requireTenantAuth('tenant_admin');
  if (auth instanceof NextResponse) return auth;

  try {
    const fiscalConfig = await settingsService.getFiscalConfig(auth.ctx.tenantId);
    return NextResponse.json(fiscalConfig);
  } catch (error) {
    console.error('Get fiscal config error:', error);
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
    const fiscalConfig = await settingsService.updateFiscalConfig(
      auth.ctx.tenantId,
      data
    );
    
    return NextResponse.json(fiscalConfig);
  } catch (error) {
    console.error('Update fiscal config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
