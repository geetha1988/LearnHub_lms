import Link from "next/link"
import { adminExists } from "@/app/actions/admin"
import { SetupSeed } from "@/components/setup-seed"
import { GraduationCap } from "lucide-react"

export const dynamic = "force-dynamic"

const CREDENTIALS = [
  { role: "Admin", email: "admin@learnhub.test", password: "Admin123!" },
  { role: "Instructor", email: "sarah.instructor@learnhub.test", password: "Instructor123!" },
  { role: "Instructor", email: "james.instructor@learnhub.test", password: "Instructor123!" },
  { role: "Student", email: "alex.student@learnhub.test", password: "Student123!" },
  { role: "Student", email: "maria.student@learnhub.test", password: "Student123!" },
  { role: "Student", email: "john.student@learnhub.test", password: "Student123!" },
]

export default async function SetupPage() {
  const seeded = await adminExists()

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">LearnHub Setup</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Create sample data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This creates demo accounts (admin, instructors, students) plus sample courses, lessons, enrollments,
            reviews, and payments. Accounts are created through the Supabase Admin API so they can actually log in.
            Running it again is safe.
          </p>

          <div className="mt-5">
            <SetupSeed alreadySeeded={seeded} />
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900">Demo credentials</h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CREDENTIALS.map((c) => (
                    <tr key={c.email}>
                      <td className="px-4 py-2 text-gray-700">{c.role}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-900">{c.email}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-900">{c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/" className="text-indigo-600 hover:text-indigo-700">
              Back to home
            </Link>
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
