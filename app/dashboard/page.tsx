import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseCard } from "@/components/course-card"
import { getRecommendedCourses } from "@/lib/recommendations"
import { BookOpen, Clock, Award, TrendingUp, PlayCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Redirect each role to its own dashboard
  if (profile?.role === "admin") {
    redirect("/admin")
  }
  if (profile?.role === "instructor") {
    redirect("/instructor/dashboard")
  }

  // Fetch enrolled courses with progress
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      course:courses(
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name),
        lessons:lessons(id)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false })

  // Fetch recent progress
  const { data: recentProgress } = await supabase
    .from("progress")
    .select(
      `
      *,
      lesson:lessons(
        title,
        course:courses(title, slug)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5)

  // Personalized recommendations (computed directly on the server).
  const recommendations = await getRecommendedCourses(supabase, user.id)

  // Calculate stats
  const totalCourses = enrollments?.length || 0
  const completedCourses = enrollments?.filter((e) => e.progress_percentage === 100).length || 0
  const inProgressCourses =
    enrollments?.filter((e) => e.progress_percentage > 0 && e.progress_percentage < 100).length || 0
  const totalLessonsCompleted = recentProgress?.filter((p) => p.completed).length || 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={{ id: user.id, email: user.email ?? "", role: profile?.role ?? "student" }} />

      <main className="flex-1 bg-gray-50">
        {/* Welcome Section */}
        <section className="border-b bg-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="mb-2 text-3xl font-bold">Welcome back, {profile?.full_name || "Student"}!</h1>
            <p className="text-gray-600">Continue your learning journey</p>
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
                    <p className="text-sm text-gray-600">Enrolled Courses</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedCourses}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inProgressCourses}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                    <Clock className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalLessonsCompleted}</p>
                    <p className="text-sm text-gray-600">Lessons Completed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="my-courses" className="w-full">
              <TabsList>
                <TabsTrigger value="my-courses">My Courses</TabsTrigger>
                <TabsTrigger value="recommendations">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Recommendations
                </TabsTrigger>
                <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="my-courses" className="mt-6">
                {enrollments && enrollments.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {enrollments.map((enrollment: any) => (
                      <Card key={enrollment.id} className="overflow-hidden">
                        <div className="relative aspect-video bg-gray-100">
                          {enrollment.course.thumbnail_url ? (
                            <Image
                              src={enrollment.course.thumbnail_url || "/placeholder.svg"}
                              alt={enrollment.course.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-cyan-100">
                              <span className="text-4xl font-bold text-indigo-600">
                                {enrollment.course.title.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="mb-2 line-clamp-2 font-semibold leading-tight">{enrollment.course.title}</h3>
                          <p className="mb-3 text-xs text-gray-600">
                            by {enrollment.course.instructor?.full_name || "Instructor"}
                          </p>
                          <div className="mb-2">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{enrollment.progress_percentage}%</span>
                            </div>
                            <Progress value={enrollment.progress_percentage} className="h-2" />
                          </div>
                          <Button asChild className="w-full" size="sm">
                            <Link href={`/learn/${enrollment.course.slug}`}>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              {enrollment.progress_percentage === 0
                                ? "Start Course"
                                : enrollment.progress_percentage === 100
                                  ? "Review Course"
                                  : "Continue Learning"}
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="mb-4 h-16 w-16 text-gray-400" />
                      <h3 className="mb-2 text-xl font-semibold">No courses yet</h3>
                      <p className="mb-6 text-gray-600">Start your learning journey by enrolling in a course</p>
                      <Button asChild>
                        <Link href="/courses">Browse Courses</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="mt-6">
                {recommendations && recommendations.length > 0 ? (
                  <div>
                    <div className="mb-6 rounded-lg bg-gradient-to-r from-indigo-50 to-cyan-50 p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                          <Sparkles className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">AI-Powered Recommendations</h3>
                          <p className="text-sm text-gray-600">
                            Courses selected based on your learning history and goals
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {recommendations.map((course: any) => (
                        <div key={course.id}>
                          <CourseCard course={course} />
                          <div className="mt-2 rounded-lg bg-indigo-50 p-3">
                            <p className="text-xs text-indigo-900">
                              <strong>Why recommended:</strong> {course.recommendationReason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Sparkles className="mb-4 h-16 w-16 text-gray-400" />
                      <h3 className="mb-2 text-xl font-semibold">No recommendations yet</h3>
                      <p className="mb-6 text-center text-gray-600">
                        Enroll in some courses to get personalized AI recommendations
                      </p>
                      <Button asChild>
                        <Link href="/courses">Browse Courses</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="recent-activity" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentProgress && recentProgress.length > 0 ? (
                      <div className="space-y-4">
                        {recentProgress.map((progress: any) => (
                          <div key={progress.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                              {progress.completed ? (
                                <Award className="h-5 w-5 text-indigo-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-indigo-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{progress.lesson?.title}</p>
                              <p className="text-sm text-gray-600">{progress.lesson?.course?.title}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {progress.completed ? "Completed" : "In Progress"} •{" "}
                                {new Date(progress.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/learn/${progress.lesson?.course?.slug}`}>View</Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-600">No recent activity</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
