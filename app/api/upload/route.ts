import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Client-side upload flow: the browser uploads directly to Blob, bypassing the
// serverless request body size limit (important for large video files).
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Only authenticated instructors/admins may upload course media.
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("You must be signed in to upload files.")
        }

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

        if (profile?.role !== "instructor" && profile?.role !== "admin") {
          throw new Error("Only instructors can upload course materials.")
        }

        return {
          allowedContentTypes: [
            "video/*",
            "audio/*",
            "application/pdf",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "image/*",
            "application/zip",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 1024 * 1024 * 1024, // 1 GB
        }
      },
      onUploadCompleted: async () => {
        // No-op: the client persists the returned URL when the lesson is saved.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
