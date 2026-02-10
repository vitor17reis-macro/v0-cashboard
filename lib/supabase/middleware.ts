import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest) {
  // Create response
  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL! || process.env.SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || process.env.SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing in middleware - skipping auth check")
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })

    // Refresh session if expired
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAuthPage = request.nextUrl.pathname.startsWith("/auth")

    if (!user && !isAuthPage && request.nextUrl.pathname === "/") {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    if (user && isAuthPage) {
      // Redirect to dashboard if already authenticated
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error("Middleware Supabase error:", error)
    // If supabase fails, we allow the request to continue
    // This prevents the entire site from crashing if auth is misconfigured
  }

  return response
}
