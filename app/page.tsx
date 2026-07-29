import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CourseCard } from "@/components/course-card"
import { BookOpen, Users, Award, TrendingUp, Sparkles, Brain } from "lucide-react"
import Link from "next/link"

export default async function HomePage() {
  let headerUser = null
  let coursesWithCount:
    | (Record<string, any> & { _count: { enrollments: number } })[]
    | undefined

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      headerUser = { id: user.id, email: user.email ?? "", role: profile?.role ?? "student" }
    }

    // Fetch featured courses
    const { data: courses } = await supabase
      .from("courses")
      .select(
        `
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name),
        enrollments:enrollments(count)
      `,
      )
      .eq("is_published", true)
      .limit(6)

    coursesWithCount = courses?.map((course) => ({
      ...course,
      _count: {
        enrollments: course.enrollments?.length || 0,
      },
    }))
  } catch (error) {
    console.log("[v0] HomePage Supabase fetch failed:", error instanceof Error ? error.message : error)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={headerUser} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
                <Sparkles className="h-4 w-4" />
                AI-Powered Learning Platform
              </div>
              <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 text-balance md:text-6xl">
                Learn Anything, Anytime, Anywhere
              </h1>
              <p className="mb-8 text-xl text-gray-600 text-pretty">
                Join thousands of learners mastering new skills with expert instructors and AI-powered personalized
                learning paths.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/courses">Explore Courses</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  <Link href="/auth/sign-up">Start Learning Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-indigo-600">10,000+</div>
                <div className="text-sm text-gray-600">Active Learners</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-indigo-600">500+</div>
                <div className="text-sm text-gray-600">Expert Instructors</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-indigo-600">1,200+</div>
                <div className="text-sm text-gray-600">Quality Courses</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-indigo-600">95%</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Why Choose LearnHub?</h2>
              <p className="text-lg text-gray-600">Everything you need to succeed in your learning journey</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                    <Brain className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">AI-Powered Recommendations</h3>
                  <p className="text-gray-600">
                    Get personalized course suggestions based on your interests and learning goals.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                    <Users className="h-6 w-6 text-cyan-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Expert Instructors</h3>
                  <p className="text-gray-600">
                    Learn from industry professionals with years of real-world experience.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Certificates</h3>
                  <p className="text-gray-600">
                    Earn recognized certificates upon course completion to boost your career.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Track Progress</h3>
                  <p className="text-gray-600">Monitor your learning journey with detailed analytics and insights.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Lifetime Access</h3>
                  <p className="text-gray-600">Access your purchased courses anytime, anywhere, on any device.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100">
                    <Sparkles className="h-6 w-6 text-rose-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">AI Chat Tutor</h3>
                  <p className="text-gray-600">Get instant help with an AI-powered tutor available 24/7.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Courses Section */}
        {coursesWithCount && coursesWithCount.length > 0 && (
          <section className="bg-gray-50 py-20">
            <div className="container mx-auto px-4">
              <div className="mb-12 flex items-center justify-between">
                <div>
                  <h2 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">Featured Courses</h2>
                  <p className="text-lg text-gray-600">Start learning with our most popular courses</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/courses">View All</Link>
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {coursesWithCount.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-indigo-600 to-cyan-600 py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Start Learning?</h2>
            <p className="mb-8 text-xl text-indigo-100">
              Join our community of learners and unlock your potential today.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/auth/sign-up">Get Started for Free</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
