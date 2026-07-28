import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Handles the Supabase email-confirmation / OAuth redirect by exchanging
// the ?code= for a session, then forwarding the user to their destination.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
