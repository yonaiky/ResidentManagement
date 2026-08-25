import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getCookieTenantId } from "@/lib/tenant/context";
import { membershipRoleToProfileRole } from "@/lib/tenant/roles";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email_confirmed_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            tenantMemberships: { where: { status: "active" } },
          },
        },
      },
    });

    if (!profile || !profile.isActive) {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 404 }
      );
    }

    const { _count, ...userData } = profile;
    let membershipRole: string | null = null;

    if (profile.role === "platform_admin") {
      membershipRole = "tenant_admin";
    } else {
      const cookieTenant = await getCookieTenantId();
      const membership = cookieTenant
        ? await prisma.tenantMembership.findUnique({
            where: {
              tenantId_profileId: {
                tenantId: cookieTenant,
                profileId: profile.id,
              },
            },
          })
        : await prisma.tenantMembership.findFirst({
            where: { profileId: profile.id, status: "active" },
            orderBy: { createdAt: "asc" },
          });

      if (membership && membership.status === "active") {
        membershipRole = membership.role;
      }
    }

    const effectiveRole =
      membershipRole != null
        ? membershipRoleToProfileRole(membershipRole)
        : userData.role;

    return NextResponse.json({
      user: {
        ...userData,
        role: effectiveRole,
      },
      hasActiveMembership: _count.tenantMemberships > 0,
      membershipRole,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
