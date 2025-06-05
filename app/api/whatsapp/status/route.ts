import { NextResponse } from "next/server";
import { whatsappService } from "@/lib/whatsapp";

// Estas variables son compartidas con el endpoint de init
declare global {
  var client: any;
  var qrCode: string | null;
  var isInitializing: boolean;
  var isReady: boolean;
}

export async function GET() {
  return NextResponse.json({
    qrCode: global.qrCode,
    isInitializing: global.isInitializing,
    isReady: global.isReady
  });
} 