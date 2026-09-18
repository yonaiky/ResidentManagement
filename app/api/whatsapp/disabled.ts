import { NextResponse } from "next/server";

export function whatsappDisabledResponse(): NextResponse {
  return NextResponse.json(
    { error: "La integración de WhatsApp está deshabilitada" },
    { status: 503 }
  );
}
