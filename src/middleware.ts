import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Handle authentication
  if (!session) {
    // Redirect to login if accessing protected routes
    if (req.nextUrl.pathname.startsWith('/admin') || 
        req.nextUrl.pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }

  // Handle role-based access
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.user_metadata?.role === 'admin';

  // Admin routes protection
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Client routes protection
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/login',
  ],
}; 