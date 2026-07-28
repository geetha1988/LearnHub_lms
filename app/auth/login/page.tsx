"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const demoAccounts = [
    { label: "Admin", email: "admin@learnhub.test", password: "Admin123!" },
    { label: "Instructor", email: "sarah.instructor@learnhub.test", password: "Instructor123!" },
    { label: "Student", email: "alex.student@learnhub.test", password: "Student123!" },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred"
      // A raw "Failed to fetch" means the browser could not reach Supabase at
      // all (project paused/restoring, offline, or env vars missing) rather
      // than an invalid password.
      if (/failed to fetch|networkerror|load failed/i.test(message)) {
        setError(
          "Can't reach the authentication server. Your Supabase project is likely paused or still restoring. Open the Supabase dashboard, resume the project, then try again.",
        )
      } else if (/invalid login credentials/i.test(message)) {
        setError(
          "Invalid email or password. If the demo accounts don't exist yet, visit /setup and click \"Create sample data\" first.",
        )
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-600">LearnHub</h1>
          <p className="mt-2 text-muted-foreground">Welcome back</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="text-indigo-600 underline underline-offset-4 hover:text-indigo-700"
                >
                  Sign up
                </Link>
              </div>
            </form>

            <div className="mt-6 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 p-3">
              <p className="mb-2 text-xs font-medium text-indigo-700">Demo accounts (click to fill)</p>
              <div className="flex flex-col gap-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email)
                      setPassword(acc.password)
                    }}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-left text-xs shadow-sm transition-colors hover:bg-indigo-100"
                  >
                    <span className="font-medium text-gray-900">{acc.label}</span>
                    <span className="text-muted-foreground">{acc.email}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Accounts not working?{" "}
                <Link href="/setup" className="text-indigo-600 underline underline-offset-2">
                  Create sample data
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
