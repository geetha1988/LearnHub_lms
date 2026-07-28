"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "@/app/actions/profile"

export function ProfileEditForm({
  defaultFullName,
  defaultBio,
  email,
}: {
  defaultFullName: string
  defaultBio: string
  email: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    setIsSaving(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">Your email address cannot be changed here.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={defaultFullName} placeholder="Jane Doe" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={defaultBio}
          placeholder="Tell others a little about yourself..."
          rows={5}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated successfully.</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
