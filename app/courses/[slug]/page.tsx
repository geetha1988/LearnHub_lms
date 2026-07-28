import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Users, Award, Star, PlayCircle, FileText } from "lucide-react"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let headerUser = null
  if (user) {
    const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    headerUser = { id: user.id, email: user.email ?? "", role: userProfile?.role ?? "student" }
  }

  // Fetch course details
  const { data: course } = await supabase
    .from("courses")
    .select(
      `
      *,
      instructor:profiles!courses_instructor_id_fkey(*),
      category:categories(name),
      lessons:lessons(id, title, duration_minutes, is_free, order_index),
      enrollments:enrollments(count),
      reviews:reviews(id, rating, comment, created_at, user:profiles(full_name, avatar_url))
    `,
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!course) {
    notFound()
  }

  // Check if user is enrolled
  let isEnrolled = false
  if (user) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle()
    isEnrolled = !!enrollment
  }

  const price = course.price_in_cents === 0 ? "Free" : `$${(course.price_in_cents / 100).toFixed(2)}`
  const enrollmentCount = course.enrollments?.length || 0
  const avgRating =
    course.reviews && course.reviews.length > 0
      ? course.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / course.reviews.length
      : 0

  const sortedLessons = course.lessons?.sort((a: any, b: any) => a.order_index - b.order_index) || []
  const totalDuration = sortedLessons.reduce((acc: number, lesson: any) => acc + (lesson.duration_minutes || 0), 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={headerUser} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-900 to-cyan-900 py-12 text-white">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {course.category && <Badge variant="secondary">{course.category.name}</Badge>}
                  {course.level && <Badge variant="outline">{course.level}</Badge>}
                </div>
                <h1 className="mb-4 text-4xl font-bold text-balance">{course.title}</h1>
                <p className="mb-6 text-lg text-indigo-100 text-pretty">{course.description}</p>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={course.instructor.avatar_url || undefined} />
                      <AvatarFallback>{course.instructor.full_name?.charAt(0) || "I"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{course.instructor.full_name || "Instructor"}</p>
                      <p className="text-xs text-indigo-200">Instructor</p>
                    </div>
                  </div>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{avgRating.toFixed(1)}</span>
                      <span className="text-indigo-200">({course.reviews?.length} reviews)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{enrollmentCount} students</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    {course.thumbnail_url ? (
                      <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
                        <Image
                          src={course.thumbnail_url || "/placeholder.svg"}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-cyan-100">
                        <PlayCircle className="h-16 w-16 text-indigo-600" />
                      </div>
                    )}
                    <div className="mb-4 text-3xl font-bold text-indigo-600">{price}</div>
                    {isEnrolled ? (
                      <Button asChild className="w-full" size="lg">
                        <Link href={`/learn/${course.slug}`}>Continue Learning</Link>
                      </Button>
                    ) : course.price_in_cents === 0 ? (
                      <Button asChild className="w-full" size="lg">
                        <Link href={`/checkout/${course.id}`}>Enroll for Free</Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full" size="lg">
                        <Link href={`/checkout/${course.id}`}>Enroll Now</Link>
                      </Button>
                    )}
                    <Separator className="my-4" />
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{Math.floor(totalDuration / 60)} hours of content</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-gray-500" />
                        <span>{sortedLessons.length} lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-gray-500" />
                        <span>Certificate of completion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>Lifetime access</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {/* Lessons */}
                <div className="mb-8">
                  <h2 className="mb-4 text-2xl font-bold">Course Content</h2>
                  <Card>
                    <CardContent className="p-0">
                      {sortedLessons.map((lesson: any, index: number) => (
                        <div key={lesson.id}>
                          {index > 0 && <Separator />}
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                {lesson.is_free && (
                                  <Badge variant="secondary" className="mt-1">
                                    Free Preview
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{lesson.duration_minutes} min</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Reviews */}
                {course.reviews && course.reviews.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-2xl font-bold">Student Reviews</h2>
                    <div className="space-y-4">
                      {course.reviews.map((review: any) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={review.user?.avatar_url || undefined} />
                                  <AvatarFallback>{review.user?.full_name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{review.user?.full_name || "Anonymous"}</p>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < review.rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "fill-gray-200 text-gray-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && <p className="text-gray-600">{review.comment}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                {/* Instructor Info */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">About the Instructor</h3>
                    <div className="mb-4 flex items-center gap-3">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={course.instructor.avatar_url || undefined} />
                        <AvatarFallback className="text-lg">
                          {course.instructor.full_name?.charAt(0) || "I"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{course.instructor.full_name || "Instructor"}</p>
                        <p className="text-sm text-gray-600">Expert Instructor</p>
                      </div>
                    </div>
                    {course.instructor.bio && <p className="text-sm text-gray-600">{course.instructor.bio}</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
