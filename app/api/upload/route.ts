import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Server-side upload: the browser POSTs the file here and we upload it to Blob
// with put(). This avoids the client-token handshake, which does not complete
// in the sandboxed preview environment.
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Only authenticated instructors/admins may upload course media.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to upload files." }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

    if (profile?.role !== "instructor" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Only instructors can upload course materials." }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.log("[v0] /api/upload error:", (error as Error).message)
    return NextResponse.json({ error: (error as Error).message || "Upload failed." }, { status: 500 })
  }
}
