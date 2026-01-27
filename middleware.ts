import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // 1. First handle admin routes
    if (pathname.startsWith('/admin-panel') && !pathname.startsWith('/admin-login')) {
      const adminSession = request.cookies.get('admin_session');
      if (!adminSession) {
        return NextResponse.redirect(new URL('/admin-login', request.url));
      }
      return NextResponse.next();
    }

    // 2. Update session and get user info
    const { response, user } = await updateSession(request);
    
    // 3. Handle protected routes (routes that require authentication)
    const protectedRoutes = ['/dashboard', '/profile/edit', '/drafts', '/notifications', '/following'];
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );

    if (isProtectedRoute && !user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 4. Redirect authenticated users away from auth pages
    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 5. Return the response with updated session
    return response;
  } catch (error) {
    // If middleware fails, log error and allow request to continue
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};