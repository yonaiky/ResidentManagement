import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') || 
    pathname.includes('_rsc') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  
  // Check if the current path is a public route
  if (publicRoutes.includes(pathname)) {
    // If user is already authenticated and trying to access login/register, redirect to dashboard
    const isAuthenticated = request.cookies.has('auth-status');
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // For all other routes, check authentication
  const isAuthenticated = request.cookies.has('auth-status');
  
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};