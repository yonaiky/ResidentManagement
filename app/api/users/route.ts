import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTenantAuth } from "@/lib/tenant/auth";
import {
  isValidTenantRole,
  membershipRoleToProfileRole,
  profileRoleToMembershipRole,
} from "@/lib/tenant/roles";

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
  try {
    const auth = await requireTenantAuth("tenant_admin");
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const username = body.username?.trim();
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password;
    const rawRole = body.role ?? "user";
    const membershipRole = isValidTenantRole(rawRole)
      ? rawRole
      : profileRoleToMembershipRole(rawRole);

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
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
          { error: "User already exists in this organization" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error:
            "Este email o usuario ya existe. Por ahora crea cuentas nuevas para esta organización.",
        },
        { status: 409 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
