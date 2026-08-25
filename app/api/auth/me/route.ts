import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!profile || !profile.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    }

    const activeMemberships = await prisma.tenantMembership.count({
      where: { profileId: profile.id, status: 'active' },
    });

    return NextResponse.json({
      user: profile,
      hasActiveMembership: activeMemberships > 0,
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
