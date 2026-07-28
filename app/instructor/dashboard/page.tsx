import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, DollarSign, TrendingUp, Plus, Edit, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function InstructorDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Check if user is instructor or admin
  if (profile?.role !== "instructor" && profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch instructor's courses
  const { data: courses } = await supabase
    .from("courses")
    .select(
      `
      *,
      enrollments:enrollments(count),
      lessons:lessons(count),
      reviews:reviews(rating)
    `,
    )
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false })

  // Calculate stats
  const totalCourses = courses?.length || 0
  const publishedCourses = courses?.filter((c) => c.is_published).length || 0
  const totalStudents =
    courses?.reduce((acc, course) => {
      return acc + (course.enrollments?.[0]?.count || 0)
    }, 0) || 0

  const totalRevenue =
    courses?.reduce((acc, course) => {
      const enrollmentCount = course.enrollments?.[0]?.count || 0
      return acc + enrollmentCount * course.price_in_cents
    }, 0) || 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={{ id: user.id, email: user.email ?? "", role: profile?.role ?? "instructor" }} />

      <main className="flex-1 bg-gray-50">
        {/* Welcome Section */}
        <section className="border-b bg-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold">Instructor Dashboard</h1>
                <p className="text-gray-600">Manage your courses and track your performance</p>
              </div>
              <Button asChild>
                <Link href="/instructor/courses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalCourses}</p>
                    <p className="text-sm text-gray-600">Total Courses</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{publishedCourses}</p>
                    <p className="text-sm text-gray-600">Published</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                    <Users className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalStudents}</p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                    <DollarSign className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(0)}</p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {courses && courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map((course: any) => {
                      const enrollmentCount = course.enrollments?.[0]?.count || 0
                      const lessonCount = course.lessons?.[0]?.count || 0
                      const avgRating =
                        course.reviews && course.reviews.length > 0
                          ? course.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / course.reviews.length
                          : 0

                      return (
                        <div key={course.id} className="flex items-center gap-4 rounded-lg border p-4">
                          <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {course.thumbnail_url ? (
                              <Image
                                src={course.thumbnail_url || "/placeholder.svg"}
                                alt={course.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-cyan-100">
                                <span className="text-2xl font-bold text-indigo-600">{course.title.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 flex items-start justify-between">
                              <div>
                                <h3 className="mb-1 font-semibold">{course.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant={course.is_published ? "default" : "secondary"}>
                                    {course.is_published ? "Published" : "Draft"}
                                  </Badge>
                                  {course.level && <Badge variant="outline">{course.level}</Badge>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/courses/${course.slug}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/instructor/courses/${course.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <span>{enrollmentCount} students</span>
                              <span>{lessonCount} lessons</span>
                              {avgRating > 0 && <span>⭐ {avgRating.toFixed(1)}</span>}
                              <span className="font-medium text-indigo-600">
                                ${(course.price_in_cents / 100).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="mb-4 h-16 w-16 text-gray-400" />
                    <h3 className="mb-2 text-xl font-semibold">No courses yet</h3>
                    <p className="mb-6 text-gray-600">Create your first course and start teaching</p>
                    <Button asChild>
                      <Link href="/instructor/courses/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Course
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
