import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CourseCard } from "@/components/course-card"
import { CourseFilters } from "@/components/course-filters"

export const dynamic = "force-dynamic"

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; level?: string; search?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let headerUser = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    headerUser = { id: user.id, email: user.email ?? "", role: profile?.role ?? "student" }
  }

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  // Resolve category param (accept either a slug or a raw id) to a category id.
  let categoryId: string | undefined
  if (params.category && params.category !== "all") {
    const match = categories?.find((c) => c.slug === params.category || c.id === params.category)
    categoryId = match?.id
  }

  // Build query
  let query = supabase
    .from("courses")
    .select(
      `
      *,
      instructor:profiles!courses_instructor_id_fkey(full_name),
      category:categories(name),
      enrollments:enrollments(count)
    `,
    )
    .eq("is_published", true)

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  if (params.level && params.level !== "all") {
    query = query.eq("level", params.level)
  }

  if (params.search) {
    query = query.ilike("title", `%${params.search}%`)
  }

  const { data: courses } = await query.order("created_at", { ascending: false })

  const coursesWithCount = courses?.map((course) => ({
    ...course,
    _count: {
      enrollments: course.enrollments?.length || 0,
    },
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={headerUser} />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12">
          <div className="container mx-auto px-4">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">Explore Courses</h1>
            <p className="text-lg text-gray-600">Discover your next learning adventure</p>
          </div>
        </section>

        {/* Filters and Courses */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <CourseFilters
              categories={categories ?? []}
              initial={{ category: params.category, level: params.level, search: params.search }}
            />

            {/* Courses Grid */}
            {coursesWithCount && coursesWithCount.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {coursesWithCount.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-lg text-gray-600">No courses found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
