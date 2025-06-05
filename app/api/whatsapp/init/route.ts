import { NextResponse } from "next/server";
import { whatsappService } from "@/lib/whatsapp";
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

let client: Client | null = null;
let qrCode: string | null = null;
let isInitializing = false;
let isReady = false;

export async function GET() {
  try {
    // Verificar si ya está inicializado
    const status = whatsappService.getStatus();
    if (status.isReady) {
      return NextResponse.json({
        message: "WhatsApp ya está conectado",
        status: "Conectado"
      });
    }

    // Inicializar el cliente de WhatsApp
    await whatsappService.initialize();
    
    return NextResponse.json({
      message: "Cliente de WhatsApp inicializado",
      status: "Esperando escaneo del código QR"
    });
  } catch (error) {
    console.error('Error al inicializar WhatsApp:', error);
    return NextResponse.json(
      { 
        error: "Error al inicializar WhatsApp",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  if (client) {
    return NextResponse.json({ 
      status: 'WhatsApp ya está inicializado',
      isInitializing,
      isReady
    });
  }

  try {
    isInitializing = true;
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox'],
      }
    });

    client.on('qr', async (qr) => {
      qrCode = await qrcode.toDataURL(qr);
    });

    client.on('ready', () => {
      isReady = true;
      isInitializing = false;
    });

    client.on('authenticated', () => {
      isInitializing = false;
    });

    client.on('auth_failure', () => {
      isInitializing = false;
      client = null;
    });

    client.initialize();

    return NextResponse.json({ 
      status: 'Inicializando WhatsApp...',
      isInitializing,
      isReady
    });
  } catch (error) {
    console.error('Error al inicializar WhatsApp:', error);
    return NextResponse.json({ 
      error: 'Error al inicializar WhatsApp',
      isInitializing: false,
      isReady: false
    }, { status: 500 });
  }
} 