import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const invoiceConfig = await settingsService.getInvoiceConfig();
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
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const invoiceConfig = await settingsService.updateInvoiceConfig(data);
    
    return NextResponse.json(invoiceConfig);
  } catch (error) {
    console.error('Update invoice config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 