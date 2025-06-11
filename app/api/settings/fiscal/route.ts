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

    const fiscalConfig = await settingsService.getFiscalConfig();
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
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const fiscalConfig = await settingsService.updateFiscalConfig(data);
    
    return NextResponse.json(fiscalConfig);
  } catch (error) {
    console.error('Update fiscal config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 