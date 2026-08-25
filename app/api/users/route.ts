import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTenantAuth } from "@/lib/tenant/auth";
import {
  isValidTenantRole,
  membershipRoleToProfileRole,
  profileRoleToMembershipRole,
} from "@/lib/tenant/roles";
import { assertWithinLimit } from "@/lib/tenant/limits";

function isPrismaUniqueError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function GET() {
  try {
    const auth = await requireTenantAuth("manager");
    if (auth instanceof NextResponse) return auth;

    const memberships = await prisma.tenantMembership.findMany({
      where: { tenantId: auth.ctx.tenantId },
      include: {
        profile: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const users = memberships.map((m) => ({
      id: m.profile.id,
      username: m.profile.username,
      email: m.profile.email,
      role: m.role,
      isActive: m.status === "active" && m.profile.isActive,
      createdAt: m.createdAt.toISOString(),
      membershipId: m.id,
      membershipStatus: m.status,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let createdAuthUserId: string | null = null;

  try {
    const auth = await requireTenantAuth("tenant_admin");
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const username = String(body.username ?? "")
      .trim()
      .replace(/\s+/g, "_");
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const rawRole = body.role ?? "user";
    const membershipRole = isValidTenantRole(rawRole)
      ? rawRole
      : profileRoleToMembershipRole(rawRole);

    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: "El usuario debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email válido es requerido" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.ctx.tenantId },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
    }

    const limit = await assertWithinLimit(tenant, "users");
    if (!limit.ok) {
      return NextResponse.json({ error: limit.message }, { status: 403 });
    }

    const existing = await prisma.profile.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existing) {
      const alreadyInTenant = await prisma.tenantMembership.findUnique({
        where: {
          tenantId_profileId: {
            tenantId: auth.ctx.tenantId,
            profileId: existing.id,
          },
        },
      });
      if (alreadyInTenant) {
        return NextResponse.json(
          { error: "Este usuario ya pertenece a esta organización" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error:
            "Este email o nombre de usuario ya está registrado. Usa otros datos.",
        },
        { status: 409 }
      );
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminClient();
    } catch (envError) {
      console.error("Supabase admin client error:", envError);
      return NextResponse.json(
        {
          error:
            "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Configúrala en Dokploy.",
        },
        { status: 503 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "No se pudo crear el usuario en Auth" },
        { status: 400 }
      );
    }

    createdAuthUserId = authData.user.id;
    const profileRole = membershipRoleToProfileRole(membershipRole);

    const profile = await prisma.$transaction(async (tx) => {
      const p = await tx.profile.upsert({
        where: { id: authData.user.id },
        create: {
          id: authData.user.id,
          username,
          email,
          role: profileRole,
          isActive: true,
        },
        update: {
          username,
          email,
          role: profileRole,
          isActive: true,
        },
      });

      await tx.tenantMembership.create({
        data: {
          tenantId: auth.ctx.tenantId,
          profileId: p.id,
          role: membershipRole,
          status: "active",
        },
      });

      return p;
    });

    return NextResponse.json(
      {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: membershipRole,
        isActive: true,
        createdAt: profile.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);

    if (createdAuthUserId) {
      try {
        const admin = createAdminClient();
        await admin.auth.admin.deleteUser(createdAuthUserId);
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }
    }

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        { error: "Usuario o email ya existe" },
        { status: 409 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      message.includes("Missing NEXT_PUBLIC")
    ) {
      return NextResponse.json(
        {
          error:
            "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Configúrala en Dokploy.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
