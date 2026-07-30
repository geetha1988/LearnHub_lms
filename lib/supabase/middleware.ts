import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

  // If Supabase env vars aren't available yet, skip auth handling so public
  // pages still render instead of crashing the entire site in middleware.
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // getUser() throws (not just returns null) when the cookie holds a JWT for a
  // session that no longer exists (e.g. after a data reset). Treat any failure
  // as "no user" and clear the stale auth cookies so it stops recurring.
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) {
        supabaseResponse.cookies.set(cookie.name, "", { maxAge: 0, path: "/" })
      }
    }
  }

  const pathname = request.nextUrl.pathname

  // Publicly accessible routes (no login required). Everything else requires auth.
  const publicPrefixes = [
    "/auth",
    "/_next",
    "/api",
    "/setup", // must be reachable logged-out to bootstrap the first admin/seed
    "/courses",
    "/categories",
    "/instructors",
    "/about",
    "/contact",
    "/help",
    "/faq",
    "/privacy",
    "/terms",
    "/cookies",
  ]

  const isPublic = pathname === "/" || publicPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  // Redirect to login if not authenticated and trying to access a protected route
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
