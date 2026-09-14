import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // If user is logged in and on the login/register page, redirect to dashboard
  if ((pathname === '/' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check if the user is requesting a protected route
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      // If no token exists, redirect to the login page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Specify the paths that the middleware should run on
export const config = {
  matcher: ['/', '/register', '/dashboard/:path*'],
};
