/**
 * Usuario técnico de demostración + ticket de ejemplo asignado.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-technician.ts
 *
 * Opcional:
 *   TECH_EMAIL=tecnico@demo.com TECH_PASSWORD=Demo123! TECH_USERNAME=tecnico_demo npx tsx scripts/seed-demo-technician.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* .env optional */
  }
}

loadEnvFile();

const email = process.env.TECH_EMAIL ?? "tecnico.demo@residencial.test";
const password = process.env.TECH_PASSWORD ?? "DemoTecnico2026!";
const username = process.env.TECH_USERNAME ?? "tecnico_demo";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function main() {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const prisma = new PrismaClient();

  const existingProfile = await prisma.profile.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  let userId: string;

  if (existingProfile) {
    userId = existingProfile.id;
    await prisma.profile.update({
      where: { id: userId },
      data: { role: "technician", isActive: true, username, email },
    });
    console.log("Perfil técnico actualizado:", { id: userId, email, username });
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (error || !data.user) {
      console.error("Failed to create auth user:", error?.message);
      process.exit(1);
    }

    userId = data.user.id;

    await prisma.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username,
        email,
        role: "technician",
        isActive: true,
      },
      update: {
        username,
        email,
        role: "technician",
        isActive: true,
      },
    });

    console.log("Técnico demo creado:", { id: userId, email, username });
  }

  const staff = await prisma.profile.findFirst({
    where: { role: { in: ["admin", "manager", "user"] } },
  });

  let ticket = await prisma.maintenanceTicket.findFirst({
    where: { assignedToId: userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!ticket && staff) {
    const year = new Date().getFullYear();
    const ticketNumber = `TKT-${year}-DEMO1`;

    const existingNumber = await prisma.maintenanceTicket.findUnique({
      where: { ticketNumber },
    });

    const slaDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    ticket = await prisma.maintenanceTicket.create({
      data: {
        ticketNumber: existingNumber
          ? `TKT-${year}-DEMO-${Date.now().toString().slice(-4)}`
          : ticketNumber,
        title: "Fuga de agua en apto 3B (demo)",
        description:
          "Ticket de demostración para el técnico. Revisar conexión bajo lavamanos y válvula de paso.",
        category: "plumbing",
        priority: "high",
        status: "assigned",
        location: "Torre A — Apto 3B",
        assignedToId: userId,
        createdById: staff.id,
        slaDueAt,
        slaBreached: false,
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: "open",
              changedById: staff.id,
              note: "Ticket demo creado",
            },
            {
              fromStatus: "open",
              toStatus: "assigned",
              changedById: staff.id,
              note: "Asignado al técnico demo",
            },
          ],
        },
      },
    });

    console.log("Ticket demo asignado:", {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
    });
  } else if (ticket) {
    console.log("Ya tiene ticket asignado:", ticket.ticketNumber);
  }

  console.log("\n--- Credenciales demo técnico ---");
  console.log("Email:    ", email);
  console.log("Password: ", password);
  console.log("Usuario:  ", username);
  console.log("Login:    ", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", "/login");
  console.log("-----------------------------\n");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
