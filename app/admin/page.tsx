import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminResetButton } from "@/components/admin-reset-button"
import { signOut } from "@/app/actions/auth"
import { Users, BookOpen, GraduationCap, DollarSign, ArrowLeft, LogOut } from "lucide-react"

export const dynamic = "force-dynamic"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100)
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Use service-role client for platform-wide stats (bypasses RLS).
  let stats = { users: 0, courses: 0, enrollments: 0, revenue: 0 }
  let recentUsers: { id: string; email: string; full_name: string | null; role: string; created_at: string }[] = []
  let recentCourses: { id: string; title: string; is_published: boolean; price_in_cents: number }[] = []
  let credentialsError: string | null = null

  try {
    const admin = createAdminClient()

    const [usersRes, coursesRes, enrollmentsRes, paymentsRes, recentUsersRes, recentCoursesRes] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("courses").select("id", { count: "exact", head: true }),
      admin.from("enrollments").select("id", { count: "exact", head: true }),
      admin.from("payments").select("amount_in_cents").eq("status", "completed"),
      admin.from("profiles").select("id, email, full_name, role, created_at").order("created_at", { ascending: false }).limit(10),
      admin.from("courses").select("id, title, is_published, price_in_cents").order("created_at", { ascending: false }).limit(10),
    ])

    stats = {
      users: usersRes.count ?? 0,
      courses: coursesRes.count ?? 0,
      enrollments: enrollmentsRes.count ?? 0,
      revenue: (paymentsRes.data ?? []).reduce((sum, p) => sum + (p.amount_in_cents ?? 0), 0),
    }
    recentUsers = recentUsersRes.data ?? []
    recentCourses = recentCoursesRes.data ?? []
  } catch (error) {
    credentialsError = error instanceof Error ? error.message : "Failed to load admin data"
  }

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-indigo-600" },
    { label: "Total Courses", value: stats.courses, icon: BookOpen, color: "text-cyan-600" },
    { label: "Enrollments", value: stats.enrollments, icon: GraduationCap, color: "text-amber-600" },
    { label: "Revenue", value: formatCurrency(stats.revenue), icon: DollarSign, color: "text-emerald-600" },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </form>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-muted-foreground">
          Signed in as {profile.full_name || user.email}. Manage platform data and reset demo content.
        </p>
      </div>

      {credentialsError && (
        <Card className="mb-8 border-amber-300 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-800">
            Could not load platform stats: {credentialsError}. Ensure the{" "}
            <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> environment variable is set.
          </CardContent>
        </Card>
      )}

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-10 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="font-medium">Reset sample data</p>
            <p className="text-sm text-muted-foreground">
              Removes all seeded demo accounts (instructors and students) and their courses, enrollments, reviews, and
              payments. Your admin account and any real users are preserved. Use this before deploying to production.
            </p>
          </div>
          <AdminResetButton />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No courses found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentCourses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_published ? "default" : "secondary"}>
                          {c.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.price_in_cents === 0 ? "Free" : formatCurrency(c.price_in_cents)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
