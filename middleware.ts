import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes, redirect to login
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup")

  if (!session && !isAuthRoute) {
    // If accessing a protected route without session, redirect to login
    if (
      req.nextUrl.pathname.startsWith("/channels") ||
      req.nextUrl.pathname.startsWith("/groups") ||
      req.nextUrl.pathname.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  return res
}

// Run middleware on specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/channels/:path*", "/groups/:path*", "/login", "/signup"],
}

