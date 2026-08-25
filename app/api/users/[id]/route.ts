import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTenantAuth } from "@/lib/tenant/auth";
import {
  isValidTenantRole,
  membershipRoleToProfileRole,
  profileRoleToMembershipRole,
} from "@/lib/tenant/roles";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireTenantAuth("manager");
    if (auth instanceof NextResponse) return auth;

    const userId = params.id;
    const isSelf = auth.userId === userId;
    const canAdmin =
      auth.ctx.isPlatformAdmin || auth.ctx.membershipRole === "tenant_admin";

    if (!isSelf && !canAdmin && auth.ctx.membershipRole !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_profileId: {
          tenantId: auth.ctx.tenantId,
          profileId: userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { username, email, role, isActive, password } = body;

    const profileUpdate: {
      username?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    } = {};

    if (username) profileUpdate.username = username;

    let nextMembershipRole: string | undefined;
    let nextMembershipStatus: string | undefined;

    if (canAdmin && !isSelf) {
      if (role) {
        nextMembershipRole = isValidTenantRole(role)
          ? role
          : profileRoleToMembershipRole(role);
        profileUpdate.role = membershipRoleToProfileRole(nextMembershipRole);
      }
      if (typeof isActive === "boolean") {
        nextMembershipStatus = isActive ? "active" : "inactive";
        profileUpdate.isActive = isActive;
      }
      if (email) profileUpdate.email = email;
    } else if (isSelf) {
      if (email) profileUpdate.email = email;
    }

    const supabaseAdmin = createAdminClient();

    if (email && canAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { email });
    }

    if (password && password.length >= 6 && canAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    }

    const [profile] = await prisma.$transaction([
      prisma.profile.update({
        where: { id: userId },
        data: profileUpdate,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.tenantMembership.update({
        where: { id: membership.id },
        data: {
          ...(nextMembershipRole ? { role: nextMembershipRole } : {}),
          ...(nextMembershipStatus ? { status: nextMembershipStatus } : {}),
        },
      }),
    ]);

    const updatedMembership = await prisma.tenantMembership.findUniqueOrThrow({
      where: { id: membership.id },
    });

    return NextResponse.json({
      id: profile.id,
      username: profile.username,
      email: profile.email,
      role: updatedMembership.role,
      isActive:
        updatedMembership.status === "active" && profile.isActive,
      createdAt: profile.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireTenantAuth("tenant_admin");
    if (auth instanceof NextResponse) return auth;

    const userId = params.id;

    if (auth.userId === userId) {
      return NextResponse.json(
        { error: "Cannot remove your own account from the organization" },
        { status: 400 }
      );
    }

    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_profileId: {
          tenantId: auth.ctx.tenantId,
          profileId: userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    await prisma.tenantMembership.delete({ where: { id: membership.id } });

    const remaining = await prisma.tenantMembership.count({
      where: { profileId: userId },
    });

    if (remaining === 0) {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      await prisma.profile.delete({ where: { id: userId } }).catch(() => {});
    }

    return NextResponse.json({ message: "User removed from organization" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
