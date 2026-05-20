import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tickets/auth";

export async function GET() {
  const auth = await requireAuth("manager");
  if (auth instanceof NextResponse) return auth;

  try {
    const rules = await prisma.maintenanceSlaRule.findMany({
      orderBy: [{ category: "asc" }, { priority: "asc" }],
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("GET /api/tickets/sla-rules error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
