import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { z } from "zod"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch user's enrolled courses and progress
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      course:courses(
        id,
        title,
        category:categories(name),
        level
      )
    `,
    )
    .eq("user_id", user.id)

  // Fetch all available courses
  const { data: allCourses } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      description,
      category:categories(name),
      level
    `,
    )
    .eq("is_published", true)
    .limit(20)

  if (!allCourses || allCourses.length === 0) {
    return Response.json({ recommendations: [] })
  }

  // Build user profile
  const enrolledCourses = enrollments?.map((e: any) => e.course) || []
  const categories = [...new Set(enrolledCourses.map((c: any) => c.category?.name).filter(Boolean))]
  const levels = [...new Set(enrolledCourses.map((c: any) => c.level).filter(Boolean))]

  const userProfile = {
    enrolledCourses: enrolledCourses.map((c: any) => c.title),
    preferredCategories: categories,
    currentLevels: levels,
  }

  // Use AI to generate recommendations
  const { object } = await generateObject({
    model: "openai/gpt-4o-mini",
    schema: z.object({
      recommendations: z.array(
        z.object({
          courseId: z.string(),
          reason: z.string(),
          score: z.number().min(0).max(100),
        }),
      ),
    }),
    prompt: `You are a course recommendation system for an online learning platform.

User Profile:
- Enrolled Courses: ${userProfile.enrolledCourses.join(", ") || "None"}
- Preferred Categories: ${userProfile.preferredCategories.join(", ") || "None"}
- Current Levels: ${userProfile.currentLevels.join(", ") || "Beginner"}

Available Courses:
${allCourses.map((c: any) => `- ID: ${c.id}, Title: ${c.title}, Category: ${c.category?.name || "N/A"}, Level: ${c.level || "N/A"}, Description: ${c.description || "N/A"}`).join("\n")}

Recommend up to 5 courses that would be most beneficial for this user. Consider:
1. Courses that complement their current learning path
2. Appropriate difficulty progression
3. Diverse but related topics
4. Courses they haven't enrolled in yet

For each recommendation, provide:
- courseId: The course ID
- reason: A brief explanation (1-2 sentences) why this course is recommended
- score: A relevance score from 0-100`,
  })

  // Fetch full course details for recommendations
  const recommendedCourseIds = object.recommendations.map((r) => r.courseId)
  const { data: recommendedCourses } = await supabase
    .from("courses")
    .select(
      `
      *,
      instructor:profiles!courses_instructor_id_fkey(full_name),
      category:categories(name),
      enrollments:enrollments(count)
    `,
    )
    .in("id", recommendedCourseIds)

  // Merge recommendations with course details
  const recommendations = object.recommendations
    .map((rec) => {
      const course = recommendedCourses?.find((c) => c.id === rec.courseId)
      if (!course) return null
      return {
        ...course,
        recommendationReason: rec.reason,
        recommendationScore: rec.score,
        _count: {
          enrollments: course.enrollments?.[0]?.count || 0,
        },
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)

  return Response.json({ recommendations })
}
