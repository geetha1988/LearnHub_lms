import type { SupabaseClient } from "@supabase/supabase-js"

export interface RecommendedCourse {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  price_in_cents: number
  level: string | null
  instructor: { full_name: string | null } | null
  _count: { enrollments: number }
  recommendationReason: string
}

/**
 * Returns course recommendations for a user based on their enrollment history.
 * Deterministic and DB-driven so it works reliably during server rendering
 * (no self-HTTP calls, no external latency). Prefers courses in the same
 * categories the user has already engaged with, then fills with popular ones.
 */
export async function getRecommendedCourses(
  supabase: SupabaseClient,
  userId: string,
  limit = 6,
): Promise<RecommendedCourse[]> {
  // Courses the user is already enrolled in (to exclude).
  const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("user_id", userId)
  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id))

  // Categories the user has engaged with.
  let preferredCategoryIds: string[] = []
  if (enrolledIds.size > 0) {
    const { data: enrolledCourses } = await supabase
      .from("courses")
      .select("category_id")
      .in("id", Array.from(enrolledIds))
    preferredCategoryIds = Array.from(
      new Set((enrolledCourses ?? []).map((c) => c.category_id).filter(Boolean) as string[]),
    )
  }

  const { data: courses } = await supabase
    .from("courses")
    .select(
      `
      id, title, slug, description, thumbnail_url, price_in_cents, level, category_id,
      instructor:profiles!courses_instructor_id_fkey(full_name),
      category:categories(name),
      enrollments:enrollments(count)
    `,
    )
    .eq("is_published", true)

  const candidates = (courses ?? [])
    .filter((c) => !enrolledIds.has(c.id))
    .map((c: any) => {
      const enrollmentCount = c.enrollments?.[0]?.count ?? c.enrollments?.length ?? 0
      const inPreferred = c.category_id && preferredCategoryIds.includes(c.category_id)
      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        thumbnail_url: c.thumbnail_url,
        price_in_cents: c.price_in_cents,
        level: c.level,
        instructor: c.instructor,
        _count: { enrollments: enrollmentCount },
        recommendationReason: inPreferred
          ? `Matches your interest in ${c.category?.name ?? "this topic"}.`
          : enrollmentCount > 0
            ? `Popular with ${enrollmentCount} learner${enrollmentCount === 1 ? "" : "s"} on the platform.`
            : "Highly rated pick to broaden your skills.",
        _score: (inPreferred ? 100 : 0) + enrollmentCount,
      }
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)

  return candidates.map(({ _score, ...rest }) => rest)
}
