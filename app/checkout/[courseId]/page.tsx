import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CheckoutForm } from "@/components/checkout-form"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default async function CheckoutPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch course details
  const { data: course } = await supabase
    .from("courses")
    .select(
      `
      *,
      instructor:profiles!courses_instructor_id_fkey(full_name),
      lessons:lessons(count)
    `,
    )
    .eq("id", courseId)
    .single()

  if (!course) {
    redirect("/courses")
  }

  // Check if already enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle()

  if (enrollment) {
    redirect(`/learn/${course.slug}`)
  }

  const lessonCount = course.lessons?.[0]?.count || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link href={`/courses/${course.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Course Summary */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-2xl font-bold">Order Summary</h2>
                <div className="mb-6">
                  <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url || "/placeholder.svg"}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-cyan-100">
                        <span className="text-4xl font-bold text-indigo-600">{course.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{course.title}</h3>
                  <p className="mb-4 text-sm text-gray-600">by {course.instructor?.full_name || "Instructor"}</p>
                  {course.description && <p className="text-sm text-gray-600">{course.description}</p>}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lessons</span>
                    <span className="font-medium">{lessonCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Level</span>
                    <span className="font-medium capitalize">{course.level || "All levels"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Access</span>
                    <span className="font-medium">Lifetime</span>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-3xl font-bold text-indigo-600">
                      ${(course.price_in_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-6 text-2xl font-bold">Payment Details</h2>
                <CheckoutForm courseId={courseId} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
