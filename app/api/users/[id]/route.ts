import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hasPermission } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    const userId = params.id;

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canUpdate =
      authUser.userId === userId || hasPermission(authUser.role, 'manager');

    if (!canUpdate) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, email, role, isActive, password } = await request.json();

    const updateData: {
      username?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    } = {};

    if (username) updateData.username = username;

    if (hasPermission(authUser.role, 'admin')) {
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (email) updateData.email = email;
    } else if (authUser.userId === userId) {
      if (email) updateData.email = email;
    }

    const supabaseAdmin = createAdminClient();

    if (email && hasPermission(authUser.role, 'admin')) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { email });
    }

    if (password && password.length >= 6 && hasPermission(authUser.role, 'admin')) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    }

    const profile = await prisma.profile.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    const userId = params.id;

    if (!authUser || !hasPermission(authUser.role, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.userId === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    await prisma.profile.delete({ where: { id: userId } }).catch(() => {
      // Profile may already be removed by cascade
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
