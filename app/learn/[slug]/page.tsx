import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VideoPlayer } from "@/components/video-player"
import { LessonSidebar } from "@/components/lesson-sidebar"
import { AIChat } from "@/components/ai-chat"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function LearnCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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
      lessons:lessons(*, materials:lesson_materials(*))
    `,
    )
    .eq("slug", slug)
    .single()

  if (!course) {
    redirect("/courses")
  }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle()

  if (!enrollment) {
    redirect(`/courses/${slug}`)
  }

  // Fetch progress for all lessons
  const { data: progressData } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", course.id)

  const sortedLessons =
    course.lessons
      ?.sort((a: any, b: any) => a.order_index - b.order_index)
      .map((lesson: any) => ({
        ...lesson,
        materials: (lesson.materials || []).sort((a: any, b: any) => a.order_index - b.order_index),
      })) || []

  // Find first incomplete lesson or first lesson
  const firstIncompleteLesson =
    sortedLessons.find((lesson: any) => {
      const progress = progressData?.find((p) => p.lesson_id === lesson.id)
      return !progress?.completed
    }) || sortedLessons[0]

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">{course.title}</h1>
            <p className="text-xs text-gray-600">by {course.instructor?.full_name}</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">{enrollment.progress_percentage}% Complete</div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Player Area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <VideoPlayer
            courseId={course.id}
            lessons={sortedLessons}
            initialLessonId={firstIncompleteLesson?.id}
            progressData={progressData || []}
            userId={user.id}
          />
        </div>

        {/* Lesson Sidebar */}
        <LessonSidebar
          lessons={sortedLessons}
          courseId={course.id}
          progressData={progressData || []}
          currentLessonId={firstIncompleteLesson?.id}
        />
      </div>

      {/* AI Chat Assistant */}
      <AIChat courseId={course.id} lessonId={firstIncompleteLesson?.id} />
    </div>
  )
}
