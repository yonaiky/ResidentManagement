import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { prisma } from '@/lib/prisma';

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
const onboardingRoutes = ['/onboarding'];
const platformRoutes = ['/platform'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('_rsc') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/auth/callback')
  ) {
    const { response } = await updateSession(request);
    return response;
  }

  const { response, user } = await updateSession(request);
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    if (user?.email_confirmed_at) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (!user.email_confirmed_at) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('unconfirmed', '1');
    return NextResponse.redirect(url);
  }

  const isOnboardingRoute = onboardingRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const isPlatformRoute = platformRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  if (user.email) {
    const profile = await prisma.profile.findFirst({
      where: { email: user.email },
      select: { id: true, role: true },
    });

    if (profile) {
      if (isPlatformRoute && profile.role !== 'platform_admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (profile.role !== 'platform_admin' && !isOnboardingRoute && !isPlatformRoute) {
        const memberships = await prisma.tenantMembership.count({
          where: { profileId: profile.id, status: 'active' },
        });
        if (memberships === 0) {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
      }

      if (isOnboardingRoute && profile.role !== 'platform_admin') {
        const memberships = await prisma.tenantMembership.count({
          where: { profileId: profile.id, status: 'active' },
        });
        if (memberships > 0) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
