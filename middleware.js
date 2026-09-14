import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check if the user is requesting a protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check for the authentication token cookie
    const token = request.cookies.get('token')?.value;

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
  matcher: ['/dashboard/:path*'],
};
