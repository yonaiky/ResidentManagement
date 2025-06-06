import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission, hashPassword } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userPayload = getUserFromRequest(request);
    const userId = parseInt(params.id);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can update their own profile, managers can update user profiles, admins can update all
    const canUpdate = userPayload.userId === userId || 
                     hasPermission(userPayload.role, 'manager');

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username, email, role, isActive, password } = await request.json();

    // Only admins can change roles and active status
    const updateData: any = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    if (hasPermission(userPayload.role, 'admin')) {
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
    }
    
    if (password && password.length >= 6) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userPayload = getUserFromRequest(request);
    const userId = parseInt(params.id);
    
    if (!userPayload || !hasPermission(userPayload.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Prevent deleting yourself
    if (userPayload.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}