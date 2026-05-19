import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Resolve login identifier (email or username) to email for Supabase signIn */
export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      return NextResponse.json({ email: trimmed.toLowerCase() });
    }

    const profile = await prisma.profile.findUnique({
      where: { username: trimmed },
      select: { email: true, isActive: true },
    });

    if (!profile || !profile.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ email: profile.email });
  } catch (error) {
    console.error('Resolve email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
