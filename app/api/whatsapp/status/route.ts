import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService, DEFAULT_WHATSAPP_CONFIG } from '@/lib/whatsapp';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'manager')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const whatsappService = new WhatsAppService(DEFAULT_WHATSAPP_CONFIG);
    const status = await whatsappService.getInstanceStatus();

    return NextResponse.json({
      instance: DEFAULT_WHATSAPP_CONFIG.instanceName,
      ...status,
      apiUrl: DEFAULT_WHATSAPP_CONFIG.apiUrl
    });

  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const whatsappService = new WhatsAppService(DEFAULT_WHATSAPP_CONFIG);
    const result = await whatsappService.createInstance();

    return NextResponse.json({
      message: 'Instance creation initiated',
      instance: DEFAULT_WHATSAPP_CONFIG.instanceName,
      ...result
    });

  } catch (error) {
    console.error('WhatsApp instance creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}