import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email_confirmed_at) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            tenantMemberships: { where: { status: 'active' } },
          },
        },
      },
    });

    if (!profile || !profile.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    }

    const { _count, ...userData } = profile;

    return NextResponse.json({
      user: userData,
      hasActiveMembership: _count.tenantMemberships > 0,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
