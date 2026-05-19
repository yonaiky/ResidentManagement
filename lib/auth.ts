import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  role: string;
}

const roleHierarchy = {
  admin: 3,
  manager: 2,
  user: 1,
} as const;

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  return userLevel >= requiredLevel;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  if (!user.email_confirmed_at) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile || !profile.isActive) {
    return null;
  }

  return {
    userId: profile.id,
    username: profile.username,
    email: profile.email,
    role: profile.role,
  };
}
