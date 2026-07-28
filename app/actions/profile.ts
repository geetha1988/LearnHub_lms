"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in to update your profile." }
  }

  const fullName = (formData.get("full_name") as string)?.trim()
  const bio = (formData.get("bio") as string)?.trim()

  if (!fullName) {
    return { error: "Please enter your name." }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      bio: bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/profile")
  return { success: true }
}
