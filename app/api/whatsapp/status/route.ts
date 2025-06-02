import { NextResponse } from 'next/server';
import { getWhatsappStatus, getQrCodeData, initializeWhatsappClient } from '@/src/whatsapp/whatsappClient';

// Asegurarse de que el cliente de WhatsApp se inicialice al cargar este endpoint
initializeWhatsappClient();

export async function GET() {
    const status = getWhatsappStatus();
    const qr = getQrCodeData();

    if (status === 'scanning' && qr) {
        // Si está escaneando y tenemos el QR, lo incluimos en la respuesta
        return NextResponse.json({ status, qrCodeData: qr });
    } else {
        // Para otros estados (connected, disconnected, initializing) no enviamos el QR
        return NextResponse.json({ status });
    }
} 