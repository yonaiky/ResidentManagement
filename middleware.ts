import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // APIs authenticate themselves; skip Supabase getUser here (saves a round-trip per request).
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next/') ||
    pathname.includes('_rsc') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/auth/callback')
  ) {
    return NextResponse.next();
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
